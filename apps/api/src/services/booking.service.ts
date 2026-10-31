import type { Prisma } from "@prisma/client";
import prisma from "../config/db";
import { getAvailableSlots as getSlots, isSlotAvailable } from "./availability.service";
import { NotificationService } from "./notification.service";
import { getSocket } from "./socket.service";

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

  const barber = await prisma.barberProfile.findUnique({ where: { id: barberId } });
  if (!barber || barber.stripeAccountStatus !== "active") {
    throw new Error("Este barbero no está configurado para recibir pagos");
  }

  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  if (scheduledAt < twoHoursFromNow) {
    throw new Error("La reserva debe ser al menos 2 horas en el futuro");
  }

  const services = await prisma.barberService.findMany({
    where: { id: { in: serviceIds }, barberId, isActive: true },
  });

  if (services.length !== serviceIds.length) {
    throw new Error("Uno o más servicios no existen o no están activos");
  }

  const totalDuration = services.reduce(
    (sum: number, s: { duration: number }) => sum + s.duration,
    0,
  );

  const subtotal = services.reduce((sum: number, s: { price: number }) => sum + s.price, 0);
  const serviceFee = subtotal * 0.05;
  const total = subtotal + serviceFee;
  const endTime = new Date(scheduledAt.getTime() + totalDuration * 60000);

  const booking = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const slotCheck = await isSlotAvailable(barberId, scheduledAt, serviceIds, 15, tx);
    if (!slotCheck.available) {
      throw new Error("El barbero no está disponible en ese horario");
    }

    return tx.booking.create({
      data: {
        clientId,
        barberId,
        status: "PENDING_PAYMENT",
        address,
        latitude,
        longitude,
        notes,
        scheduledAt,
        subtotal,
        serviceFee,
        total,
        services: {
          create: services.map((service: { id: string; price: number }) => ({
            serviceId: service.id,
            quantity: 1,
            price: service.price,
          })),
        },
      },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        barber: {
          include: { user: { select: { id: true, name: true, email: true, phone: true } } },
        },
        services: { include: { service: true } },
      },
    });
  });

  const io = getSocket();
  if (io) {
    io.to(`barber:${barberId}`).emit("new_booking", {
      bookingId: booking.id,
      clientName: booking.client.name,
      scheduledAt: booking.scheduledAt,
    });
  }

  try {
    await NotificationService.notifyBarberNewBooking(
      booking.barber.userId,
      booking.client.name,
      booking.scheduledAt,
      booking.id,
    );
  } catch (error) {
    console.error("No se pudo enviar la push notification:", error);
  }

  return booking;
}

export async function getMyBookings(data: GetMyBookingsDTO) {
  const { userId, role, status, page, limit } = data;

  const whereClause: Record<string, unknown> = {};

  if (role === "CLIENT") {
    whereClause.clientId = userId;
  } else if (role === "BARBER") {
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

  return prisma.booking.findMany({
    where: whereClause,
    include: {
      client: { select: { id: true, name: true, phone: true, avatar: true } },
      barber: {
        include: { user: { select: { id: true, name: true, phone: true, avatar: true } } },
      },
      services: { include: { service: true } },
      review: true,
    },
    orderBy: { scheduledAt: "desc" },
    skip,
    take: limit,
  });
}

export async function getBookingById(bookingId: string, userId: string, role: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      client: { select: { id: true, name: true, phone: true, email: true, avatar: true } },
      barber: {
        include: {
          user: { select: { id: true, name: true, phone: true, email: true, avatar: true } },
        },
      },
      services: { include: { service: true } },
      review: true,
    },
  });

  if (!booking) return null;

  if (role !== "ADMIN" && booking.clientId !== userId && booking.barber.userId !== userId) {
    throw new Error("Forbidden");
  }

  return booking;
}

const validTransitions: Record<string, string[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export async function updateBookingStatus(
  bookingId: string,
  newStatus: string,
  userId: string,
  role: string,
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { barber: true, client: true },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  const canUpdate =
    role === "ADMIN" ||
    (role === "BARBER" && booking.barber.userId === userId) ||
    (role === "CLIENT" && booking.clientId === userId);

  if (!canUpdate) {
    throw new Error("Forbidden");
  }

  const allowed = validTransitions[booking.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Transición inválida de ${booking.status} a ${newStatus}`);
  }

  if (role === "CLIENT" && newStatus === "CANCELLED") {
    const fourHoursFromNow = new Date(booking.scheduledAt.getTime() - 4 * 60 * 60 * 1000);
    if (new Date() > fourHoursFromNow) {
      throw new Error("Solo se puede cancelar hasta 4 horas antes de la cita");
    }
  }

  const updateData: Record<string, string | Date | null> = { status: newStatus };

  if (newStatus === "IN_PROGRESS") {
    updateData.startedAt = new Date();
  } else if (newStatus === "COMPLETED") {
    updateData.completedAt = new Date();
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: updateData,
    include: {
      client: { select: { id: true, name: true, email: true } },
      barber: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      services: { include: { service: true } },
    },
  });

  const io = getSocket();
  if (io) {
    io.to(`booking:${bookingId}`).emit("booking_status_updated", {
      bookingId,
      status: updatedBooking.status,
      updatedAt: updatedBooking.updatedAt,
    });
  }

  try {
    await NotificationService.notifyClientBookingStatus(
      updatedBooking.clientId,
      updatedBooking.status,
      bookingId,
    );
  } catch (error) {
    console.error("No se pudo enviar la push notification al cliente:", error);
  }

  return updatedBooking;
}

export async function cancelBooking(bookingId: string, userId: string, role: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (role !== "ADMIN" && booking.clientId !== userId) {
    throw new Error("Forbidden");
  }

  if (["COMPLETED", "CANCELLED"].includes(booking.status)) {
    throw new Error("No se puede cancelar esta reserva");
  }

  return updateBookingStatus(bookingId, "CANCELLED", userId, role);
}

export async function getAvailableSlots(barberId: string, date: Date) {
  return getSlots(barberId, date);
}
