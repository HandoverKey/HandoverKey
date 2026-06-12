import { readFileSync } from "fs";
import { join } from "path";
import { DatabaseClient, getDatabaseClient } from "@handoverkey/database";

const MIGRATION_FILES = [
  "users.sql",
  "successors.sql",
  "vault.sql",
  "sessions.sql",
  "simplified_schema.sql",
  "add_vault_salt.sql",
  "add_missing_user_columns.sql",
  "fix_schema_mismatch.sql",
  "add_missing_dms_tables.sql",
  "ensure_last_activity.sql",
  "add_require_majority.sql",
  "add_vault_deleted_at.sql",
  "add_name_to_users.sql",
  "add_email_verification_to_users.sql",
  "add_encrypted_share_to_successors.sql",
  "add_metadata_to_handover_processes.sql",
  "add_two_factor_recovery_codes.sql",
  "add_successor_vault_assignments.sql",
  "add_subscription_fields.sql",
  "create_waitlist_table.sql",
  "hard_delete_cascades.sql",
];

import { Generated } from "kysely";

interface Migration {
  id: Generated<number>;
  name: string;
  applied_at: Date;
}

function parsePositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const DB_INIT_MAX_RETRIES = parsePositiveIntEnv("DB_INIT_MAX_RETRIES", 15);
const DB_INIT_RETRY_BASE_MS = parsePositiveIntEnv(
  "DB_INIT_RETRY_BASE_MS",
  1000,
);
const DB_INIT_RETRY_MAX_MS = parsePositiveIntEnv("DB_INIT_RETRY_MAX_MS", 30000);

const TRANSIENT_ERROR_CODES = new Set([
  "57P01",
  "57P03",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "ETIMEDOUT",
]);

const TRANSIENT_ERROR_MESSAGES = [
  "database system is in recovery mode",
  "database system is not accepting connections",
  "database system is starting up",
  "terminating connection due to administrator command",
  "connection terminated unexpectedly",
  "getaddrinfo eai_again",
  "connection refused",
  "connection reset",
  "timed out",
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractErrorCode(error: unknown, depth = 0): string | undefined {
  if (!(error instanceof Error) || depth > 4) {
    return undefined;
  }

  const directCode = (error as Error & { code?: unknown }).code;
  if (typeof directCode === "string" && directCode.length > 0) {
    return directCode;
  }

  const originalError = (error as Error & { originalError?: unknown })
    .originalError;
  if (originalError instanceof Error) {
    return extractErrorCode(originalError, depth + 1);
  }

  const cause = (error as Error & { cause?: unknown }).cause;
  if (cause instanceof Error) {
    return extractErrorCode(cause, depth + 1);
  }

  return undefined;
}

function extractErrorMessage(error: unknown, depth = 0): string {
  if (!(error instanceof Error) || depth > 4) {
    return String(error);
  }

  const originalError = (error as Error & { originalError?: unknown })
    .originalError;
  if (originalError instanceof Error) {
    return `${error.message} | ${extractErrorMessage(originalError, depth + 1)}`;
  }

  return error.message;
}

function isTransientInitError(error: unknown): boolean {
  const code = extractErrorCode(error)?.toUpperCase();
  if (code && TRANSIENT_ERROR_CODES.has(code)) {
    return true;
  }

  const message = extractErrorMessage(error).toLowerCase();
  return TRANSIENT_ERROR_MESSAGES.some((fragment) =>
    message.includes(fragment),
  );
}

function calculateRetryDelay(attempt: number): number {
  const exponentialDelay = Math.min(
    DB_INIT_RETRY_BASE_MS * Math.pow(2, attempt - 1),
    DB_INIT_RETRY_MAX_MS,
  );
  const jitter = Math.floor(
    Math.random() * Math.max(250, exponentialDelay * 0.2),
  );
  return exponentialDelay + jitter;
}

async function initializeDatabaseWithRetry(
  dbClient: DatabaseClient,
): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= DB_INIT_MAX_RETRIES; attempt++) {
    try {
      await dbClient.initialize({
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432"),
        database: process.env.DB_NAME || "handoverkey_dev",
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        min: 2,
        max: 10,
      });

      const isConnected = await dbClient.healthCheck();
      if (!isConnected) {
        throw new Error("Database health check failed after initialization");
      }

      if (attempt > 1) {
        console.log(
          `Database connection established after ${attempt} attempts`,
        );
      } else {
        console.log("Database connection established");
      }

      return;
    } catch (error) {
      lastError = error;
      await dbClient.close();

      const retryable = isTransientInitError(error);
      const hasAttemptsLeft = attempt < DB_INIT_MAX_RETRIES;
      if (!retryable || !hasAttemptsLeft) {
        throw error;
      }

      const delay = calculateRetryDelay(attempt);
      console.warn(
        `Database initialization attempt ${attempt}/${DB_INIT_MAX_RETRIES} failed: ${extractErrorMessage(error)}. Retrying in ${delay}ms...`,
      );
      await sleep(delay);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Database initialization failed with an unknown error");
}

async function runMigrations(): Promise<void> {
  const dbClient = getDatabaseClient();

  try {
    console.log("Starting database migrations...");
    await initializeDatabaseWithRetry(dbClient);

    // Ensure the migrations table exists before proceeding
    const createMigrationsTableSQL = readFileSync(
      join(__dirname, "schema", "migrations_table.sql"),
      "utf8",
    );

    await dbClient.query(async (db) => {
      // Execute raw SQL using sql template tag
      const { sql } = await import("kysely");
      await sql.raw(createMigrationsTableSQL).execute(db);
    });
    console.log("✓ Ensured migrations table exists");

    for (const migrationFile of MIGRATION_FILES) {
      if (migrationFile === "migrations_table.sql") {
        continue; // Skip the migrations_table.sql as it's handled separately
      }

      const existingMigration = await dbClient.query(async (db) => {
        // We need to cast db to include the migrations table since it's not in the main schema
        return await db
          .withTables<{ migrations: Migration }>()
          .selectFrom("migrations")
          .selectAll()
          .where("name", "=", migrationFile)
          .executeTakeFirst();
      });

      if (existingMigration) {
        console.log(`Skipping migration: ${migrationFile} (already applied)`);
        continue;
      }

      console.log(`Running migration: ${migrationFile}`);

      const migrationPath = join(__dirname, "schema", migrationFile);
      const migrationSQL = readFileSync(migrationPath, "utf8");

      await dbClient.query(async (db) => {
        // Execute raw SQL using sql template tag
        const { sql } = await import("kysely");
        await sql.raw(migrationSQL).execute(db);
        await db
          .withTables<{ migrations: Migration }>()
          .insertInto("migrations")
          .values({ name: migrationFile, applied_at: new Date() })
          .execute();
      });

      console.log(`✓ Completed migration: ${migrationFile}`);
    }

    console.log("All migrations completed successfully");
  } finally {
    await dbClient.close();
  }
}

if (require.main === module) {
  runMigrations().catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
}

export { runMigrations };
