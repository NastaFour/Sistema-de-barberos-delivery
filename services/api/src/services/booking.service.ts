import prisma from '../config/db';
import { Prisma } from '@prisma/client';
import { getSocket } from './socket.service';
import { isSlotAvailable, getAvailableSlots as getSlots } from './availability.service';
import { NotificationService } from './notification.service';

interface CreateBookingDTO {
  clientId: string;
  barberId: string;
  scheduledAt: Date;
  serviceIds: string[];
  address: string;
  latitude: number;
  longitude: number;
  notes?: string;
}

interface GetMyBookingsDTO {
  userId: string;
  role: string;
  status?: string;
  page: number;
  limit: number;
}

export async function createBooking(data: CreateBookingDTO) {
  const { clientId, barberId, scheduledAt, serviceIds, address, latitude, longitude, notes } = data;

  // Validar que la fecha sea al menos 2 horas en el futuro
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  if (scheduledAt < twoHoursFromNow) {
    throw new Error('La reserva debe ser al menos 2 horas en el futuro');
  }

  // Obtener servicios y validar que pertenecen al barbero
  const services = await prisma.barberService.findMany({
    where: {
      id: { in: serviceIds },
      barberId,
      isActive: true,
    },
  });

  if (services.length !== serviceIds.length) {
    throw new Error('Uno o más servicios no existen o no están activos');
  }

  // Calcular duración total y verificar disponibilidad
  const totalDuration = services.reduce((sum: number, s: any) => sum + s.duration, 0);
  
  const { available } = await isSlotAvailable(barberId, scheduledAt, serviceIds, 15);
  if (!available) {
    throw new Error('El barbero no está disponible en ese horario');
  }

  // Calcular precios
  const subtotal = services.reduce((sum: number, s: any) => sum + s.price, 0);
  const serviceFee = subtotal * 0.05; // 5% comisión
  const total = subtotal + serviceFee;

  // Crear reserva en transacción
  const booking = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const newBooking = await tx.booking.create({
      data: {
        clientId,
        barberId,
        status: 'PENDING',
        address,
        latitude,
        longitude,
        notes,
        scheduledAt,
        subtotal,
        serviceFee,
        total,
        services: {
          create: services.map((service: any) => ({
            serviceId: service.id,
            quantity: 1,
            price: service.price,
          })),
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        barber: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    return newBooking;
  });

  // Notificar al barbero via WebSocket
  const io = getSocket();
  if (io) {
    io.to(`barber:${barberId}`).emit('new_booking', {
      bookingId: booking.id,
      clientName: booking.client.name,
      scheduledAt: booking.scheduledAt,
    });
  }

  // Notificar via Push Notification
  try {
    await NotificationService.notifyBarberNewBooking(
      booking.barber.userId, 
      booking.client.name, 
      booking.scheduledAt, 
      booking.id
    );
  } catch (error) {
    console.error('No se pudo enviar la push notification:', error);
  }

  return booking;
}

export async function getMyBookings(data: GetMyBookingsDTO) {
  const { userId, role, status, page, limit } = data;

  let whereClause: any = {};

  if (role === 'CLIENT') {
    whereClause.clientId = userId;
  } else if (role === 'BARBER') {
    const barberProfile = await prisma.barberProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (barberProfile) {
      whereClause.barberId = barberProfile.id;
    } else {
      return [];
    }
  }

  if (status) {
    whereClause.status = status;
  }

  const skip = (page - 1) * limit;

  const bookings = await prisma.booking.findMany({
    where: whereClause,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          avatar: true,
        },
      },
      barber: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              avatar: true,
            },
          },
        },
      },
      services: {
        include: {
          service: true,
        },
      },
      review: true,
    },
    orderBy: { scheduledAt: 'desc' },
    skip,
    take: limit,
  });

  return bookings;
}

export async function getBookingById(bookingId: string, userId: string, role: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          avatar: true,
        },
      },
      barber: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
      services: {
        include: {
          service: true,
        },
      },
      review: true,
    },
  });

  if (!booking) return null;

  // Verificar autorización
  if (role !== 'ADMIN' && booking.clientId !== userId && booking.barber.userId !== userId) {
    throw new Error('Forbidden');
  }

  return booking;
}

const validTransitions: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export async function updateBookingStatus(
  bookingId: string,
  newStatus: string,
  userId: string,
  role: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { barber: true, client: true },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  // Verificar autorización
  const canUpdate =
    role === 'ADMIN' ||
    (role === 'BARBER' && booking.barber.userId === userId) ||
    (role === 'CLIENT' && booking.clientId === userId);

  if (!canUpdate) {
    throw new Error('Forbidden');
  }

  // Verificar transición válida
  if (!validTransitions[booking.status].includes(newStatus)) {
    throw new Error(`Transición inválida de ${booking.status} a ${newStatus}`);
  }

  // Reglas adicionales para clientes
  if (role === 'CLIENT' && newStatus === 'CANCELLED') {
    const fourHoursFromNow = new Date(booking.scheduledAt.getTime() - 4 * 60 * 60 * 1000);
    if (new Date() > fourHoursFromNow) {
      throw new Error('Solo se puede cancelar hasta 4 horas antes de la cita');
    }
  }

  const updateData: any = { status: newStatus };

  if (newStatus === 'IN_PROGRESS') {
    updateData.startedAt = new Date();
  } else if (newStatus === 'COMPLETED') {
    updateData.completedAt = new Date();
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: updateData,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      barber: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      services: {
        include: {
          service: true,
        },
      },
    },
  });

  // Notificar cambio de estado via WebSocket
  const io = getSocket();
  if (io) {
    io.to(`booking:${bookingId}`).emit('booking_status_updated', {
      bookingId,
      status: updatedBooking.status,
      updatedAt: updatedBooking.updatedAt,
    });
  }

  // Notificar via Push Notification al cliente
  try {
    await NotificationService.notifyClientBookingStatus(
      updatedBooking.clientId,
      updatedBooking.status,
      bookingId
    );
  } catch (error) {
    console.error('No se pudo enviar la push notification al cliente:', error);
  }

  return updatedBooking;
}

export async function cancelBooking(bookingId: string, userId: string, role: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  // Verificar autorización (solo cliente o admin)
  if (role !== 'ADMIN' && booking.clientId !== userId) {
    throw new Error('Forbidden');
  }

  // Verificar si se puede cancelar
  if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
    throw new Error('No se puede cancelar esta reserva');
  }

  return updateBookingStatus(bookingId, 'CANCELLED', userId, role);
}

export async function getAvailableSlots(barberId: string, date: Date) {
  return await getSlots(barberId, date);
}
