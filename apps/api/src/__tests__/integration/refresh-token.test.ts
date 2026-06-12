import request from "supertest";
import app, { appInit } from "../../app";
import { getDatabaseClient } from "@handoverkey/database";
import { SessionService } from "../../services/session-service";
import { initializeRedis, closeRedis } from "../../config/redis";
import { registerVerifyLogin } from "../helpers";

jest.setTimeout(30000);

async function loginAndGetRefreshCookie(
  email: string,
  password: string,
): Promise<string> {
  const loginRes = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });
  const cookies: string[] = loginRes.headers["set-cookie"] || [];
  const list = Array.isArray(cookies) ? cookies : [cookies];
  const refreshCookie = list.find((c) => c?.startsWith("refreshToken="));
  if (!refreshCookie) throw new Error("No refresh cookie");
  return refreshCookie.split(";")[0];
}

describe("Refresh token hardening", () => {
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

  it("rotates the refresh token and rejects the old one after use", async () => {
    const user = await registerVerifyLogin("refresh-rotate");
    const oldRefresh = await loginAndGetRefreshCookie(
      user.email,
      user.password,
    );

    // First refresh succeeds and issues a new refresh token.
    const first = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", oldRefresh)
      .send({});
    expect(first.status).toBe(200);

    const rotatedCookies: string[] = first.headers["set-cookie"] || [];
    const rotated = (
      Array.isArray(rotatedCookies) ? rotatedCookies : [rotatedCookies]
    ).find((c) => c?.startsWith("refreshToken="));
    expect(rotated).toBeDefined();

    // Reusing the OLD (now-rotated) refresh token must be rejected.
    const replay = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", oldRefresh)
      .send({});
    expect(replay.status).toBe(401);

    // The newly issued refresh token still works.
    const newRefresh = rotated!.split(";")[0];
    const second = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", newRefresh)
      .send({});
    expect(second.status).toBe(200);
  });

  it("revokes the refresh token on logout", async () => {
    const user = await registerVerifyLogin("refresh-logout");
    const refresh = await loginAndGetRefreshCookie(user.email, user.password);

    const logout = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${user.token}`)
      .set("Cookie", refresh)
      .send({});
    expect(logout.status).toBe(200);

    const afterLogout = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", refresh)
      .send({});
    expect(afterLogout.status).toBe(401);
  });

  it("revokes all refresh tokens on password reset", async () => {
    const user = await registerVerifyLogin("refresh-reset");
    const refresh = await loginAndGetRefreshCookie(user.email, user.password);

    // Seed a reset token directly via the service-backed flow.
    const { getRedisClient } = await import("../../config/redis");
    const redis = getRedisClient();
    const token = "reset-token-for-refresh-test-" + Date.now();
    await redis.set(`RESET_TOKEN:${token}`, user.userId, { EX: 3600 });

    const newPassword = "BrandNewPassword123!@$";
    const resetRes = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({
        token,
        password: newPassword,
        confirmPassword: newPassword,
      });
    expect(resetRes.status).toBe(200);

    const afterReset = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", refresh)
      .send({});
    expect(afterReset.status).toBe(401);
  });
});
