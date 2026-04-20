import app, { appInit, shutdownServices } from "./app";
import { logger } from "./config/logger";
import { createServer, Server } from "http";
import { realtimeService } from "./services/realtime-service";

const PORT = process.env.API_PORT || 3001;

let server: Server;

async function start() {
  await appInit;

  server = createServer(app);
  realtimeService.initialize(server);

  server.listen(PORT, () => {
    logger.info(`HandoverKey API server running on port ${PORT}`);
    if (process.env.NODE_ENV !== "production") {
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Auth endpoints: http://localhost:${PORT}/api/v1/auth`);
      logger.info(`Realtime websocket: ws://localhost:${PORT}/ws`);
    }
  });
}

async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully`);

  // Stop accepting new connections first
  if (server) {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }

  await shutdownServices();

  logger.info("Shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start().catch((err) => {
  logger.fatal({ err }, "Failed to start server");
  process.exit(1);
});

export default app;
