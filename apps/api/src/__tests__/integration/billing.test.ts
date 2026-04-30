/* eslint-disable @typescript-eslint/no-explicit-any */
import request from "supertest";

const mockDbClient = {
  initialize: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  getKysely: jest.fn(),
};

const mockUserRepo = {
  findById: jest.fn(),
  update: jest.fn().mockResolvedValue(undefined),
};

jest.mock("@handoverkey/database", () => ({
  getDatabaseClient: jest.fn(() => mockDbClient),
  DatabaseClient: jest.fn(),
  UserRepository: jest.fn(() => mockUserRepo),
}));

jest.mock("../../config/redis", () => ({
  initializeRedis: jest.fn().mockResolvedValue(undefined),
  closeRedis: jest.fn().mockResolvedValue(undefined),
  checkRedisHealth: jest.fn().mockResolvedValue(true),
  getRedisClient: jest.fn().mockReturnValue({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
  }),
}));

jest.mock("../../services/session-service", () => ({
  SessionService: {
    initialize: jest.fn(),
    createSession: jest.fn().mockResolvedValue("session-123"),
    hashToken: jest.fn().mockReturnValue("hashed-token"),
    getSession: jest.fn().mockResolvedValue({
      userId: "user-123",
      valid: true,
    }),
  },
}));

jest.mock("../../auth/jwt", () => ({
  JWTManager: {
    generateAccessToken: jest.fn().mockResolvedValue({
      token: "mock-access-token",
      sessionId: "session-123",
    }),
    generateRefreshToken: jest.fn().mockReturnValue("mock-refresh-token"),
    verifyAccessToken: jest.fn().mockReturnValue({
      userId: "user-123",
      sessionId: "session-123",
    }),
  },
}));

const mockStripeService = {
  createCheckoutSession: jest.fn(),
  createPortalSession: jest.fn(),
  handleWebhook: jest.fn(),
};

jest.mock("../../services/stripe-service", () => ({
  StripeService: mockStripeService,
  isStripeConfigured: jest.fn().mockReturnValue(true),
}));

jest.mock("../../middleware/auth", () => ({
  authenticateJWT: (req: any, _res: any, next: any) => {
    req.user = { id: "user-123", email: "test@example.com" };
    next();
  },
  requireAuth: (_req: any, _res: any, next: any) => next(),
}));

jest.mock("../../middleware/security", () => ({
  contactRateLimiter: (_req: any, _res: any, next: any) => next(),
  generalRateLimiter: (_req: any, _res: any, next: any) => next(),
  authRateLimiter: (_req: any, _res: any, next: any) => next(),
  registerRateLimiter: (_req: any, _res: any, next: any) => next(),
  rateLimiter: (_req: any, _res: any, next: any) => next(),
  createRateLimiter: () => (_req: any, _res: any, next: any) => next(),
}));

import app, { appInit } from "../../app";

describe("Billing Integration", () => {
  beforeAll(async () => {
    await appInit;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/billing/checkout", () => {
    it("should accept 'pro' as a valid plan", async () => {
      process.env.STRIPE_PRO_PRICE_ID = "price_pro_123";
      process.env.STRIPE_FAMILY_PRICE_ID = "price_family_123";
      mockStripeService.createCheckoutSession.mockResolvedValue(
        "https://checkout.stripe.com/session",
      );

      const response = await request(app)
        .post("/api/v1/billing/checkout")
        .send({ priceId: "pro" });

      expect(response.status).toBe(200);
      expect(response.body.url).toBe("https://checkout.stripe.com/session");
    });

    it("should accept 'family' as a valid plan", async () => {
      process.env.STRIPE_PRO_PRICE_ID = "price_pro_123";
      process.env.STRIPE_FAMILY_PRICE_ID = "price_family_123";
      mockStripeService.createCheckoutSession.mockResolvedValue(
        "https://checkout.stripe.com/session",
      );

      const response = await request(app)
        .post("/api/v1/billing/checkout")
        .send({ priceId: "family" });

      expect(response.status).toBe(200);
      expect(response.body.url).toBe("https://checkout.stripe.com/session");
    });

    it("should reject arbitrary Stripe price IDs", async () => {
      const response = await request(app)
        .post("/api/v1/billing/checkout")
        .send({ priceId: "price_attacker_controlled" });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/Invalid plan/);
    });

    it("should reject missing priceId", async () => {
      const response = await request(app)
        .post("/api/v1/billing/checkout")
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/billing/status", () => {
    it("should return billing status for authenticated user", async () => {
      mockUserRepo.findById.mockResolvedValue({
        id: "user-123",
        subscription_tier: "pro",
        subscription_status: "active",
        stripe_subscription_id: "sub_123",
        subscription_ends_at: null,
      });

      const response = await request(app).get("/api/v1/billing/status");

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        tier: "pro",
        status: "active",
        stripeEnabled: true,
        hasSubscription: true,
      });
    });

    it("should return 404 when user not found", async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      const response = await request(app).get("/api/v1/billing/status");

      expect(response.status).toBe(404);
    });
  });
});
