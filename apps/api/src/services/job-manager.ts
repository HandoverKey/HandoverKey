import { InactivityMonitorService } from "./inactivity-monitor";
import { logger } from "../config/logger";

/**
 * Returns the configured inactivity scheduling mode. Defaults to "queue", which
 * relies on the single BullMQ repeatable job (Redis-deduplicated) so the API
 * can be scaled horizontally without duplicate inactivity processing.
 */
function getInactivityMonitorMode(): "queue" | "in-process" {
  return process.env.INACTIVITY_MONITOR_MODE === "in-process"
    ? "in-process"
    : "queue";
}

export class JobManager {
  private static instance: JobManager;
  private inactivityMonitor: InactivityMonitorService;
  private isStarted: boolean = false;
  private readonly inactivityMode: "queue" | "in-process";

  constructor() {
    this.inactivityMonitor = InactivityMonitorService.getInstance();
    this.inactivityMode = getInactivityMonitorMode();
  }

  static getInstance(): JobManager {
    if (!JobManager.instance) {
      JobManager.instance = new JobManager();
    }
    return JobManager.instance;
  }

  /**
   * Starts all background jobs
   */
  start(): void {
    if (this.isStarted) {
      logger.info("JobManager is already started");
      return;
    }

    logger.info("Starting JobManager...");

    if (this.inactivityMode === "in-process") {
      // Single-instance mode: run the periodic in-process loop. NOT safe to run
      // on more than one instance (duplicate inactivity processing).
      logger.warn(
        "Starting in-process inactivity monitor (INACTIVITY_MONITOR_MODE=in-process). " +
          "Do not run multiple API instances in this mode.",
      );
      this.inactivityMonitor.start();
    } else {
      // Queue mode (default): the BullMQ repeatable inactivity job is the single
      // scheduler across all instances, so we do NOT start a per-instance loop.
      logger.info(
        "Inactivity monitoring runs via the shared job queue (multi-instance safe).",
      );
    }

    this.isStarted = true;
    logger.info("JobManager started successfully");
  }

  /**
   * Stops all background jobs
   */
  stop(): void {
    if (!this.isStarted) {
      logger.info("JobManager is not started");
      return;
    }

    logger.info("Stopping JobManager...");

    // Stop the inactivity monitor
    this.inactivityMonitor.stop();

    this.isStarted = false;
    logger.info("JobManager stopped successfully");
  }

  /**
   * Gets the health status of all jobs
   */
  async getHealthStatus(): Promise<{
    isHealthy: boolean;
    jobs: {
      inactivityMonitor: {
        isHealthy: boolean;
        stats: unknown;
      };
    };
  }> {
    const inactivityMonitorStats = await this.inactivityMonitor.getStats();
    // In queue mode the periodic loop is intentionally not running on this
    // instance; the shared BullMQ job (health-checked separately) handles it.
    const inactivityMonitorHealthy =
      this.inactivityMode === "queue"
        ? this.isStarted
        : this.inactivityMonitor.isHealthy();

    return {
      isHealthy: inactivityMonitorHealthy,
      jobs: {
        inactivityMonitor: {
          isHealthy: inactivityMonitorHealthy,
          stats: { mode: this.inactivityMode, ...inactivityMonitorStats },
        },
      },
    };
  }

  /**
   * Manually trigger inactivity check for all users
   */
  async triggerInactivityCheck(): Promise<void> {
    logger.info("Manually triggering inactivity check...");
    await this.inactivityMonitor.checkAllUsers();
  }

  /**
   * Manually trigger inactivity check for a specific user
   */
  async triggerUserInactivityCheck(userId: string): Promise<void> {
    logger.info(`Manually triggering inactivity check for user ${userId}...`);
    await this.inactivityMonitor.checkUserInactivity(userId);
  }
}
