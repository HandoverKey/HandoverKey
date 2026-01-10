/* eslint-disable @typescript-eslint/no-explicit-any */
import request from "supertest";
import app, { appInit } from "../../app";
import { getDatabaseClient } from "@handoverkey/database";
import { SessionService } from "../../services/session-service";
import { HandoverOrchestrator } from "../../services/handover-orchestrator";
import { initializeRedis, closeRedis } from "../../config/redis";
import { HandoverProcessStatus } from "@handoverkey/shared/src/types/dead-mans-switch";

// Helpers
async function register(email: string) {
  const password = "Password123!@$";

  // Register
  await (request(app).post("/api/v1/auth/register") as any).send({
    name: "Test User",
    email,
    password,
    confirmPassword: password,
  });

  // Verify email
  const dbClient = getDatabaseClient();
  const db = dbClient.getKysely();
  const user = await db
    .selectFrom("users")
    .select(["verification_token", "id"])
    .where("email", "=", email)
    .executeTakeFirst();

  if (!user || !user.verification_token)
    throw new Error("User registration failed");

  await request(app).get(
    `/api/v1/auth/verify-email?token=${user.verification_token}`,
  );

  return { email, password, userId: user.id };
}

async function login(email: string) {
  const password = "Password123!@$";
  const loginRes = await (request(app).post("/api/v1/auth/login") as any).send({
    email,
    password,
  });
  return loginRes.body.tokens.accessToken;
}

describe("Handover Flow Integration", () => {
  beforeAll(async () => {
    const dbClient = getDatabaseClient();
    await dbClient.initialize({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: "handoverkey_test",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      min: 2,
      max: 10,
    });

    SessionService.initialize(dbClient);
    await initializeRedis();
    await appInit;
  });

  afterAll(async () => {
    await closeRedis();
    await getDatabaseClient().close();
  });

  it("should store encrypted key share when adding a successor", async () => {
    const email = `share-test-${Date.now()}@example.com`;
    await register(email);
    const token = await login(email);
    const auth = { Authorization: `Bearer ${token}` };

    // 1. Create a Vault Entry
    await (request(app).post("/api/v1/vault/entries") as any).set(auth).send({
      encryptedData: "test-data",
      iv: "test-iv",
      algorithm: "AES-GCM",
      category: "Login",
      tags: ["test"],
    });

    // 2. Add Successor with Encrypted Share
    const share = "encrypted-shamir-share-v1";
    const res = await (request(app).post("/api/v1/successors") as any)
      .set(auth)
      .send({
        email: "successor-share@example.com",
        name: "Key Share Holder",
        handoverDelayDays: 14,
        encryptedShare: share,
      });

    expect(res.status).toBe(201);

    // 3. Verify Share Persisted
    const listRes = await (request(app).get("/api/v1/successors") as any).set(
      auth,
    );
    expect(listRes.status).toBe(200);
    const successor = listRes.body.successors.find(
      (s: any) => s.email === "successor-share@example.com",
    );
    expect(successor).toBeDefined();
    expect(successor.encryptedShare).toBe(share);
  });

  it("should initiate handover, cancel it, and verify status", async () => {
    const email = `handover-test-${Date.now()}@example.com`;
    const { userId } = await register(email);
    const orchestrator = new HandoverOrchestrator();

    // 1. Manually Initiate Handover
    const process = await orchestrator.initiateHandover(userId as string); // cast string as inferred from Generated type
    expect(process).toBeDefined();
    expect(process.status).toBe(HandoverProcessStatus.GRACE_PERIOD);

    // 2. Cancel Handover
    await orchestrator.cancelHandover(
      userId as string,
      "User manually cancelled",
    );

    // 3. Verify Status via direct DB check since getHandoverStatus might return null for cancelled
    const dbClient = getDatabaseClient();
    const db = dbClient.getKysely();
    const cancelledProcess = await db
      .selectFrom("handover_processes")
      .selectAll()
      .where("user_id", "=", userId as string)
      .where("status", "=", HandoverProcessStatus.CANCELLED)
      .executeTakeFirst();

    expect(cancelledProcess).toBeDefined();
    expect(cancelledProcess!.status).toBe(HandoverProcessStatus.CANCELLED);
    expect(cancelledProcess!.cancellation_reason).toBe(
      "User manually cancelled",
    );
    expect(cancelledProcess!.cancelled_at).toBeDefined();
  });

  it("should process grace period expiration", async () => {
    const email = `grace-test-${Date.now()}@example.com`;
    const { userId } = await register(email);
    const token = await login(email);

    // 1. Add Successor
    const res = await (request(app).post("/api/v1/successors") as any)
      .set({ Authorization: `Bearer ${token}` })
      .send({
        email: "grace-successor@example.com",
        name: "Grace Successor",
        handoverDelayDays: 7,
        encryptedShare: "share-data",
      });
    expect(res.status).toBe(201);

    const orchestrator = new HandoverOrchestrator();

    // 2. Initiate Handover
    const process = await orchestrator.initiateHandover(userId as string);
    expect(process.status).toBe(HandoverProcessStatus.GRACE_PERIOD);

    // 3. Process Expiration
    await orchestrator.processGracePeriodExpiration(process.id);

    // 4. Verify Status Transition to AWAITING_SUCCESSORS
    const updated = await orchestrator.getHandoverStatus(userId as string);
    expect(updated).toBeDefined();
    expect(updated!.status).toBe(HandoverProcessStatus.AWAITING_SUCCESSORS);

    // 5. Verify Notification (Optional: Check logs or mock email service if not already mocked globally)
    // Since we are monitoring logs in the run output, we can see if it worked.
  }, 15000);
});
