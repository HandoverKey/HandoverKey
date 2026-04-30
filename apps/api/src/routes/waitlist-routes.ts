import { Router } from "express";
import { WaitlistController } from "../controllers/waitlist-controller";
import { contactRateLimiter } from "../middleware/security";
import { validateRequest } from "../validation";
import { WaitlistSchema } from "../validation/schemas";

const router = Router();

router.post(
  "/",
  contactRateLimiter as unknown as import("express").RequestHandler,
  validateRequest(WaitlistSchema, "body"),
  WaitlistController.join,
);

export default router;
