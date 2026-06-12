import { getDatabaseClient } from "@handoverkey/database";
import { sql } from "kysely";

/**
 * Guards the single migration system: everything migrate:prod must apply is
 * present after the canonical migration list runs in global-setup. Previously
 * the waitlist table and subscription columns only existed via the orphaned
 * Kysely migrations / tests, so production migrate:prod left them missing.
 */
describe("Migration consolidation", () => {
  beforeAll(async () => {
    const dbClient = getDatabaseClient();
    await dbClient.initialize({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: "handoverkey_test",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      min: 1,
      max: 5,
    });
  });

  afterAll(async () => {
    await getDatabaseClient().close();
  });

  const tableExists = async (table: string): Promise<boolean> => {
    const db = getDatabaseClient().getKysely();
    const result = await sql<{ exists: boolean }>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = ${table}
      ) AS exists
    `.execute(db);
    return result.rows[0]?.exists ?? false;
  };

  const columnExists = async (
    table: string,
    column: string,
  ): Promise<boolean> => {
    const db = getDatabaseClient().getKysely();
    const result = await sql<{ exists: boolean }>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ${table}
          AND column_name = ${column}
      ) AS exists
    `.execute(db);
    return result.rows[0]?.exists ?? false;
  };

  it("creates the waitlist table", async () => {
    expect(await tableExists("waitlist")).toBe(true);
  });

  it("adds subscription columns to users", async () => {
    expect(await columnExists("users", "subscription_tier")).toBe(true);
    expect(await columnExists("users", "stripe_customer_id")).toBe(true);
    expect(await columnExists("users", "subscription_status")).toBe(true);
  });

  it("applies ON DELETE CASCADE to user_id foreign keys", async () => {
    const db = getDatabaseClient().getKysely();
    const result = await sql<{ delete_rule: string }>`
      SELECT rc.delete_rule
      FROM information_schema.referential_constraints rc
      JOIN information_schema.key_column_usage kcu
        ON kcu.constraint_name = rc.constraint_name
      WHERE kcu.table_name = 'sessions' AND kcu.column_name = 'user_id'
    `.execute(db);

    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].delete_rule).toBe("CASCADE");
  });
});
