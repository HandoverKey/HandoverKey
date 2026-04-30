import { Request, Response, NextFunction } from "express";
import { StripeService, isStripeEnabled } from "../services/stripe-service";
import { getDatabaseClient, UserRepository } from "@handoverkey/database";
import { logger } from "../config/logger";

export class BillingController {
  static async createCheckoutSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!isStripeEnabled()) {
        res.status(503).json({ error: "Billing is not configured" });
        return;
      }

      const { priceId } = req.body;
      if (!priceId) {
        res.status(400).json({ error: "priceId is required" });
        return;
      }

      // Resolve tier name to actual Stripe price ID
      let resolvedPriceId = priceId;
      if (priceId === "pro") {
        resolvedPriceId = process.env.STRIPE_PRO_PRICE_ID;
      } else if (priceId === "family") {
        resolvedPriceId = process.env.STRIPE_FAMILY_PRICE_ID;
      }

      if (!resolvedPriceId) {
        res.status(400).json({ error: "Invalid plan selected" });
        return;
      }

      const userId = (req as unknown as { user: { id: string } }).user.id;
      const userEmail = (req as unknown as { user: { email: string } }).user
        .email;

      const url = await StripeService.createCheckoutSession(
        userId,
        userEmail,
        resolvedPriceId,
      );

      res.json({ url });
    } catch (error) {
      logger.error({ err: error }, "Failed to create checkout session");
      next(error);
    }
  }

  static async createPortalSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!isStripeEnabled()) {
        res.status(503).json({ error: "Billing is not configured" });
        return;
      }

      const userId = (req as unknown as { user: { id: string } }).user.id;
      const url = await StripeService.createPortalSession(userId);

      res.json({ url });
    } catch (error) {
      logger.error({ err: error }, "Failed to create portal session");
      next(error);
    }
  }

  static async getStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = (req as unknown as { user: { id: string } }).user.id;
      const db = getDatabaseClient().getKysely();
      const userRepo = new UserRepository(db);

      const user = await userRepo.findById(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        tier: user.subscription_tier || "free",
        status: user.subscription_status || "active",
        stripeEnabled: isStripeEnabled(),
        hasSubscription: !!user.stripe_subscription_id,
        endsAt: user.subscription_ends_at || null,
      });
    } catch (error) {
      logger.error({ err: error }, "Failed to get billing status");
      next(error);
    }
  }

  static async handleWebhook(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      const signature = req.headers["stripe-signature"] as string;
      if (!signature) {
        res.status(400).json({ error: "Missing stripe-signature header" });
        return;
      }

      await StripeService.handleWebhook(req.body, signature);

      res.json({ received: true });
    } catch (error) {
      logger.error({ err: error }, "Stripe webhook processing failed");
      res.status(400).json({
        error: `Webhook error: ${error instanceof Error ? error.message : "Unknown"}`,
      });
    }
  }
}
