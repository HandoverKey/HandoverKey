import crypto from "crypto";
import {
  getDatabaseClient,
  RefreshTokenRepository,
} from "@handoverkey/database";
import { JWTManager } from "../auth/jwt";
import { logger } from "../config/logger";

/**
 * Server-side refresh-token tracking. Refresh tokens are stored as SHA-256
 * hashes so they can be rotated on every use and revoked on logout, password
 * reset/change, and account deletion. A stolen-but-revoked refresh token can no
 * longer mint new access tokens.
 */
export class RefreshTokenService {
  private static getRepository(): RefreshTokenRepository {
    const dbClient = getDatabaseClient();
    return new RefreshTokenRepository(dbClient.getKysely());
  }

  static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /** Persist the hash of a newly issued refresh token. */
  static async store(userId: string, token: string): Promise<void> {
    try {
      await this.getRepository().create({
        user_id: userId,
        token_hash: this.hashToken(token),
        expires_at: JWTManager.getRefreshTokenExpiry(),
      });
    } catch (error) {
      logger.error({ err: error, userId }, "Failed to store refresh token");
      throw error;
    }
  }

  /** True if the token is known, not revoked, and not expired. */
  static async isActive(token: string): Promise<boolean> {
    const row = await this.getRepository().findActiveByTokenHash(
      this.hashToken(token),
    );
    return row !== null;
  }

  static async revoke(token: string): Promise<void> {
    await this.getRepository().revokeByTokenHash(this.hashToken(token));
  }

  static async revokeAllForUser(userId: string): Promise<void> {
    await this.getRepository().revokeAllForUser(userId);
  }

  /**
   * Rotates a refresh token: revokes the presented token and stores the new one.
   */
  static async rotate(
    userId: string,
    oldToken: string,
    newToken: string,
  ): Promise<void> {
    await this.revoke(oldToken);
    await this.store(userId, newToken);
  }
}
