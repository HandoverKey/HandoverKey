import Stripe from "stripe";
import { getDatabaseClient, UserRepository } from "@handoverkey/database";
import { logger } from "../config/logger";

let stripe: InstanceType<typeof Stripe> | null = null;

function getStripe(): InstanceType<typeof Stripe> {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing)");
    }
    stripe = new Stripe(key);
  }
  return stripe;
}

export function isStripeEnabled(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Returns true only when ALL required Stripe env vars are configured.
 * Use this to gate billing features in the UI/API.
 */
export function isStripeConfigured(): boolean {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.STRIPE_PRO_PRICE_ID &&
    process.env.STRIPE_FAMILY_PRICE_ID
  );
}

export class StripeService {
  /**
   * Creates a Stripe Checkout session for a subscription upgrade.
   */
  static async createCheckoutSession(
    userId: string,
    userEmail: string,
    priceId: string,
  ): Promise<string> {
    const s = getStripe();
    const db = getDatabaseClient().getKysely();
    const userRepo = new UserRepository(db);

    const user = await userRepo.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Reuse existing Stripe customer or create one
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await s.customers.create({
        email: userEmail,
        metadata: { handoverkey_user_id: userId },
      });
      customerId = customer.id;

      await userRepo.update(userId, { stripe_customer_id: customerId });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const session = await s.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/billing?success=true`,
      cancel_url: `${frontendUrl}/billing?canceled=true`,
      metadata: { user_id: userId },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    return session.url;
  }

  /**
   * Creates a Stripe Customer Portal session for subscription management.
   */
  static async createPortalSession(userId: string): Promise<string> {
    const s = getStripe();
    const db = getDatabaseClient().getKysely();
    const userRepo = new UserRepository(db);

    const user = await userRepo.findById(userId);
    if (!user || !user.stripe_customer_id) {
      throw new Error("No billing account found");
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const session = await s.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${frontendUrl}/billing`,
    });

    return session.url;
  }

  /**
   * Processes Stripe webhook events.
   */
  static async handleWebhook(
    payload: Buffer,
    signature: string,
  ): Promise<void> {
    const s = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    const event = s.webhooks.constructEvent(payload, signature, webhookSecret);

    const db = getDatabaseClient().getKysely();
    const userRepo = new UserRepository(db);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as unknown as Record<string, unknown>;
        const metadata = session.metadata as Record<string, string> | undefined;
        const userId = metadata?.user_id;
        if (!userId) break;

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : (session.subscription as { id?: string })?.id;

        if (subscriptionId) {
          const subscription = await s.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price.id;
          const tier = resolveTier(priceId);

          await userRepo.update(userId, {
            stripe_subscription_id: subscriptionId,
            subscription_tier: tier,
            subscription_status: "active",
          });

          logger.info(
            { userId, tier, subscriptionId },
            "Subscription activated via checkout",
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as unknown as Record<
          string,
          unknown
        >;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : (subscription.customer as { id?: string })?.id;
        if (!customerId) break;

        const user = await findUserByCustomerId(customerId);
        if (!user) break;

        const items = subscription.items as {
          data: Array<{ price: { id: string } }>;
        };
        const priceId = items?.data?.[0]?.price.id;
        const tier = resolveTier(priceId);
        const status = mapSubscriptionStatus(subscription.status as string);

        const currentPeriodEnd = subscription.current_period_end as
          | number
          | undefined;
        await userRepo.update(user.id, {
          subscription_tier: tier,
          subscription_status: status,
          subscription_ends_at: currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000).toISOString()
            : null,
        });

        logger.info({ userId: user.id, tier, status }, "Subscription updated");
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as unknown as Record<
          string,
          unknown
        >;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : (subscription.customer as { id?: string })?.id;
        if (!customerId) break;

        const user = await findUserByCustomerId(customerId);
        if (!user) break;

        await userRepo.update(user.id, {
          subscription_tier: "free",
          subscription_status: "canceled",
          stripe_subscription_id: null,
        });

        logger.info({ userId: user.id }, "Subscription canceled → free tier");
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as Record<string, unknown>;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : (invoice.customer as { id?: string })?.id;
        if (!customerId) break;

        const user = await findUserByCustomerId(customerId);
        if (!user) break;

        await userRepo.update(user.id, {
          subscription_status: "past_due",
        });

        logger.warn({ userId: user.id }, "Invoice payment failed → past_due");
        break;
      }

      default:
        logger.debug({ type: event.type }, "Unhandled Stripe event");
    }
  }
}

function resolveTier(priceId: string | undefined): string {
  if (!priceId) return "free";
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
  if (priceId === process.env.STRIPE_FAMILY_PRICE_ID) return "family";
  // Unknown price ID — default to free and log for investigation
  logger.warn({ priceId }, "Unknown Stripe price ID, defaulting to free tier");
  return "free";
}

function mapSubscriptionStatus(status: string): string {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "canceled";
    default:
      return "active";
  }
}

async function findUserByCustomerId(customerId: string) {
  const db = getDatabaseClient().getKysely();
  const user = await db
    .selectFrom("users")
    .selectAll()
    .where("stripe_customer_id", "=", customerId)
    .executeTakeFirst();
  return user ?? null;
}
