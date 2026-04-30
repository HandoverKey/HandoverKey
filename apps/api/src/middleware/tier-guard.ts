import { Request, Response, NextFunction } from "express";
import { getDatabaseClient } from "@handoverkey/database";
import { sql } from "kysely";

export interface TierLimits {
  maxVaultEntries: number;
  maxSuccessors: number;
}

const TIER_LIMITS: Record<string, TierLimits> = {
  free: { maxVaultEntries: 5, maxSuccessors: 1 },
  pro: { maxVaultEntries: Infinity, maxSuccessors: 5 },
  family: { maxVaultEntries: Infinity, maxSuccessors: Infinity },
};

export function getTierLimits(tier: string): TierLimits {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

/**
 * Middleware that checks if the user has reached their vault entry limit.
 * Uses SELECT ... FOR UPDATE to prevent race conditions with concurrent requests.
 * Attach after authentication middleware.
 */
export function requireVaultCapacity(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userId = (req as unknown as { user: { userId: string } }).user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const db = getDatabaseClient().getKysely();

  db.transaction()
    .execute(async (trx) => {
      // Lock the user row to prevent concurrent tier-check bypass
      const user = await trx
        .selectFrom("users")
        .selectAll()
        .where("id", "=", userId)
        .forUpdate()
        .executeTakeFirst();

      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const tier = user.subscription_tier || "free";
      const limits = getTierLimits(tier);

      if (limits.maxVaultEntries === Infinity) {
        next();
        return;
      }

      const result = await trx
        .selectFrom("vault_entries")
        .select(sql<number>`count(*)`.as("count"))
        .where("user_id", "=", userId)
        .executeTakeFirstOrThrow();

      const currentCount = Number(result.count);

      if (currentCount >= limits.maxVaultEntries) {
        res.status(403).json({
          error: "Vault entry limit reached",
          limit: limits.maxVaultEntries,
          current: currentCount,
          tier,
          upgrade: tier === "free" ? "pro" : "family",
        });
        return;
      }

      next();
    })
    .catch(next);
}

/**
 * Middleware that checks if the user has reached their successor limit.
 * Uses SELECT ... FOR UPDATE to prevent race conditions with concurrent requests.
 * Attach after authentication middleware.
 */
export function requireSuccessorCapacity(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userId = (req as unknown as { user: { userId: string } }).user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const db = getDatabaseClient().getKysely();

  db.transaction()
    .execute(async (trx) => {
      // Lock the user row to prevent concurrent tier-check bypass
      const user = await trx
        .selectFrom("users")
        .selectAll()
        .where("id", "=", userId)
        .forUpdate()
        .executeTakeFirst();

      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const tier = user.subscription_tier || "free";
      const limits = getTierLimits(tier);

      if (limits.maxSuccessors === Infinity) {
        next();
        return;
      }

      const result = await trx
        .selectFrom("successors")
        .select(sql<number>`count(*)`.as("count"))
        .where("user_id", "=", userId)
        .executeTakeFirstOrThrow();

      const currentCount = Number(result.count);

      if (currentCount >= limits.maxSuccessors) {
        res.status(403).json({
          error: "Successor limit reached",
          limit: limits.maxSuccessors,
          current: currentCount,
          tier,
          upgrade: tier === "free" ? "pro" : "family",
        });
        return;
      }

      next();
    })
    .catch(next);
}
