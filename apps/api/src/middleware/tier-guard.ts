import { Request, Response, NextFunction } from "express";
import { getDatabaseClient, UserRepository } from "@handoverkey/database";

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
 * Attach after authentication middleware.
 */
export function requireVaultCapacity(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userId = (req as unknown as { user: { id: string } }).user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const db = getDatabaseClient().getKysely();

  Promise.all([
    new UserRepository(db).findById(userId),
    db
      .selectFrom("vault_entries")
      .select(({ fn }) => fn.countAll<number>().as("count"))
      .where("user_id", "=", userId)
      .executeTakeFirstOrThrow(),
  ])
    .then(([user, result]) => {
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const tier = user.subscription_tier || "free";
      const limits = getTierLimits(tier);
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
 * Attach after authentication middleware.
 */
export function requireSuccessorCapacity(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userId = (req as unknown as { user: { id: string } }).user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const db = getDatabaseClient().getKysely();

  Promise.all([
    new UserRepository(db).findById(userId),
    db
      .selectFrom("successors")
      .select(({ fn }) => fn.countAll<number>().as("count"))
      .where("user_id", "=", userId)
      .executeTakeFirstOrThrow(),
  ])
    .then(([user, result]) => {
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const tier = user.subscription_tier || "free";
      const limits = getTierLimits(tier);
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
