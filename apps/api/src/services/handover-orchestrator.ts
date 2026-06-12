import {
  getDatabaseClient,
  HandoverProcessRepository,
  SuccessorNotificationRepository,
  SuccessorRepository,
  InactivitySettingsRepository,
} from "@handoverkey/database";
import {
  HandoverOrchestrator as IHandoverOrchestrator,
  HandoverProcess,
  HandoverProcessStatus,
  ReminderType,
} from "@handoverkey/shared/src/types/dead-mans-switch";
import { NotificationService } from "./notification-service";
import { logger } from "../config/logger";
import { realtimeService } from "./realtime-service";

const GRACE_PERIOD_HOURS = parseInt(process.env.GRACE_PERIOD_HOURS || "48", 10);
const DEFAULT_RESPONSE_WINDOW_DAYS = 14;

export interface SuccessorAccessDecision {
  allowed: boolean;
  reason?: string;
  status?: string;
  acceptedCount: number;
  threshold: number;
  totalNotified: number;
}

export class HandoverOrchestrator implements IHandoverOrchestrator {
  private static getHandoverProcessRepository(): HandoverProcessRepository {
    const dbClient = getDatabaseClient();
    return new HandoverProcessRepository(dbClient.getKysely());
  }

  private static getSuccessorNotificationRepository(): SuccessorNotificationRepository {
    const dbClient = getDatabaseClient();
    return new SuccessorNotificationRepository(dbClient.getKysely());
  }

  private static getSuccessorRepository(): SuccessorRepository {
    const dbClient = getDatabaseClient();
    return new SuccessorRepository(dbClient.getKysely());
  }

  private static getInactivitySettingsRepository(): InactivitySettingsRepository {
    const dbClient = getDatabaseClient();
    return new InactivitySettingsRepository(dbClient.getKysely());
  }

  /**
   * Computes the K-of-N threshold required to release the vault, mirroring the
   * client-side share-splitting logic so the server can enforce it.
   */
  static computeThreshold(
    successorCount: number,
    requireMajority: boolean,
  ): number {
    if (successorCount <= 1) {
      return successorCount;
    }
    return requireMajority
      ? Math.floor(successorCount / 2) + 1
      : Math.min(2, successorCount);
  }

  private async getRequireMajority(userId: string): Promise<boolean> {
    const settingsRepo = HandoverOrchestrator.getInactivitySettingsRepository();
    const settings = await settingsRepo.findByUserId(userId);
    return Boolean(settings?.require_majority);
  }

  /**
   * Initiates the handover process for a user
   */
  async initiateHandover(userId: string): Promise<HandoverProcess> {
    try {
      // Check if there's already an active handover process
      const existingHandover = await this.getActiveHandover(userId);
      if (existingHandover) {
        return existingHandover;
      }

      const now = new Date();
      const gracePeriodEnds = new Date(
        now.getTime() + GRACE_PERIOD_HOURS * 60 * 60 * 1000,
      );

      const metadata = {
        gracePeriodHours: GRACE_PERIOD_HOURS,
        initiatedBy: "inactivity_monitor",
        reason: "inactivity_threshold_exceeded",
      };

      const handoverRepo = HandoverOrchestrator.getHandoverProcessRepository();
      const dbProcess = await handoverRepo.create({
        user_id: userId,
        status: HandoverProcessStatus.GRACE_PERIOD,
        initiated_at: now,
        grace_period_ends: gracePeriodEnds,
        metadata,
      });

      const handoverProcess = this.mapDbToHandoverProcess(dbProcess);

      realtimeService.broadcastToUser(userId, "handover.status_changed", {
        handoverId: handoverProcess.id,
        status: handoverProcess.status,
        gracePeriodEnds: handoverProcess.gracePeriodEnds,
      });

      logger.info(
        `Handover process initiated for user ${userId}, grace period ends: ${gracePeriodEnds.toISOString()}`,
      );

      // Send initial grace period notifications
      const notificationService = new NotificationService();
      await notificationService.sendReminder(
        userId,
        ReminderType.FINAL_WARNING,
      );

      return handoverProcess;
    } catch (error) {
      // Only log errors in non-test environments
      if (process.env.NODE_ENV !== "test") {
        logger.error(
          { err: error },
          `Failed to initiate handover for user ${userId}`,
        );
      }
      throw error;
    }
  }

