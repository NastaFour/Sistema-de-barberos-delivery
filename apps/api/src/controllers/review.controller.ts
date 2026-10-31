import type { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import prisma from "../config/db";
import type { AuthRequest } from "../types";
import { errorResponse, successResponse } from "../utils/apiResponse";

export async function createReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { bookingId, rating, comment, images = [] } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json(errorResponse("Booking ID and rating are required"));
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json(errorResponse("Rating must be between 1 and 5"));
    }

    const clientId = req.user!.userId;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { barber: true, review: true },
    });

    if (!booking) {
      return res.status(404).json(errorResponse("Booking not found"));
    }

    if (booking.clientId !== clientId) {
      return res.status(403).json(errorResponse("You can only review your own bookings"));
    }

    if (booking.status !== "COMPLETED") {
      return res.status(400).json(errorResponse("Can only review completed bookings"));
    }

    if (booking.review) {
      return res.status(409).json(errorResponse("Review already exists for this booking"));
    }

    const review = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newReview = await tx.review.create({
        data: {
          bookingId,
          clientId,
          barberId: booking.barber.userId,
          rating,
          comment,
          images,
        },
        include: {
          client: { select: { id: true, name: true, avatar: true } },
          booking: { select: { id: true, scheduledAt: true } },
        },
      });

      const existingReviews = await tx.review.findMany({
        where: { barberId: booking.barber.userId },
        select: { rating: true },
      });

      const totalReviews = existingReviews.length;
      const averageRating =
        existingReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) /
        totalReviews;

      await tx.barberProfile.update({
        where: { id: booking.barber.id },
        data: { rating: averageRating, totalReviews },
      });

      return newReview;
    });

    res.status(201).json(successResponse(review));
  } catch (error: unknown) {
    next(error);
  }
}

export async function getBarberReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const { barberId } = req.params;
    const { limit = "10", offset = "0", rating } = req.query;

    const whereClause: Record<string, string | number> = { barberId };
    if (rating) {
      whereClause.rating = Number.parseInt(rating as string);
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        client: { select: { id: true, name: true, avatar: true } },
        booking: { select: { id: true, scheduledAt: true } },
      },
      orderBy: { createdAt: "desc" },
      take: Number.parseInt(limit as string),
      skip: Number.parseInt(offset as string),
    });

    const total = await prisma.review.count({ where: whereClause });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        total,
        limit: Number.parseInt(limit as string),
        offset: Number.parseInt(offset as string),
      },
    });
  } catch (error: unknown) {
    next(error);
  }
}

export async function getMyReviews(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.userId;

    const reviews = await prisma.review.findMany({
      where: { clientId },
      include: {
        barber: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        booking: { select: { id: true, scheduledAt: true } },
      } as never,
      orderBy: { createdAt: "desc" },
    });

    res.json(successResponse(reviews));
  } catch (error: unknown) {
    next(error);
  }
}
