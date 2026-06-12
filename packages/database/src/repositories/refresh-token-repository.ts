import { Kysely } from "kysely";
import { Database, RefreshToken, NewRefreshToken } from "../types";
import { QueryError } from "../errors";

export class RefreshTokenRepository {
  constructor(private db: Kysely<Database>) {}

  async create(data: NewRefreshToken): Promise<RefreshToken> {
    try {
      return await this.db
        .insertInto("refresh_tokens")
        .values(data)
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (error) {
      throw new QueryError(
        `Failed to create refresh token: ${error instanceof Error ? error.message : "Unknown error"}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Returns the token row only if it exists, is not revoked, and not expired.
   */
  async findActiveByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    try {
      const token = await this.db
        .selectFrom("refresh_tokens")
        .selectAll()
        .where("token_hash", "=", tokenHash)
        .where("revoked_at", "is", null)
        .where("expires_at", ">", new Date())
        .executeTakeFirst();

      return token ?? null;
    } catch (error) {
      throw new QueryError(
        `Failed to find refresh token: ${error instanceof Error ? error.message : "Unknown error"}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async revokeByTokenHash(tokenHash: string): Promise<void> {
    try {
      await this.db
        .updateTable("refresh_tokens")
        .set({ revoked_at: new Date() })
        .where("token_hash", "=", tokenHash)
        .where("revoked_at", "is", null)
        .execute();
    } catch (error) {
      throw new QueryError(
        `Failed to revoke refresh token: ${error instanceof Error ? error.message : "Unknown error"}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async revokeAllForUser(userId: string): Promise<void> {
    try {
      await this.db
        .updateTable("refresh_tokens")
        .set({ revoked_at: new Date() })
        .where("user_id", "=", userId)
        .where("revoked_at", "is", null)
        .execute();
    } catch (error) {
      throw new QueryError(
        `Failed to revoke user refresh tokens: ${error instanceof Error ? error.message : "Unknown error"}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async deleteExpired(): Promise<number> {
    try {
      const result = await this.db
        .deleteFrom("refresh_tokens")
        .where("expires_at", "<", new Date())
        .executeTakeFirst();

      return Number(result.numDeletedRows);
    } catch (error) {
      throw new QueryError(
        `Failed to delete expired refresh tokens: ${error instanceof Error ? error.message : "Unknown error"}`,
        error instanceof Error ? error : undefined,
      );
    }
  }
}