  /**
   * Cancels an active handover process
   */
  async cancelHandover(userId: string, reason: string): Promise<void> {
    try {
      const handoverRepo = HandoverOrchestrator.getHandoverProcessRepository();
      const activeProcess = await handoverRepo.findActiveByUserId(userId);

      if (!activeProcess) {
        logger.info(`No active handover process found for user ${userId}`);
        return;
      }

      await handoverRepo.update(activeProcess.id, {
        status: HandoverProcessStatus.CANCELLED,
        cancelled_at: new Date(),
        cancellation_reason: reason,
      });

      realtimeService.broadcastToUser(userId, "handover.status_changed", {
        handoverId: activeProcess.id,
        status: HandoverProcessStatus.CANCELLED,
        reason,
      });

      logger.info(`Handover process cancelled for user ${userId}: ${reason}`);

      // Only notify successors if the process had already moved beyond grace period.
      const shouldNotifySuccessors =
        activeProcess.status !== HandoverProcessStatus.GRACE_PERIOD;

      if (shouldNotifySuccessors) {
        try {
          const dbClient = getDatabaseClient();
          const successorRepo = new (
            await import("@handoverkey/database")
          ).SuccessorRepository(dbClient.getKysely());
          const successors = await successorRepo.findByUserId(userId);
          if (successors.length > 0) {
            const notificationService = new NotificationService();
            await notificationService.sendHandoverCancellation(
              userId,
              successors.map((s) => ({
                name: s.name,
                email: s.email,
                encrypted_share: s.encrypted_share,
                verification_token: s.verification_token,
              })),
              reason,
            );
          }
        } catch (notifyError) {
          logger.error(
            { err: notifyError },
            "Failed to send cancellation notifications",
          );
          // Don't fail the cancellation process itself if notification fails
        }
      }
    } catch (error) {
      // Only log errors in non-test environments
      if (process.env.NODE_ENV !== "test") {
        logger.error(
          { err: error },
          `Failed to cancel handover for user ${userId}`,
        );
      }
      throw error;
    }
  }

  /**
   * Processes a successor's response to a handover notification.
   * Marks the notification as accepted or declined and, when all notified
   * successors have responded, transitions the handover to COMPLETED.
   */
  async processSuccessorResponse(
    handoverId: string,
    successorId: string,
    response: { accepted: boolean; message?: string },
  ): Promise<void> {
    try {
      logger.info(
        { handoverId, successorId, accepted: response.accepted },
        "Processing successor response",
      );

      const handoverRepo = HandoverOrchestrator.getHandoverProcessRepository();
      const handoverProcess = await handoverRepo.findById(handoverId);

      if (!handoverProcess) {
        logger.warn({ handoverId }, "Handover process not found");
        return;
      }

      const terminalStatuses: string[] = [
        HandoverProcessStatus.COMPLETED,
        HandoverProcessStatus.CANCELLED,
        HandoverProcessStatus.EXPIRED,
      ];
      if (terminalStatuses.includes(handoverProcess.status)) {
        logger.info(
          { handoverId, status: handoverProcess.status },
          "Ignoring successor response -- handover already in terminal state",
        );
        return;
      }

      const notificationRepo =
        HandoverOrchestrator.getSuccessorNotificationRepository();
      await notificationRepo.update(handoverId, successorId, {
        verification_status: response.accepted ? "VERIFIED" : "DECLINED",
        verified_at: new Date(),
      });

      realtimeService.broadcastToUser(
        handoverProcess.user_id,
        "handover.successor_responded",
        { handoverId, successorId, accepted: response.accepted },
      );

      const allNotifications =
        await notificationRepo.findByHandoverProcess(handoverId);
      const acceptedCount = allNotifications.filter(
        (n) => n.verification_status === "VERIFIED",
      ).length;
      const respondedCount = allNotifications.filter(
        (n) =>
          n.verification_status === "VERIFIED" ||
          n.verification_status === "DECLINED",
      ).length;
      const totalNotified = allNotifications.length;

      const requireMajority = await this.getRequireMajority(
        handoverProcess.user_id,
      );
      const threshold = HandoverOrchestrator.computeThreshold(
        totalNotified,
        requireMajority,
      );

      // Vault is only released once the K-of-N acceptance threshold is met.
      if (acceptedCount >= threshold && threshold > 0) {
        await handoverRepo.update(handoverId, {
          status: HandoverProcessStatus.COMPLETED,
          completed_at: new Date(),
        });

        realtimeService.broadcastToUser(
          handoverProcess.user_id,
          "handover.status_changed",
          { handoverId, status: HandoverProcessStatus.COMPLETED },
        );

        logger.info(
          { handoverId, acceptedCount, threshold },
          "Handover process completed -- acceptance threshold reached",
        );
        return;
      }

      // Everyone responded but not enough accepted (e.g. all declined): the
      // handover expires WITHOUT releasing the vault.
      if (respondedCount === totalNotified && acceptedCount < threshold) {
        await handoverRepo.update(handoverId, {
          status: HandoverProcessStatus.EXPIRED,
        });

        realtimeService.broadcastToUser(
          handoverProcess.user_id,
          "handover.status_changed",
          { handoverId, status: HandoverProcessStatus.EXPIRED },
        );

        logger.info(
          { handoverId, acceptedCount, threshold },
          "Handover expired -- not enough successors accepted",
        );
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "test") {
        logger.error(
          { err: error },
          `Failed to process successor response for handover ${handoverId}`,
        );
      }
      throw error;
    }
  }

