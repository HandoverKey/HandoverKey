import { Request, Response, NextFunction } from "express";
import { getDatabaseClient, WaitlistRepository } from "@handoverkey/database";
import { logger } from "../config/logger";

export class WaitlistController {
  static async join(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email, tier_interest, source } = req.body;

      const db = getDatabaseClient().getKysely();
      const waitlistRepo = new WaitlistRepository(db);

      // Check if already on waitlist
      const existing = await waitlistRepo.findByEmail(email);
      if (existing) {
        res.status(200).json({
          message: "You're already on the waitlist!",
        });
        return;
      }

      await waitlistRepo.create({
        email,
        tier_interest: tier_interest || null,
        source: source || null,
      });

      logger.info({ email, source }, "New waitlist signup");

      res.status(201).json({
        message: "You're on the list! We'll notify you when paid plans launch.",
      });
    } catch (error) {
      logger.error(
        { err: error, email: req.body.email },
        "Failed to add to waitlist",
      );
      next(error);
    }
  }
}
