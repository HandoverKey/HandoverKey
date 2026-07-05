import request from "supertest";
import app, { appInit } from "../../app";
import { getDatabaseClient } from "@handoverkey/database";
import { SessionService } from "../../services/session-service";
import {
  initializeRedis,
  closeRedis,
  getRedisClient,
} from "../../config/redis";
import { URL } from "node:url";
import {
  registerVerifyLogin,
  generateTotp,
  DEFAULT_PASSWORD,
} from "../helpers";
import { AccountLockoutService } from "../../services/account-lockout-service";

jest.setTimeout(45000);

/**
 * Extensive end-to-end coverage of every user-centric flow:
 * registration, email verification, login (happy + all failure modes),
 * wrong-password / lockout, forgot + reset password, authenticated change
 * password, profile, logout, refresh-token rotation, 2FA (enable / login /
 * replay / recovery / disable) and account deletion.
 */

const NEW_PASSWORD = "NewPassword456#%^";

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

function getCookies(res: request.Response): string[] {
  const raw = res.headers["set-cookie"] || [];
  return Array.isArray(raw) ? raw : [raw];
}

function findCookie(res: request.Response, name: string): string | undefined {
  const cookie = getCookies(res).find((c) => c?.startsWith(`${name}=`));
  return cookie ? cookie.split(";")[0] : undefined;
}

function cookieValue(res: request.Response, name: string): string | undefined {
  return findCookie(res, name)?.split("=")[1];
}

async function register(email: string, password = DEFAULT_PASSWORD) {
  return request(app)
    .post("/api/v1/auth/register")
    .send({ name: "Test User", email, password, confirmPassword: password });
}

async function getVerificationToken(email: string): Promise<string> {
  const db = getDatabaseClient().getKysely();
  const row = await db
    .selectFrom("users")
    .select(["verification_token"])
    .where("email", "=", email.toLowerCase().trim())
    .executeTakeFirstOrThrow();
  return row.verification_token as string;
}

async function registerAndVerify(prefix: string, password = DEFAULT_PASSWORD) {
  const email = uniqueEmail(prefix);
  await register(email, password);
  const token = await getVerificationToken(email);
  await request(app).get(`/api/v1/auth/verify-email?token=${token}`);
  return { email, password };
}

function login(
  email: string,
  password: string,
  extra: Record<string, unknown> = {},
) {
  return request(app)
    .post("/api/v1/auth/login")
    .send({ email, password, ...extra });
}

/** Finds the reset token stored in Redis for a given user id. */
async function findResetToken(userId: string): Promise<string> {
  const redis = getRedisClient();
  const keys = await redis.keys("RESET_TOKEN:*");
  for (const key of keys) {
    const value = await redis.get(key);
    if (value === userId) {
      return key.replace("RESET_TOKEN:", "");
    }
  }
  throw new Error("Reset token not found in Redis");
}

async function userIdByEmail(email: string): Promise<string> {
  const db = getDatabaseClient().getKysely();
  const row = await db
    .selectFrom("users")
    .select(["id"])
    .where("email", "=", email.toLowerCase().trim())
    .executeTakeFirstOrThrow();
  return row.id;
}

async function enableTwoFactor(token: string): Promise<string> {
  const setupRes = await request(app)
    .post("/api/v1/auth/2fa/setup")
    .set("Authorization", `Bearer ${token}`)
    .send({});
  const secret = new URL(setupRes.body.otpauthUrl).searchParams.get("secret")!;
  await request(app)
    .post("/api/v1/auth/2fa/enable")
    .set("Authorization", `Bearer ${token}`)
    .send({ token: generateTotp(secret) });
  return secret;
}