  /**
   * Gets the current handover status for a user
   */
  async getHandoverStatus(userId: string): Promise<HandoverProcess | null> {
    try {
      return await this.getActiveHandover(userId);
    } catch (error) {
      // Only log errors in non-test environments
      if (process.env.NODE_ENV !== "test") {
        logger.error(
          { err: error },
          `Failed to get handover status for user ${userId}`,
        );
      }
      return null;
    }
  }

  /**
   * Processes grace period expiration
   */
  async processGracePeriodExpiration(handoverId: string): Promise<void> {
    try {
      const handoverRepo = HandoverOrchestrator.getHandoverProcessRepository();
      const process = await handoverRepo.findById(handoverId);

      if (!process || process.status !== HandoverProcessStatus.GRACE_PERIOD) {
        logger.info(
          `Handover ${handoverId} is not in grace period or doesn't exist`,
        );
        return;
      }

      await handoverRepo.update(handoverId, {
        status: HandoverProcessStatus.AWAITING_SUCCESSORS,
      });

      realtimeService.broadcastToUser(
        process.user_id,
        "handover.status_changed",
        {
          handoverId,
          status: HandoverProcessStatus.AWAITING_SUCCESSORS,
        },
      );

      logger.info(
        `Grace period expired for handover ${handoverId}, notifying successors`,
      );

      const successorRepo = HandoverOrchestrator.getSuccessorRepository();
      const successors = await successorRepo.findByUserId(process.user_id);

      // Create successor_notification rows so accept/decline + K-of-N
      // completion works in the real handover path (not just in tests).
      const notificationRepo =
        HandoverOrchestrator.getSuccessorNotificationRepository();
      const existing = await notificationRepo.findByHandoverProcess(handoverId);
      if (existing.length === 0) {
        const now = Date.now();
        for (const successor of successors) {
          const windowDays =
            successor.handover_delay_days ?? DEFAULT_RESPONSE_WINDOW_DAYS;
          await notificationRepo.create({
            handover_process_id: handoverId,
            successor_id: successor.id,
            response_deadline: new Date(now + windowDays * 24 * 60 * 60 * 1000),
            verification_status: "PENDING",
            verification_token: null,
          });
        }
      }

      // Notify successors. The email NEVER contains the key share itself; it
      // only links to the access page where the successor unwraps their share
      // with the out-of-band passphrase provided by the owner.
      const notificationService = new NotificationService();
      await notificationService.sendHandoverAlert(
        process.user_id,
        successors.map((s) => ({
          name: s.name,
          email: s.email,
          verification_token: s.verification_token,
        })),
        handoverId,
      );
    } catch (error) {
      // Only log errors in non-test environments
      if (process.env.NODE_ENV !== "test") {
        logger.error(
          { err: error },
          `Failed to process grace period expiration for handover ${handoverId}`,
        );
      }
      throw error;
    }
  }

