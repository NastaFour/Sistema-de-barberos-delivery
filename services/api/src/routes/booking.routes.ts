import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createBookingSchema, updateStatusSchema } from '../schemas/booking.schema';
import rateLimit from 'express-rate-limit';

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 bookings per 15 min per IP
  message: {
    success: false,
    message: 'Too many booking requests, please try again later',
  },
});

const router = Router();

// Create new booking
router.post(
  '/',
  authenticate,
  bookingLimiter,
  validateRequest(createBookingSchema),
  bookingController.createBooking
);

// Get my bookings
router.get('/my', authenticate, bookingController.getMyBookings);

// Get available slots for a barber
router.get('/slots', bookingController.getAvailableSlots);

// Get booking by ID
router.get('/:id', authenticate, bookingController.getBookingById);

// Update booking status
router.patch(
  '/:id/status',
  authenticate,
  validateRequest(updateStatusSchema),
  bookingController.updateBookingStatus
);

// Cancel booking
router.delete('/:id', authenticate, bookingController.cancelBooking);

export default router;
