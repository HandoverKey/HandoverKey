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

  /**
   * Revokes a token if active. Returns true when this call performed the
   * revocation (i.e. won the race), false if it was already revoked/unknown.
   */
  static async revoke(token: string): Promise<boolean> {
    return await this.getRepository().revokeByTokenHash(this.hashToken(token));
  }

  static async revokeAllForUser(userId: string): Promise<void> {
    await this.getRepository().revokeAllForUser(userId);
  }

  /**
   * Rotates a refresh token: atomically revokes the presented token and, only
   * if this call won the revocation race, stores the replacement. Returns false
   * if the presented token was already revoked (replay/concurrent use), in which
   * case no new token is issued.
   */
  static async rotate(
    userId: string,
    oldToken: string,
    newToken: string,
  ): Promise<boolean> {
    const revoked = await this.revoke(oldToken);
    if (!revoked) {
      return false;
    }
    await this.store(userId, newToken);
    return true;
  }
}