  /**
   * Gets all handover processes that need attention
   */
  async getHandoversNeedingAttention(): Promise<HandoverProcess[]> {
    try {
      const handoverRepo = HandoverOrchestrator.getHandoverProcessRepository();

      // Get processes in various active states
      const gracePeriodProcesses = await handoverRepo.findByStatus(
        HandoverProcessStatus.GRACE_PERIOD,
      );
      const awaitingProcesses = await handoverRepo.findByStatus(
        HandoverProcessStatus.AWAITING_SUCCESSORS,
      );
      const verificationProcesses = await handoverRepo.findByStatus(
        HandoverProcessStatus.VERIFICATION_PENDING,
      );

      // Filter grace period processes that have expired
      const now = new Date();
      const expiredGracePeriod = gracePeriodProcesses.filter(
        (p) => new Date(p.grace_period_ends) <= now,
      );

      // Combine all processes that need attention
      const allProcesses = [
        ...expiredGracePeriod,
        ...awaitingProcesses,
        ...verificationProcesses,
      ];

      // Sort by creation date
      allProcesses.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

      return allProcesses.map((p) => this.mapDbToHandoverProcess(p));
    } catch (error) {
      // Only log errors in non-test environments
      if (process.env.NODE_ENV !== "test") {
        logger.error(
          { err: error },
          "Failed to get handovers needing attention",
        );
      }
      return [];
    }
  }

  /**
   * Determines whether a specific (already email-verified) successor may access
   * the owner's vault. Access requires:
   *   1. A handover that has moved past the grace period.
   *   2. This successor having ACCEPTED (verification_status = VERIFIED).
   *   3. The K-of-N acceptance threshold being met across all successors.
   */
  async getSuccessorAccessDecision(
    userId: string,
    successorId: string,
  ): Promise<SuccessorAccessDecision> {
    const handoverRepo = HandoverOrchestrator.getHandoverProcessRepository();
    const latest = await handoverRepo.findLatestByUserId(userId);

    const base = { acceptedCount: 0, threshold: 0, totalNotified: 0 };

    const openStatuses: string[] = [
      HandoverProcessStatus.AWAITING_SUCCESSORS,
      HandoverProcessStatus.VERIFICATION_PENDING,
      HandoverProcessStatus.READY_FOR_TRANSFER,
      HandoverProcessStatus.COMPLETED,
    ];

    if (!latest || !openStatuses.includes(latest.status)) {
      return {
        ...base,
        allowed: false,
        reason: "Handover access is not yet open",
        status: latest?.status,
      };
    }

    const notificationRepo =
      HandoverOrchestrator.getSuccessorNotificationRepository();
    const notifications = await notificationRepo.findByHandoverProcess(
      latest.id,
    );
    const totalNotified = notifications.length;
    const acceptedCount = notifications.filter(
      (n) => n.verification_status === "VERIFIED",
    ).length;
    const requireMajority = await this.getRequireMajority(userId);
    const threshold = HandoverOrchestrator.computeThreshold(
      totalNotified,
      requireMajority,
    );

    const mine = notifications.find((n) => n.successor_id === successorId);
    if (!mine || mine.verification_status !== "VERIFIED") {
      return {
        ...base,
        allowed: false,
        reason: "You must accept the handover before accessing the vault",
        status: latest.status,
        acceptedCount,
        threshold,
        totalNotified,
      };
    }

    if (acceptedCount < threshold) {
      return {
        allowed: false,
        reason:
          "Waiting for enough successors to accept before the vault can be released",
        status: latest.status,
        acceptedCount,
        threshold,
        totalNotified,
      };
    }

    return {
      allowed: true,
      status: latest.status,
      acceptedCount,
      threshold,
      totalNotified,
    };
  }

  /**
   * Private helper methods
   */
  private async getActiveHandover(
    userId: string,
  ): Promise<HandoverProcess | null> {
    const handoverRepo = HandoverOrchestrator.getHandoverProcessRepository();
    const dbProcess = await handoverRepo.findActiveByUserId(userId);

    if (!dbProcess) {
      return null;
    }

    return this.mapDbToHandoverProcess(dbProcess);
  }

  private mapDbToHandoverProcess(dbRow: {
    id: string;
    user_id: string;
    status: string;
    initiated_at: Date;
    grace_period_ends: Date;
    completed_at?: Date | null;
    cancelled_at?: Date | null;
    cancellation_reason?: string | null;
    metadata?: unknown;
    created_at: Date;
    updated_at: Date;
  }): HandoverProcess {
    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      status: dbRow.status as HandoverProcessStatus,
      initiatedAt: dbRow.initiated_at,
      gracePeriodEnds: dbRow.grace_period_ends,
      completedAt: dbRow.completed_at ?? undefined,
      cancelledAt: dbRow.cancelled_at ?? undefined,
      cancellationReason: dbRow.cancellation_reason ?? undefined,
      metadata: (dbRow.metadata as Record<string, unknown>) || {},
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }
}
