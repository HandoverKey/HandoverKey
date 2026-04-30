/* eslint-disable @typescript-eslint/no-explicit-any */
import request from "supertest";

const mockDbClient = {
  initialize: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  getKysely: jest.fn(),
};

const mockWaitlistRepo = {
  findByEmail: jest.fn(),
  create: jest.fn().mockResolvedValue(undefined),
};

jest.mock("@handoverkey/database", () => ({
  getDatabaseClient: jest.fn(() => mockDbClient),
  DatabaseClient: jest.fn(),
  WaitlistRepository: jest.fn(() => mockWaitlistRepo),
  UserRepository: jest.fn(() => ({})),
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
  },
}));

jest.mock("../../auth/jwt", () => ({
  JWTManager: {
    generateAccessToken: jest.fn().mockResolvedValue({
      token: "mock-access-token",
      sessionId: "session-123",
    }),
    generateRefreshToken: jest.fn().mockReturnValue("mock-refresh-token"),
  },
}));

// Bypass rate limiters in tests
jest.mock("../../middleware/security", () => ({
  contactRateLimiter: (_req: any, _res: any, next: any) => next(),
  generalRateLimiter: (_req: any, _res: any, next: any) => next(),
  authRateLimiter: (_req: any, _res: any, next: any) => next(),
  registerRateLimiter: (_req: any, _res: any, next: any) => next(),
  rateLimiter: (_req: any, _res: any, next: any) => next(),
  createRateLimiter: () => (_req: any, _res: any, next: any) => next(),
}));

import app, { appInit } from "../../app";

describe("Waitlist Integration", () => {
  beforeAll(async () => {
    await appInit;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/waitlist", () => {
    it("should create a new waitlist signup", async () => {
      mockWaitlistRepo.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/v1/waitlist")
        .send({ email: "new@example.com", tier_interest: "pro" });

      expect(response.status).toBe(201);
      expect(response.body.message).toMatch(/on the list/);
      expect(mockWaitlistRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: "new@example.com" }),
      );
    });

    it("should return 200 for duplicate email", async () => {
      mockWaitlistRepo.findByEmail.mockResolvedValue({
        id: "existing-id",
        email: "dup@example.com",
      });

      const response = await request(app)
        .post("/api/v1/waitlist")
        .send({ email: "dup@example.com" });

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/already on the waitlist/);
      expect(mockWaitlistRepo.create).not.toHaveBeenCalled();
    });

    it("should reject invalid email", async () => {
      const response = await request(app)
        .post("/api/v1/waitlist")
        .send({ email: "not-an-email" });

      expect(response.status).toBe(400);
    });

    it("should reject missing email", async () => {
      const response = await request(app).post("/api/v1/waitlist").send({});

      expect(response.status).toBe(400);
    });

    it("should normalize email (trim and lowercase)", async () => {
      mockWaitlistRepo.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/v1/waitlist")
        .send({ email: "  User@Example.COM  " });

      expect(response.status).toBe(201);
      expect(mockWaitlistRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: "user@example.com" }),
      );
    });
  });
});
