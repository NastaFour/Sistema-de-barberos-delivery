import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as bookingService from '../services/booking.service';
import { successResponse, errorResponse } from '../utils/apiResponse';
import prisma from '../config/db';

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

    res.status(201).json(successResponse(booking, 'Reserva creada exitosamente'));
  } catch (error: any) {
    if (error.message.includes('no está disponible')) {
      return res.status(409).json(errorResponse(error.message));
    }
    if (error.message.includes('debe ser al menos 2 horas')) {
      return res.status(400).json(errorResponse(error.message));
    }
    next(error);
  }
}

export async function getMyBookings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const { status, page = '1', limit = '10' } = req.query;

    const bookings = await bookingService.getMyBookings({
      userId,
      role,
      status: status as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json(successResponse(bookings));
  } catch (error: any) {
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
      return res.status(404).json(errorResponse('Reserva no encontrada'));
    }

    res.json(successResponse(booking));
  } catch (error: any) {
    if (error.message === 'Forbidden') {
      return res.status(403).json(errorResponse(error.message));
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
  } catch (error: any) {
    if (error.message.includes('transición inválida')) {
      return res.status(400).json(errorResponse(error.message));
    }
    if (error.message === 'Forbidden') {
      return res.status(403).json(errorResponse(error.message));
    }
    if (error.message === 'Booking not found') {
      return res.status(404).json(errorResponse(error.message));
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

    res.json(successResponse(booking, 'Reserva cancelada exitosamente'));
  } catch (error: any) {
    if (error.message.includes('no se puede cancelar')) {
      return res.status(400).json(errorResponse(error.message));
    }
    if (error.message === 'Forbidden') {
      return res.status(403).json(errorResponse(error.message));
    }
    if (error.message === 'Booking not found') {
      return res.status(404).json(errorResponse(error.message));
    }
    next(error);
  }
}

export async function getAvailableSlots(req: Request, res: Response, next: NextFunction) {
  try {
    const { barberId, date } = req.query;

    if (!barberId || !date) {
      return res.status(400).json(errorResponse('barberId y date son requeridos'));
    }

    const slots = await bookingService.getAvailableSlots(
      barberId as string,
      new Date(date as string)
    );

    res.json(successResponse(slots));
  } catch (error: any) {
    next(error);
  }
}
