import { createClient, RedisClientType } from "redis";
import { logger } from "./logger";

let redisClient: RedisClientType | null = null;
let redisInitPromise: Promise<void> | null = null;
let lastRetryLogAt = 0;

function shouldLogRetry(attempt: number): boolean {
  const now = Date.now();
  const minIntervalMs = attempt <= 2 ? 15000 : 5000;
  const shouldLog = now - lastRetryLogAt >= minIntervalMs || attempt % 5 === 0;
  if (shouldLog) {
    lastRetryLogAt = now;
  }
  return shouldLog;
}

/**
 * Initialize Redis client. Concurrency-safe: concurrent callers share a
 * single init promise. On failure the state resets so the next call retries.
 */
export async function initializeRedis(): Promise<void> {
  if (redisClient) {
    return;
  }

  if (redisInitPromise) {
    return redisInitPromise;
  }

  redisInitPromise = (async () => {
    const redisHost = process.env.REDIS_HOST || "localhost";
    const redisPort = parseInt(process.env.REDIS_PORT || "6379");

    const client: RedisClientType = createClient({
      socket: {
        host: redisHost,
        port: redisPort,
        reconnectStrategy: (retries) => {
          const attempt = retries + 1;
          const delay = Math.min(Math.pow(2, retries) * 1000, 30000);

          if (shouldLogRetry(attempt)) {
            logger.warn(
              { attempt, delay, host: redisHost, port: redisPort },
              "Retrying Redis connection",
            );
          }

          return delay;
        },
      },
      password: process.env.REDIS_PASSWORD,
    });

    client.on("error", (error) => {
      logger.error({ error }, "Redis client error");
    });

    client.on("connect", () => {
      logger.info("Redis client connected");
    });

    client.on("ready", () => {
      logger.info("Redis client ready");
    });

    client.on("reconnecting", () => {
      logger.warn("Redis client reconnecting");
    });

    try {
      await client.connect();
      redisClient = client;
      redisInitPromise = null;
    } catch (error) {
      redisInitPromise = null;
      throw error;
    }
  })();

  return redisInitPromise;
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error(
      "Redis client not initialized. Call initializeRedis() first.",
    );
  }
  return redisClient;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info("Redis client closed");
  }

  redisInitPromise = null;
}

/**
 * Check Redis health
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    if (!redisClient) {
      return false;
    }
    await redisClient.ping();
    return true;
  } catch (error) {
    logger.error({ error }, "Redis health check failed");
    return false;
  }
}
