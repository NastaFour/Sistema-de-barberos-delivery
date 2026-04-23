import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as authService from '../services/auth.service';
import { successResponse, errorResponse } from '../utils/apiResponse';

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

    res.status(201).json(successResponse(result, 'User registered successfully'));
  } catch (error: any) {
    if (error.message === 'User with this email already exists') {
      return res.status(409).json(errorResponse(error.message));
    }
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser({ email, password });

    res.json(successResponse(result, 'Login successful'));
  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json(errorResponse(error.message));
    }
    next(error);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken: refresh_token } = req.body;

    const result = await authService.refreshTokens(refresh_token);

    res.json(successResponse(result, 'Token refreshed successfully'));
  } catch (error: any) {
    if (error.message === 'Invalid refresh token') {
      return res.status(401).json(errorResponse(error.message));
    }
    next(error);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json(errorResponse('Unauthorized'));
    }

    const user = await authService.getUserProfile(req.user.userId);

    res.json(successResponse(user));
  } catch (error: any) {
    if (error.message === 'User not found') {
      return res.status(404).json(errorResponse(error.message));
    }
    next(error);
  }
}
