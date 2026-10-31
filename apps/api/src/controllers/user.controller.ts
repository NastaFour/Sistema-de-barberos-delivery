import type { NextFunction, Response } from "express";
import prisma from "../config/db";
import type { AuthRequest } from "../types";
import { errorResponse, successResponse } from "../utils/apiResponse";

export async function getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
        barberProfile: {
          select: { isVerified: true, isActive: true, rating: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(successResponse(users));
  } catch (error: unknown) {
    next(error);
  }
}

export async function getUserById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
        barberProfile: true,
        clientBookings: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: { id: true, status: true, scheduledAt: true, total: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json(errorResponse("User not found"));
    }

    res.json(successResponse(user));
  } catch (error: unknown) {
    next(error);
  }
}

export async function updateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { name, phone, avatar } = req.body;

    if (req.user?.userId !== id && req.user?.role !== "ADMIN") {
      return res.status(403).json(errorResponse("Forbidden"));
    }

    const user = await prisma.user.update({
      where: { id },
      data: { name, phone, avatar },
      select: { id: true, email: true, name: true, phone: true, role: true, avatar: true },
    });

    res.json(successResponse(user));
  } catch (error: unknown) {
    next(error);
  }
}

export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    await prisma.user.delete({ where: { id } });

    res.json(successResponse(null, "User deleted successfully"));
  } catch (error: unknown) {
    next(error);
  }
}
