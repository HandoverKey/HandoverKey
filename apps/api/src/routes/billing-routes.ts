import { Router } from "express";
import { BillingController } from "../controllers/billing-controller";
import { authenticateJWT, requireAuth } from "../middleware/auth";

const router = Router();

// Authenticated routes
router.post(
  "/checkout",
  authenticateJWT,
  requireAuth,
  BillingController.createCheckoutSession,
);

router.post(
  "/portal",
  authenticateJWT,
  requireAuth,
  BillingController.createPortalSession,
);

router.get(
  "/status",
  authenticateJWT,
  requireAuth,
  BillingController.getStatus,
);

export default router;
