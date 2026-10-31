import type { NextFunction, Request, Response } from "express";
import * as bookingService from "../services/booking.service";
import type { AuthRequest } from "../types";
import { errorResponse, successResponse } from "../utils/apiResponse";

export async function createBooking(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const clientId = req.user!.userId;
    const { barberId, scheduledAt, serviceIds, address, latitude, longitude, notes } = req.body;

    const booking = await bookingService.createBooking({
      clientId,
      barberId,
      scheduledAt: new Date(scheduledAt),
      serviceIds,
      address,
      latitude,
      longitude,
      notes,
    });

    res.status(201).json(successResponse(booking, "Reserva creada exitosamente"));
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("no está disponible")) {
      return res.status(409).json(errorResponse(msg));
    }
    if (msg.includes("debe ser al menos 2 horas")) {
      return res.status(400).json(errorResponse(msg));
    }
    next(error);
  }
}

export async function getMyBookings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const { status, page = "1", limit = "10" } = req.query;

    const bookings = await bookingService.getMyBookings({
      userId,
      role,
      status: status as string,
      page: Number.parseInt(page as string),
      limit: Number.parseInt(limit as string),
    });

    res.json(successResponse(bookings));
  } catch (error: unknown) {
    next(error);
  }
}

export async function getBookingById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const role = req.user!.role;

    const booking = await bookingService.getBookingById(id, userId, role);

    if (!booking) {
      return res.status(404).json(errorResponse("Reserva no encontrada"));
    }

    res.json(successResponse(booking));
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Forbidden") {
      return res.status(403).json(errorResponse(msg));
    }
    next(error);
  }
}

export async function updateBookingStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!.userId;
    const role = req.user!.role;

    const booking = await bookingService.updateBookingStatus(id, status, userId, role);

    res.json(successResponse(booking, `Estado actualizado a ${status}`));
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("transición inválida")) {
      return res.status(400).json(errorResponse(msg));
    }
    if (msg === "Forbidden") {
      return res.status(403).json(errorResponse(msg));
    }
    if (msg === "Booking not found") {
      return res.status(404).json(errorResponse(msg));
    }
    next(error);
  }
}

export async function cancelBooking(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const role = req.user!.role;

    const booking = await bookingService.cancelBooking(id, userId, role);

    res.json(successResponse(booking, "Reserva cancelada exitosamente"));
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("no se puede cancelar")) {
      return res.status(400).json(errorResponse(msg));
    }
    if (msg === "Forbidden") {
      return res.status(403).json(errorResponse(msg));
    }
    if (msg === "Booking not found") {
      return res.status(404).json(errorResponse(msg));
    }
    next(error);
  }
}

export async function getAvailableSlots(req: Request, res: Response, next: NextFunction) {
  try {
    const { barberId, date } = req.query;

    if (!barberId || !date) {
      return res.status(400).json(errorResponse("barberId y date son requeridos"));
    }

    const slots = await bookingService.getAvailableSlots(
      barberId as string,
      new Date(date as string),
    );

    res.json(successResponse(slots));
  } catch (error: unknown) {
    next(error);
  }
}
