import { Kysely, PostgresDialect, Transaction } from "kysely";
import { Pool, PoolConfig } from "pg";
import { Database } from "./types";
import { ConnectionError, QueryError, TransactionError } from "./errors";

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  min?: number;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export class DatabaseClient {
  private pool: Pool | null = null;
  private kysely: Kysely<Database> | null = null;
  private config: DatabaseConfig | null = null;
  private shuttingDown = false;

  private readonly handlePoolError = (error: Error): void => {
    if (this.shuttingDown && this.isExpectedShutdownError(error)) {
      return;
    }

    // Keep a listener attached so pool errors do not surface as unhandled events.
    // Unexpected errors are still visible for diagnostics.
    console.error("Database pool error", error);
  };

  /**
   * Initializes the database connection pool
   */
  async initialize(config: DatabaseConfig): Promise<void> {
    if (this.pool) {
      throw new ConnectionError("Database already initialized");
    }

    this.shuttingDown = false;
    this.config = config;

    const poolConfig: PoolConfig = {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      min: config.min ?? 2,
      max: config.max ?? 10,
      idleTimeoutMillis: config.idleTimeoutMillis ?? 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis ?? 30000,
    };

    try {
      this.pool = new Pool(poolConfig);
      this.pool.on("error", this.handlePoolError);

      // Test connection
      const client = await this.pool.connect();
      client.release();

      // Initialize Kysely
      this.kysely = new Kysely<Database>({
        dialect: new PostgresDialect({
          pool: this.pool,
        }),
      });
    } catch (error) {
      if (this.kysely) {
        try {
          await this.kysely.destroy();
        } catch {
          // Ignore cleanup errors while handling initialization failure.
        }
        this.kysely = null;
      }

      if (this.pool) {
        this.pool.off("error", this.handlePoolError);
        try {
          await this.pool.end();
        } catch {
          // Ignore cleanup errors while handling initialization failure.
        }
        this.pool = null;
      }

      throw new ConnectionError(
        `Failed to initialize database: ${error instanceof Error ? error.message : "Unknown error"}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Gets the Kysely instance
   */
  getKysely(): Kysely<Database> {
    if (!this.kysely) {
      throw new ConnectionError("Database not initialized");
    }
    return this.kysely;
  }

  /**
   * Executes a query with automatic retry logic
   */
  async query<T>(
    queryFn: (db: Kysely<Database>) => Promise<T>,
    maxRetries: number = 3,
  ): Promise<T> {
    if (!this.kysely) {
      throw new ConnectionError("Database not initialized");
    }

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        return await queryFn(this.kysely);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        attempt++;

        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw new QueryError(`Query failed: ${lastError.message}`, lastError);
        }

        // Exponential backoff
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new QueryError(
      `Query failed after ${maxRetries} attempts: ${lastError?.message}`,
      lastError ?? undefined,
    );
  }

  /**
   * Executes a transaction
   */
  async transaction<T>(
    txFn: (trx: Transaction<Database>) => Promise<T>,
  ): Promise<T> {
    if (!this.kysely) {
      throw new ConnectionError("Database not initialized");
    }

    try {
      return await this.kysely.transaction().execute(txFn);
    } catch (error) {
      throw new TransactionError(
        `Transaction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.pool) {
      return false;
    }

    let client;
    try {
      client = await this.pool.connect();
      await client.query("SELECT 1");
      return true;
    } catch {
      return false;
    } finally {
      client?.release();
    }
  }

  /**
   * Closes the database connection
   */
  async close(): Promise<void> {
    this.shuttingDown = true;

    if (this.kysely) {
      try {
        await this.kysely.destroy();
      } catch {
        // Ignore errors during shutdown.
      }
      this.kysely = null;
    }

    if (this.pool) {
      try {
        await this.pool.end();
      } catch (error) {
        if (!this.isExpectedShutdownError(error)) {
          // Ignore unexpected close errors to keep shutdown idempotent.
        }
      } finally {
        this.pool.off("error", this.handlePoolError);
        this.pool = null;
      }
    }

    this.shuttingDown = false;
  }

  /**
   * Determines if an error should not be retried
   */
  private isNonRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const message = error.message.toLowerCase();

    // Don't retry on syntax errors, constraint violations, etc.
    return (
      message.includes("syntax error") ||
      message.includes("constraint") ||
      message.includes("duplicate key") ||
      message.includes("foreign key") ||
      message.includes("not null violation")
    );
  }

  /**
   * Errors that are expected while the database or process is shutting down.
   */
  private isExpectedShutdownError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const code = this.getErrorCode(error);
    if (code === "57P01") {
      return true;
    }

    const message = error.message.toLowerCase();
    return (
      message.includes("terminating connection due to administrator command") ||
      message.includes("connection terminated unexpectedly") ||
      message.includes("connection closed")
    );
  }

  private getErrorCode(error: Error): string | undefined {
    const code = (error as Error & { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
}

// Singleton instance
let dbClient: DatabaseClient | null = null;

export function getDatabaseClient(): DatabaseClient {
  if (!dbClient) {
    dbClient = new DatabaseClient();
  }
  return dbClient;
}
