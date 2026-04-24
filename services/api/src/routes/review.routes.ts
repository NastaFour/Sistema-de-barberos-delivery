import { Router } from 'express';
import prisma from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    message: 'Too many reviews, please try again later',
  },
});

const router = Router();

// Create review for completed booking
router.post('/', authenticate, reviewLimiter, async (req: AuthRequest, res) => {
  try {
    const { bookingId, rating, comment, images = [] } = req.body;

    // Validate required fields
    if (!bookingId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const clientId = req.user!.userId;

    // Get booking and verify it belongs to client and is completed
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        barber: true,
        review: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.clientId !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'You can only review your own bookings'
      });
    }

    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed bookings'
      });
    }

    if (booking.review) {
      return res.status(409).json({
        success: false,
        message: 'Review already exists for this booking'
      });
    }

    // Create review and update rating in transaction
    const review = await prisma.$transaction(async (tx: any) => {
      const newReview = await tx.review.create({
        data: {
          bookingId,
          clientId,
          barberId: booking.barber.userId,
          rating,
          comment,
          images
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          booking: {
            select: {
              id: true,
              scheduledAt: true
            }
          }
        }
      });

      const existingReviews = await tx.review.findMany({
        where: { barberId: booking.barber.userId },
        select: { rating: true }
      });

      const totalReviews = existingReviews.length;
      const averageRating = existingReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews;

      await tx.barberProfile.update({
        where: { id: booking.barber.id },
        data: {
          rating: averageRating,
          totalReviews: totalReviews
        }
      });

      return newReview;
    });

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error: any) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review'
    });
  }
});

// Get reviews for a barber
router.get('/barber/:barberId', async (req, res) => {
  try {
    const { barberId } = req.params;
    const { limit = 10, offset = 0, rating } = req.query;

    let whereClause: any = { barberId };

    if (rating) {
      whereClause.rating = parseInt(rating as string);
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        booking: {
          select: {
            id: true,
            scheduledAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    const total = await prisma.review.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews'
    });
  }
});

// Get my reviews (for clients)
router.get('/my-reviews', authenticate, async (req: AuthRequest, res) => {
  try {
    const clientId = req.user!.userId;

    const reviews = await prisma.review.findMany({
      where: { clientId },
      include: {
        barber: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        },
        booking: {
          select: {
            id: true,
            scheduledAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: reviews
    });
  } catch (error: any) {
    console.error('Get my reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews'
    });
  }
});

export default router;
