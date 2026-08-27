---
title: Testing
description: Test strategy, commands, and coverage expectations across the monorepo.
head: []
---

## Philosophy

- **Security first** — rigorous testing of encryption, authentication, and authorization
- **Real services** — API integration tests run against actual PostgreSQL and Redis, not mocks
- **Fast feedback** — tests complete in under 15 seconds locally

## Running tests

```bash
# All workspaces
npm test

# Specific workspace
npm test --workspace=@handoverkey/api
npm test --workspace=@handoverkey/web
npm test --workspace=@handoverkey/crypto

# With coverage
npm run test:coverage --workspace=@handoverkey/crypto

# Lint and format check
npm run lint
npm run format
```

### API integration tests

API tests require live PostgreSQL and Redis:

```bash
npm run docker:up
NODE_ENV=test npm test --workspace=@handoverkey/api
```

`NODE_ENV=test` activates the JSON email transport so tests don't require real SMTP.

## Test coverage by workspace

### `apps/api` — Jest integration tests

| File                           | Coverage                                                                    |
| ------------------------------ | --------------------------------------------------------------------------- |
| `auth.test.ts`                 | Registration, login rejection                                               |
| `auth-full.test.ts`            | Profile, logout, refresh, password reset, account deletion                  |
| `vault-crud.test.ts`           | Create, read, update, delete vault entries                                  |
| `vault-and-successors.test.ts` | Vault CRUD with successor management                                        |
| `handover-flow.test.ts`        | Grace period, initiation, cancellation, successor access, K-of-N threshold  |
| `sessions-activity.test.ts`    | Session listing, invalidation, activity logs, check-in, inactivity settings |
| `errors.test.ts`               | Custom error class hierarchy                                                |
| `error-handler.test.ts`        | Global error handler middleware                                             |
| `middleware.test.ts`           | Zod validation and input sanitization                                       |
| `validation.test.ts`           | Email and UUID validators                                                   |

### `apps/web` — Vitest + Testing Library

- App rendering and route navigation
- Auth flow (login, register) with cookie-based auth
- Vault flow (fetch entries, create entry)

### `packages/crypto` — Jest (80% coverage threshold enforced)

- AES-256-GCM encrypt/decrypt
- PBKDF2 key derivation
- Shamir's Secret Sharing: all K-of-N combinations, threshold enforcement, duplicate share detection, corruption detection, insufficient-shares behaviour

### `packages/database` — Jest

- DatabaseClient singleton behaviour
- Repository error handling

### `packages/shared` — Jest

- Utility functions and type validation

## Test environment

- `NODE_ENV=test` enables JSON email transport (no real SMTP)
- Rate limiters are relaxed in non-production environments
- Integration tests create a fresh `handoverkey_test` database via the global setup script
- Each test file manages its own DB connection pool and Redis client

## CI/CD

GitHub Actions runs the full suite on every push and PR:

1. **Lint & format** (parallel) — ESLint + Prettier
2. **Build** (parallel) — TypeScript compilation for all packages
3. **Test** (after build) — full suite with PostgreSQL 16 and Redis 7 service containers

## Writing integration tests

```typescript
import request from "supertest";
import app, { appInit } from "../../app";
import { getDatabaseClient } from "@handoverkey/database";
import { SessionService } from "../../services/session-service";
import { initializeRedis, closeRedis } from "../../config/redis";

describe("Feature Integration", () => {
  beforeAll(async () => {
    const dbClient = getDatabaseClient();
    await dbClient.initialize({/* test DB config */});
    SessionService.initialize(dbClient);
    await initializeRedis();
    await appInit;
  });

  afterAll(async () => {
    await closeRedis();
    await getDatabaseClient().close();
  });

  it("should do something", async () => {
    const res = await request(app)
      .post("/api/v1/endpoint")
      .send({ key: "value" });
    expect(res.status).toBe(200);
  });
});
```

### Guidelines

- Test the happy path first, then obvious failure cases
- Use `registerVerifyLogin()` helpers to avoid duplicating auth boilerplate
- Always set Content-Type by passing `.send({})` on POST requests
- Extract auth tokens from `Set-Cookie` headers (httpOnly cookies)
- Keep tests focused: one behaviour per test
