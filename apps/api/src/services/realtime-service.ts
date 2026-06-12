import { IncomingMessage, Server as HttpServer } from "http";
import { URL } from "node:url";
import { randomUUID } from "node:crypto";
import { parse as parseCookie } from "cookie";
import { WebSocketServer, WebSocket } from "ws";
import type { RedisClientType } from "redis";
import { JWTManager } from "../auth/jwt";
import { SessionService } from "./session-service";
import { logger } from "../config/logger";
import { getRedisClient } from "../config/redis";

interface AuthedSocket extends WebSocket {
  userId?: string;
  sessionId?: string;
  isAlive?: boolean;
}

interface RealtimeEnvelope {
  event: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

// Redis channel used to fan realtime messages out to every API instance so a
// notification produced on one instance reaches a user's socket on another.
const CLUSTER_CHANNEL = "realtime:user-broadcast";

export class RealtimeService {
  private static instance: RealtimeService;
  private wss: WebSocketServer | null = null;
  private socketsByUser: Map<string, Set<AuthedSocket>> = new Map();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  // Unique per process, used to skip re-delivering our own published messages.
  private readonly instanceId: string = randomUUID();
  private publisher: RedisClientType | null = null;
  private subscriber: RedisClientType | null = null;

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  initialize(server: HttpServer): void {
    if (this.wss) {
      return;
    }

    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.wss.on("connection", (socket, request) => {
      void this.handleConnection(socket as AuthedSocket, request);
    });

    this.heartbeatInterval = setInterval(() => {
      if (!this.wss) {
        return;
      }
      this.wss.clients.forEach((rawSocket) => {
        const socket = rawSocket as AuthedSocket;
        if (socket.isAlive === false) {
          socket.terminate();
          return;
        }
        socket.isAlive = false;
        socket.ping();
      });
    }, 30000);

    // Best-effort: wire up Redis pub/sub so broadcasts reach sockets on other
    // API instances. If Redis is unavailable we transparently fall back to
    // single-instance (local-only) delivery.
    void this.enableClustering();

    logger.info("Realtime WebSocket service initialized");
  }

  /**
   * Subscribes to the Redis fan-out channel so this instance delivers messages
   * published by other instances to its local sockets. Idempotent + safe to
   * call when Redis is not configured.
   */
  async enableClustering(): Promise<void> {
    if (this.subscriber) {
      return;
    }
    try {
      const base = getRedisClient();
      this.publisher = base;
      const subscriber = base.duplicate();
      subscriber.on("error", (error) => {
        logger.warn({ err: error }, "Realtime subscriber error");
      });
      await subscriber.connect();
      try {
        await subscriber.subscribe(CLUSTER_CHANNEL, (raw: string) => {
          this.handleClusterMessage(raw);
        });
      } catch (subscribeError) {
        // Don't leak the duplicated connection if subscribe fails after connect.
        await subscriber.quit().catch(() => {});
        throw subscribeError;
      }
      this.subscriber = subscriber;
      logger.info("Realtime clustering enabled (Redis pub/sub)");
    } catch (error) {
      this.publisher = null;
      this.subscriber = null;
      logger.warn(
        { err: error },
        "Realtime clustering disabled; falling back to single-instance delivery",
      );
    }
  }

  close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.subscriber) {
      this.subscriber
        .quit()
        .catch((error) =>
          logger.warn({ err: error }, "Failed to close realtime subscriber"),
        );
      this.subscriber = null;
    }
    this.publisher = null;
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.socketsByUser.clear();
  }

  broadcastToUser(
    userId: string,
    event: string,
    payload: Record<string, unknown>,
  ): void {
    const message: RealtimeEnvelope = {
      event,
      payload,
      timestamp: new Date().toISOString(),
    };

    // Deliver to sockets connected to THIS instance immediately.
    this.deliverToLocalSockets(userId, message);

    // Fan out to other instances via Redis (if clustering is enabled). Other
    // instances skip messages they originated to avoid double delivery.
    if (this.publisher) {
      const envelope = JSON.stringify({
        originId: this.instanceId,
        userId,
        message,
      });
      this.publisher
        .publish(CLUSTER_CHANNEL, envelope)
        .catch((error) =>
          logger.warn({ err: error }, "Failed to publish realtime broadcast"),
        );
    }
  }

  private deliverToLocalSockets(
    userId: string,
    message: RealtimeEnvelope,
  ): void {
    const sockets = this.socketsByUser.get(userId);
    if (!sockets || sockets.size === 0) {
      return;
    }

    const serialized = JSON.stringify(message);
    sockets.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(serialized);
      }
    });
  }

  private handleClusterMessage(raw: string): void {
    try {
      const parsed = JSON.parse(raw) as {
        originId: string;
        userId: string;
        message: RealtimeEnvelope;
      };
      // We already delivered locally when we published, so ignore our own.
      if (parsed.originId === this.instanceId) {
        return;
      }
      this.deliverToLocalSockets(parsed.userId, parsed.message);
    } catch (error) {
      logger.warn({ err: error }, "Failed to handle realtime cluster message");
    }
  }

  getStats(): { connectedUsers: number; totalConnections: number } {
    let totalConnections = 0;
    this.socketsByUser.forEach((sockets) => {
      totalConnections += sockets.size;
    });

    return {
      connectedUsers: this.socketsByUser.size,
      totalConnections,
    };
  }

  private async handleConnection(
    socket: AuthedSocket,
    request: IncomingMessage,
  ): Promise<void> {
    try {
      const token = this.extractTokenFromRequest(request);
      if (!token) {
        socket.close(4401, "Authentication required");
        return;
      }

      const payload = JWTManager.verifyToken(token);
      const isValidSession = await SessionService.validateSession(payload);
      if (!isValidSession) {
        socket.close(4401, "Invalid session");
        return;
      }

      socket.userId = payload.userId;
      socket.sessionId = payload.sessionId;
      socket.isAlive = true;
      socket.on("pong", () => {
        socket.isAlive = true;
      });

      this.registerSocket(payload.userId, socket);

      socket.on("close", () => {
        this.unregisterSocket(payload.userId, socket);
      });
      socket.on("error", (error) => {
        logger.warn({ err: error }, "Realtime websocket error");
        this.unregisterSocket(payload.userId, socket);
      });
      socket.on("message", () => {
        // The server is currently push-only for notifications.
      });

      this.broadcastToUser(payload.userId, "realtime.connected", {
        sessionId: payload.sessionId,
      });
    } catch (error) {
      logger.warn(
        { err: error },
        "Failed to authenticate websocket connection",
      );
      socket.close(4401, "Authentication failed");
    }
  }

  private extractTokenFromRequest(request: IncomingMessage): string | null {
    const requestUrl = new URL(request.url || "/", "http://localhost");
    const queryToken = requestUrl.searchParams.get("token");
    if (queryToken) {
      return queryToken;
    }

    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) {
      return null;
    }

    const cookies = parseCookie(cookieHeader);
    return cookies.accessToken || null;
  }

  private registerSocket(userId: string, socket: AuthedSocket): void {
    const existing = this.socketsByUser.get(userId) || new Set<AuthedSocket>();
    existing.add(socket);
    this.socketsByUser.set(userId, existing);
  }

  private unregisterSocket(userId: string, socket: AuthedSocket): void {
    const sockets = this.socketsByUser.get(userId);
    if (!sockets) {
      return;
    }

    sockets.delete(socket);
    if (sockets.size === 0) {
      this.socketsByUser.delete(userId);
    }
  }
}

export const realtimeService = RealtimeService.getInstance();
