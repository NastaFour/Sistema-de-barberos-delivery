import type { NextFunction, Request, Response } from "express";
import { clearTokenCookies, setTokenCookies } from "../middleware/auth.middleware";
import * as authService from "../services/auth.service";
import type { AuthRequest } from "../types";
import { errorResponse, successResponse } from "../utils/apiResponse";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name, phone, role } = req.body;

    const result = await authService.registerUser({
      email,
      password,
      name,
      phone,
      role,
    });

    setTokenCookies(res, result);

    res.status(201).json(successResponse(result, "User registered successfully"));
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "User with this email already exists") {
      return res.status(409).json(errorResponse(error.message));
    }
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser({ email, password });

    setTokenCookies(res, result);

    res.json(successResponse(result, "Login successful"));
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Invalid credentials") {
      return res.status(401).json(errorResponse(error.message));
    }
    next(error);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const refresh_token = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refresh_token) {
      return res.status(401).json(errorResponse("Refresh token missing"));
    }

    const result = await authService.refreshTokens(refresh_token);

    setTokenCookies(res, result);

    res.json(successResponse(result, "Token refreshed successfully"));
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Invalid refresh token") {
      return res.status(401).json(errorResponse(error.message));
    }
    next(error);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json(errorResponse("Unauthorized"));
    }

    const user = await authService.getUserProfile(req.user.userId);

    res.json(successResponse(user));
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "User not found") {
      return res.status(404).json(errorResponse(error.message));
    }
    next(error);
  }
}

export async function logout(req: Request, res: Response) {
  clearTokenCookies(res);
  res.json(successResponse(null, "Logged out successfully"));
}
