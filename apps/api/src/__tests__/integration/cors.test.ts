import request from "supertest";
import app from "../../app";

describe("CORS", () => {
  const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

  it("allows requests from the configured FRONTEND_URL", async () => {
    const res = await request(app)
      .options("/api/v1/auth/profile")
      .set("Origin", allowedOrigin)
      .set("Access-Control-Request-Method", "GET");

    expect(res.headers["access-control-allow-origin"]).toBe(allowedOrigin);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("allows the www variant of the configured origin", async () => {
    const url = new URL(allowedOrigin);
    const wwwOrigin = url.hostname.startsWith("www.")
      ? allowedOrigin
      : `${url.protocol}//www.${url.hostname}${url.port ? `:${url.port}` : ""}`;

    const res = await request(app)
      .options("/api/v1/auth/profile")
      .set("Origin", wwwOrigin)
      .set("Access-Control-Request-Method", "GET");

    expect(res.headers["access-control-allow-origin"]).toBe(wwwOrigin);
  });

  it("rejects requests from disallowed origins", async () => {
    const res = await request(app)
      .options("/api/v1/auth/profile")
      .set("Origin", "https://evil.example.com")
      .set("Access-Control-Request-Method", "GET");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("allows requests with no Origin header (server-to-server)", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
  });
});