describe("User-centric flows (e2e)", () => {
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

  // ---------------------------------------------------------------------------
  describe("Registration", () => {
    it("registers a new user (unverified)", async () => {
      const email = uniqueEmail("register");
      const res = await register(email);
      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe(email);
      expect(res.body.user.emailVerified).toBe(false);
    });

    it("rejects duplicate email with 409", async () => {
      const email = uniqueEmail("dup");
      await register(email);
      const res = await register(email);
      expect(res.status).toBe(409);
    });

    it("rejects mismatched password confirmation with 400", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: uniqueEmail("mismatch"),
          password: DEFAULT_PASSWORD,
          confirmPassword: "DifferentPassword1!",
        });
      expect(res.status).toBe(400);
    });

    it("rejects a password shorter than 12 characters with 400", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: uniqueEmail("short"),
          password: "Short1!",
          confirmPassword: "Short1!",
        });
      expect(res.status).toBe(400);
    });

    it("rejects an invalid email with 400", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: "not-an-email",
        password: DEFAULT_PASSWORD,
        confirmPassword: DEFAULT_PASSWORD,
      });
      expect(res.status).toBe(400);
    });

    it("cannot login before email verification", async () => {
      const email = uniqueEmail("unverified");
      await register(email);
      const res = await login(email, DEFAULT_PASSWORD);
      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/verify your email/i);
    });
  });

  // ---------------------------------------------------------------------------
  describe("Email verification", () => {
    it("verifies with a valid token", async () => {
      const email = uniqueEmail("verify");
      await register(email);
      const token = await getVerificationToken(email);
      const res = await request(app).get(
        `/api/v1/auth/verify-email?token=${token}`,
      );
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/verified/i);
    });

    it("reports already-verified on second verification", async () => {
      const email = uniqueEmail("verify-twice");
      await register(email);
      const token = await getVerificationToken(email);
      await request(app).get(`/api/v1/auth/verify-email?token=${token}`);
      const res = await request(app).get(
        `/api/v1/auth/verify-email?token=${token}`,
      );
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/already verified/i);
    });

    it("rejects an invalid token with 400", async () => {
      const res = await request(app).get(
        "/api/v1/auth/verify-email?token=deadbeefdeadbeef",
      );
      expect(res.status).toBe(400);
    });

    it("rejects a missing token with 400", async () => {
      const res = await request(app).get("/api/v1/auth/verify-email");
      expect(res.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------------
  describe("Resend verification (no user enumeration)", () => {
    it("returns generic success for an unknown email (no 404 leak)", async () => {
      const res = await request(app)
        .post("/api/v1/auth/resend-verification")
        .send({ email: uniqueEmail("ghost") });
      expect(res.status).toBe(200);
      expect(res.body.alreadyVerified).toBeUndefined();
    });

    it("returns the same shape for an existing unverified email", async () => {
      const email = uniqueEmail("resend-real");
      await register(email);
      const res = await request(app)
        .post("/api/v1/auth/resend-verification")
        .send({ email });
      expect(res.status).toBe(200);
      expect(res.body.alreadyVerified).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  describe("Login", () => {
    it("logs in a verified user and sets auth cookies", async () => {
      const { email, password } = await registerAndVerify("login-ok");
      const res = await login(email, password);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(email);
      expect(res.body.user).toHaveProperty("salt");
      expect(res.body.user).toHaveProperty("role");
      expect(cookieValue(res, "accessToken")).toBeTruthy();
      expect(cookieValue(res, "refreshToken")).toBeTruthy();
    });

    it("treats email as case-insensitive", async () => {
      const { email, password } = await registerAndVerify("login-case");
      const res = await login(email.toUpperCase(), password);
      expect(res.status).toBe(200);
    });

    it("rejects a wrong password with a generic message", async () => {
      const { email } = await registerAndVerify("login-wrong");
      const res = await login(email, "WrongPassword1!");
      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/invalid email or password/i);
      // Must NOT leak remaining-attempt counts (enumeration vector).
      expect(res.body.error.message).not.toMatch(/attempt/i);
    });

    it("returns a generic error for an unknown email", async () => {
      const res = await login(uniqueEmail("nobody"), DEFAULT_PASSWORD);
      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/invalid email or password/i);
    });

    it("returns an identical message for wrong password and unknown email (no enumeration)", async () => {
      const { email } = await registerAndVerify("login-consistent");
      const knownWrong = await login(email, "WrongPassword1!");
      const unknown = await login(
        uniqueEmail("does-not-exist"),
        DEFAULT_PASSWORD,
      );

      expect(knownWrong.status).toBe(401);
      expect(unknown.status).toBe(401);
      // Byte-for-byte identical so a single probe cannot distinguish a
      // registered account from an unregistered one.
      expect(knownWrong.body.error.message).toBe(unknown.body.error.message);
    });

    it("never locks the account: a correct password works after many failures", async () => {
      const { email, password } = await registerAndVerify("login-nolock");

      // Hammer the account past the old 5-attempt lockout threshold.
      for (let i = 0; i < 6; i++) {
        const r = await login(email, "WrongPassword1!");
        expect(r.status).toBe(401);
        expect(r.body.error.message).toMatch(/invalid email or password/i);
        expect(r.body.error.message).not.toMatch(/lock/i);
      }

      // The real owner is never locked out (no self-inflicted DoS).
      const ok = await login(email, password);
      expect(ok.status).toBe(200);
    });
  });

  // ---------------------------------------------------------------------------
  describe("Login throttling (progressive delay, no lockout)", () => {
    const throttleUser = `throttle-${Date.now()}-${Math.random()}`;

    afterAll(async () => {
      await AccountLockoutService.clearAttempts(throttleUser);
    });

    it("adds no delay for the first few failures, then escalates and caps", async () => {
      await AccountLockoutService.clearAttempts(throttleUser);
      expect(await AccountLockoutService.getThrottleDelayMs(throttleUser)).toBe(
        0,
      );

      // Under the threshold (3) -> still no delay.
      await AccountLockoutService.recordFailedAttempt(throttleUser);
      await AccountLockoutService.recordFailedAttempt(throttleUser);
      expect(await AccountLockoutService.getThrottleDelayMs(throttleUser)).toBe(
        0,
      );

      // At/over the threshold the delay appears and grows monotonically.
      await AccountLockoutService.recordFailedAttempt(throttleUser); // count 3
      const d3 = await AccountLockoutService.getThrottleDelayMs(throttleUser);
      await AccountLockoutService.recordFailedAttempt(throttleUser); // count 4
      const d4 = await AccountLockoutService.getThrottleDelayMs(throttleUser);
      expect(d3).toBeGreaterThan(0);
      expect(d4).toBeGreaterThan(d3);

      // It is capped (never grows unbounded -> a real user is only briefly slowed).
      for (let i = 0; i < 10; i++) {
        await AccountLockoutService.recordFailedAttempt(throttleUser);
      }
      const capped =
        await AccountLockoutService.getThrottleDelayMs(throttleUser);
      expect(capped).toBeLessThanOrEqual(5000);
    });

    it("resets the delay to zero once attempts are cleared", async () => {
      await AccountLockoutService.recordFailedAttempt(throttleUser);
      await AccountLockoutService.recordFailedAttempt(throttleUser);
      await AccountLockoutService.recordFailedAttempt(throttleUser);
      await AccountLockoutService.recordFailedAttempt(throttleUser);
      expect(
        await AccountLockoutService.getThrottleDelayMs(throttleUser),
      ).toBeGreaterThan(0);

      await AccountLockoutService.clearAttempts(throttleUser);
      expect(await AccountLockoutService.getThrottleDelayMs(throttleUser)).toBe(
        0,
      );
    });
  });

  // ---------------------------------------------------------------------------
  describe("Forgot / reset password", () => {
    it("does not reveal whether an email exists on forgot-password", async () => {
      const unknown = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: uniqueEmail("unknown-forgot") });
      expect(unknown.status).toBe(200);
      expect(unknown.body.message).toMatch(/if an account exists/i);
    });

    it("resets the password end-to-end and rotates credentials", async () => {
      const { email, password } = await registerAndVerify("reset-flow");
      const userId = await userIdByEmail(email);

      // Log in first to establish a session/refresh token that must be revoked.
      const firstLogin = await login(email, password);
      const oldRefresh = findCookie(firstLogin, "refreshToken");

      await request(app).post("/api/v1/auth/forgot-password").send({ email });
      const token = await findResetToken(userId);

      const resetRes = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          token,
          email,
          password: NEW_PASSWORD,
          confirmPassword: NEW_PASSWORD,
        });
      expect(resetRes.status).toBe(200);

      // New password works, old password fails.
      expect((await login(email, NEW_PASSWORD)).status).toBe(200);
      expect((await login(email, password)).status).toBe(401);

      // Old refresh token was revoked by the reset.
      if (oldRefresh) {
        const refreshRes = await request(app)
          .post("/api/v1/auth/refresh")
          .set("Cookie", oldRefresh)
          .send({});
        expect(refreshRes.status).toBe(401);
      }

      // Token cannot be reused.
      const reuse = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          token,
          email,
          password: NEW_PASSWORD,
          confirmPassword: NEW_PASSWORD,
        });
      expect(reuse.status).toBe(400);
    });

    it("rejects an invalid reset token", async () => {
      const res = await request(app).post("/api/v1/auth/reset-password").send({
        token: "invalid-token-value",
        password: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      });
      expect(res.status).toBe(400);
    });

    it("rejects a reset when the email does not match the token", async () => {
      const { email } = await registerAndVerify("reset-mismatch");
      const userId = await userIdByEmail(email);
      await request(app).post("/api/v1/auth/forgot-password").send({ email });
      const token = await findResetToken(userId);

      const res = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          token,
          email: uniqueEmail("someone-else"),
          password: NEW_PASSWORD,
          confirmPassword: NEW_PASSWORD,
        });
      expect(res.status).toBe(400);
    });

    it("rejects a reset with mismatched confirmation", async () => {
      const res = await request(app).post("/api/v1/auth/reset-password").send({
        token: "whatever",
        password: NEW_PASSWORD,
        confirmPassword: "Different123!@#",
      });
      expect(res.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------------
  describe("Change password (authenticated)", () => {
    it("changes the password and rotates sessions", async () => {
      const { email, password, token } = await registerVerifyLogin("change-pw");

      const res = await request(app)
        .put("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: password,
          newPassword: NEW_PASSWORD,
          confirmPassword: NEW_PASSWORD,
          newSalt: Buffer.from("0123456789abcdef").toString("base64"),
          reEncryptedEntries: [],
        });
      expect(res.status).toBe(200);

      // Old session token is invalidated.
      const oldProfile = await request(app)
        .get("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${token}`);
      expect(oldProfile.status).toBe(401);

      // New password works; old password fails.
      expect((await login(email, NEW_PASSWORD)).status).toBe(200);
      expect((await login(email, password)).status).toBe(401);
    });

    it("rejects a change with the wrong current password", async () => {
      const { token } = await registerVerifyLogin("change-pw-wrong");
      const res = await request(app)
        .put("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "WrongCurrent1!@#",
          newPassword: NEW_PASSWORD,
          confirmPassword: NEW_PASSWORD,
          newSalt: Buffer.from("0123456789abcdef").toString("base64"),
          reEncryptedEntries: [],
        });
      expect(res.status).toBe(401);
    });

    it("rejects reusing the same password", async () => {
      const { password, token } = await registerVerifyLogin("change-pw-same");
      const res = await request(app)
        .put("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: password,
          newPassword: password,
          confirmPassword: password,
          newSalt: Buffer.from("0123456789abcdef").toString("base64"),
          reEncryptedEntries: [],
        });
      expect(res.status).toBe(400);
    });

    it("requires authentication", async () => {
      const res = await request(app)
        .put("/api/v1/auth/change-password")
        .send({
          currentPassword: DEFAULT_PASSWORD,
          newPassword: NEW_PASSWORD,
          confirmPassword: NEW_PASSWORD,
          newSalt: Buffer.from("0123456789abcdef").toString("base64"),
          reEncryptedEntries: [],
        });
      expect(res.status).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  describe("Profile", () => {
    it("returns the profile for an authenticated user", async () => {
      const { email, token } = await registerVerifyLogin("profile-get");
      const res = await request(app)
        .get("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(email);
      expect(res.body.user).toHaveProperty("subscriptionTier");
    });

    it("updates the profile name", async () => {
      const { token } = await registerVerifyLogin("profile-update");
      const res = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Name" });
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe("Updated Name");

      const profile = await request(app)
        .get("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${token}`);
      expect(profile.body.user.name).toBe("Updated Name");
    });

    it("rejects an invalid (too short) name", async () => {
      const { token } = await registerVerifyLogin("profile-bad");
      const res = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "x" });
      expect(res.status).toBe(400);
    });

    it("rejects an unauthenticated profile request", async () => {
      const res = await request(app).get("/api/v1/auth/profile");
      expect(res.status).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  describe("Logout", () => {
    it("invalidates the session", async () => {
      const { token } = await registerVerifyLogin("logout-flow");
      const logoutRes = await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${token}`)
        .send({});
      expect(logoutRes.status).toBe(200);

      const profile = await request(app)
        .get("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${token}`);
      expect(profile.status).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  describe("Refresh token rotation", () => {
    it("rotates the refresh token and rejects reuse of the old one", async () => {
      const { email, password } = await registerAndVerify("refresh-rot");
      const loginRes = await login(email, password);
      const oldRefresh = findCookie(loginRes, "refreshToken");
      expect(oldRefresh).toBeTruthy();

      const rotated = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", oldRefresh!)
        .send({});
      expect(rotated.status).toBe(200);
      const newRefresh = findCookie(rotated, "refreshToken");
      expect(newRefresh).toBeTruthy();

      // Reusing the old (rotated-out) token must be rejected.
      const reuse = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", oldRefresh!)
        .send({});
      expect(reuse.status).toBe(401);

      // The new token still works.
      const withNew = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", newRefresh!)
        .send({});
      expect(withNew.status).toBe(200);
    });

    it("rejects a refresh with no token", async () => {
      const res = await request(app).post("/api/v1/auth/refresh").send({});
      expect(res.status).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  describe("Two-factor authentication", () => {
    it("requires a valid TOTP code at login once enabled", async () => {
      const { email, password, token } = await registerVerifyLogin("2fa-req");
      const secret = await enableTwoFactor(token);

      const noCode = await login(email, password);
      expect(noCode.status).toBe(401);
      expect(noCode.body.twoFactorRequired).toBe(true);

      const wrongCode = await login(email, password, {
        twoFactorCode: "000000",
      });
      expect(wrongCode.status).toBe(401);

      const good = await login(email, password, {
        twoFactorCode: generateTotp(secret),
      });
      expect(good.status).toBe(200);
    });

    it("prevents replay of the same TOTP code across two logins", async () => {
      const { email, password, token } =
        await registerVerifyLogin("2fa-replay");
      const secret = await enableTwoFactor(token);

      const code = generateTotp(secret);
      const first = await login(email, password, { twoFactorCode: code });
      expect(first.status).toBe(200);

      // Same code, second time -> rejected as a replay.
      const replay = await login(email, password, { twoFactorCode: code });
      expect(replay.status).toBe(401);
    });

    it("allows a recovery code once and rejects its reuse", async () => {
      const { email, password, token } = await registerVerifyLogin("2fa-rec");
      const setupRes = await request(app)
        .post("/api/v1/auth/2fa/setup")
        .set("Authorization", `Bearer ${token}`)
        .send({});
      const recoveryCode = setupRes.body.recoveryCodes[0];
      const secret = new URL(setupRes.body.otpauthUrl).searchParams.get(
        "secret",
      )!;
      await request(app)
        .post("/api/v1/auth/2fa/enable")
        .set("Authorization", `Bearer ${token}`)
        .send({ token: generateTotp(secret) });

      const withRecovery = await login(email, password, { recoveryCode });
      expect(withRecovery.status).toBe(200);

      const reuse = await login(email, password, { recoveryCode });
      expect(reuse.status).toBe(401);
    });

    it("disables 2FA with password + code and restores plain login", async () => {
      const { email, password, token } = await registerVerifyLogin("2fa-off");
      const secret = await enableTwoFactor(token);

      const disableRes = await request(app)
        .post("/api/v1/auth/2fa/disable")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: password, token: generateTotp(secret) });
      expect(disableRes.status).toBe(200);

      const plain = await login(email, password);
      expect(plain.status).toBe(200);
    });

    it("rejects disabling 2FA with a wrong password", async () => {
      const { token } = await registerVerifyLogin("2fa-off-wrong");
      const secret = await enableTwoFactor(token);

      const res = await request(app)
        .post("/api/v1/auth/2fa/disable")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "WrongPassword1!@#",
          token: generateTotp(secret),
        });
      expect(res.status).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  describe("Account deletion", () => {
    it("deletes the account and prevents subsequent login", async () => {
      const { email, password, token } = await registerVerifyLogin("delete");
      const res = await request(app)
        .delete("/api/v1/auth/delete-account")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);

      const afterLogin = await login(email, password);
      expect(afterLogin.status).toBe(401);
    });
  });
});
