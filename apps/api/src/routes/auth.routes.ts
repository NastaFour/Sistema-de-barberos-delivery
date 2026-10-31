import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { loginSchema, refreshTokenSchema, registerSchema } from "../schemas/auth.schema";

const router: Router = Router();

// POST /api/auth/register
router.post("/register", validateRequest(registerSchema), authController.register);

// POST /api/auth/login
router.post("/login", validateRequest(loginSchema), authController.login);

// POST /api/auth/refresh
router.post("/refresh", validateRequest(refreshTokenSchema), authController.refreshToken);

// GET /api/auth/me
router.get("/me", authMiddleware, authController.getMe);

// POST /api/auth/logout
router.post("/logout", authController.logout);

export default router;
