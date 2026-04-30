import { Kysely } from "kysely";
import { Database, WaitlistEntry, NewWaitlistEntry } from "../types";
import { QueryError } from "../errors";

export class WaitlistRepository {
  constructor(private db: Kysely<Database>) {}

  async findByEmail(email: string): Promise<WaitlistEntry | null> {
    try {
      const entry = await this.db
        .selectFrom("waitlist")
        .selectAll()
        .where("email", "=", email)
        .executeTakeFirst();

      return entry ?? null;
    } catch (error) {
      throw new QueryError(
        `Failed to find waitlist entry by email: ${error instanceof Error ? error.message : "Unknown error"}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async create(data: NewWaitlistEntry): Promise<WaitlistEntry> {
    try {
      const entry = await this.db
        .insertInto("waitlist")
        .values(data)
        .returningAll()
        .executeTakeFirstOrThrow();

      return entry;
    } catch (error) {
      throw new QueryError(
        `Failed to create waitlist entry: ${error instanceof Error ? error.message : "Unknown error"}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async count(): Promise<number> {
    try {
      const result = await this.db
        .selectFrom("waitlist")
        .select(({ fn }) => fn.countAll<number>().as("count"))
        .executeTakeFirstOrThrow();

      return Number(result.count);
    } catch (error) {
      throw new QueryError(
        `Failed to count waitlist entries: ${error instanceof Error ? error.message : "Unknown error"}`,
        error instanceof Error ? error : undefined,
      );
    }
  }
}
