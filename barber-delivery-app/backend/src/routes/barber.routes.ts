import { Router } from 'express';
import prisma from '../config/db';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Get all active barbers with their services
router.get('/', async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    let whereClause: any = {
      isActive: true
    };

    // Filter by location if provided
    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const serviceRadius = parseFloat(radius as string);

      // Simple distance filter (can be enhanced with PostGIS)
      whereClause = {
        ...whereClause,
        latitude: {
          gte: lat - (serviceRadius / 111),
          lte: lat + (serviceRadius / 111)
        },
        longitude: {
          gte: lng - (serviceRadius / (111 * Math.cos(lat * Math.PI / 180))),
          lte: lng + (serviceRadius / (111 * Math.cos(lat * Math.PI / 180)))
        }
      };
    }

    const barbers = await prisma.barberProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        services: {
          where: { isActive: true }
        },
        gallery: {
          take: 3,
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { rating: 'desc' }
    });

    res.json({
      success: true,
      data: barbers
    });
  } catch (error: any) {
    console.error('Get barbers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching barbers'
    });
  }
});

// Get barber by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const barber = await prisma.barberProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true
          }
        },
        services: {
          where: { isActive: true },
          orderBy: { name: 'asc' }
        },
        gallery: {
          orderBy: { order: 'asc' }
        },
        bookings: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            scheduledAt: true,
            total: true,
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found'
      });
    }

    res.json({
      success: true,
      data: barber
    });
  } catch (error: any) {
    console.error('Get barber error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching barber'
    });
  }
});

// Update barber profile (Barber or Admin)
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { bio, specialty, yearsExperience, latitude, longitude, serviceRadius, availability } = req.body;

    // Check authorization
    const barber = await prisma.barberProfile.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found'
      });
    }

    if (req.user?.userId !== barber.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }

    const updatedBarber = await prisma.barberProfile.update({
      where: { id },
      data: {
        bio,
        specialty: specialty || undefined,
        yearsExperience,
        latitude,
        longitude,
        serviceRadius,
        availability: availability || undefined
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true
          }
        },
        services: {
          where: { isActive: true }
        }
      }
    });

    res.json({
      success: true,
      data: updatedBarber
    });
  } catch (error: any) {
    console.error('Update barber error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating barber'
    });
  }
});

// Toggle barber active status
router.patch('/:id/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const barber = await prisma.barberProfile.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found'
      });
    }

    if (req.user?.userId !== barber.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }

    const updatedBarber = await prisma.barberProfile.update({
      where: { id },
      data: { isActive },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedBarber
    });
  } catch (error: any) {
    console.error('Toggle status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status'
    });
  }
});

// Add service to barber
router.post('/:id/services', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration } = req.body;

    const barber = await prisma.barberProfile.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found'
      });
    }

    if (req.user?.userId !== barber.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }

    const service = await prisma.barberService.create({
      data: {
        barberId: id,
        name,
        description,
        price,
        duration
      }
    });

    res.status(201).json({
      success: true,
      data: service
    });
  } catch (error: any) {
    console.error('Add service error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding service'
    });
  }
});

export default router;
