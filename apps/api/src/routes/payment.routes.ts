import { Router } from "express";
import * as paymentController from "../controllers/payment.controller";
import { authenticate } from "../middleware/auth.middleware";

const router: Router = Router();

// POST /api/payments/create-intent (Auth: CLIENT)
router.post("/create-intent", authenticate, paymentController.createIntent);

// POST /api/payments/confirm (Auth: CLIENT)
router.post("/confirm", authenticate, paymentController.confirm);

// POST /api/payments/webhook (PUBLIC — raw body required)
router.post("/webhook", paymentController.handleWebhook);

// POST /api/payments/connect/account (Auth: BARBER)
router.post("/connect/account", authenticate, paymentController.connectAccount);

// GET /api/payments/connect/status (Auth: BARBER)
router.get("/connect/status", authenticate, paymentController.connectStatus);

export default router;
