import type { Server, Socket } from "socket.io";
import { ZodError } from "zod";
import prisma from "../config/db";
import {
  barberOfflineSchema,
  barberOnlineSchema,
  bookingAcceptSchema,
  bookingRequestSchema,
  bookingStatusUpdateSchema,
  clientJoinSchema,
  locationUpdateSchema,
} from "../schemas/socket.schema";
import { calculateDistance } from "./location.service";

interface BookingData {
  barberId: string;
  clientId: string;
  scheduledAt: Date;
  serviceIds: string[];
  address: string;
  latitude: number;
  longitude: number;
  notes?: string;
}

let ioInstance: Server | null = null;
const activeBarbers = new Map<string, string>();

function validatePayload<T>(
  socket: Socket,
  eventName: string,
  data: unknown,
  schema: { parse: (d: unknown) => T },
): T | null {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      socket.emit("error", {
        event: eventName,
        message: "Payload inválido",
        errors: error.errors,
      });
      return null;
    }
    socket.emit("error", { event: eventName, message: "Error de validación inesperado" });
    return null;
  }
}

export function setupSocketEvents(io: Server) {
  ioInstance = io;
  io.on("connection", (socket: Socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    socket.on("barber:online", async (data: unknown) => {
      const parsed = validatePayload(socket, "barber:online", data, barberOnlineSchema);
      if (!parsed) return;
      const { barberId } = parsed;

      activeBarbers.set(socket.id, barberId);
      socket.join(`barber:${barberId}`);
      await prisma.barberProfile.update({
        where: { userId: barberId },
        data: { isActive: true },
      });
      console.log(`Barbero ${barberId} está en línea`);
    });

    socket.on("barber:offline", async (data: unknown) => {
      const parsed = validatePayload(socket, "barber:offline", data, barberOfflineSchema);
      if (!parsed) return;
      const { barberId } = parsed;

      activeBarbers.delete(socket.id);
      socket.leave(`barber:${barberId}`);
      await prisma.barberProfile.update({
        where: { userId: barberId },
        data: { isActive: false },
      });
      console.log(`Barbero ${barberId} está offline`);
    });

    socket.on("booking:request", async (data: unknown) => {
      const parsed = validatePayload(socket, "booking:request", data, bookingRequestSchema);
      if (!parsed) return;

      try {
        const nearbyBarbers = await findNearbyAvailableBarbers(
          parsed.clientLocation.lat,
          parsed.clientLocation.lng,
          10,
        );

        nearbyBarbers.forEach((barber: { userId: string }) => {
          io.to(`barber:${barber.userId}`).emit("booking:new", {
            bookingId: `temp_${Date.now()}`,
            client: {
              id: parsed.clientId,
              name: "Cliente",
              address: parsed.address,
              location: { lat: parsed.latitude, lng: parsed.longitude },
            },
            services: parsed.serviceIds,
            scheduledAt: parsed.scheduledAt,
            notes: parsed.notes,
          });
        });

        socket.emit("booking:request_sent", {
          success: true,
          barbersNotified: nearbyBarbers.length,
        });
      } catch (error) {
        socket.emit("booking:error", { message: "Error al solicitar barbero" });
      }
    });

    socket.on("booking:accept", (data: unknown) => {
      const parsed = validatePayload(socket, "booking:accept", data, bookingAcceptSchema);
      if (!parsed) return;
      const { bookingId, barberId } = parsed;

      const connectedBarberId = activeBarbers.get(socket.id);
      if (connectedBarberId !== barberId) {
        socket.emit("booking:error", { message: "No autorizado para aceptar esta reserva" });
        return;
      }

      socket.emit("booking:accepted", {
        bookingId,
        barberId,
        status: "CONFIRMED",
        message: "Tu barbero ha aceptado la solicitud",
      });
    });

    socket.on("barber:location_update", async (data: unknown) => {
      const parsed = validatePayload(socket, "barber:location_update", data, locationUpdateSchema);
      if (!parsed) return;
      const { barberId } = parsed;

      await prisma.barberProfile.update({
        where: { userId: barberId },
        data: { latitude: parsed.latitude, longitude: parsed.longitude },
      });

      const activeBookings = await prisma.booking.findMany({
        where: {
          barberId,
          status: { in: ["CONFIRMED", "IN_PROGRESS"] },
        },
        select: { id: true, barberId: true, clientId: true },
      });

      activeBookings.forEach((booking: { id: string; barberId: string; clientId: string }) => {
        io.to(`client:${booking.clientId}`).emit("barber:location", {
          barberId,
          latitude: parsed.latitude,
          longitude: parsed.longitude,
        });
      });
    });

    socket.on("client:join", (data: unknown) => {
      const parsed = validatePayload(socket, "client:join", data, clientJoinSchema);
      if (!parsed) return;
      const { clientId } = parsed;

      socket.join(`client:${clientId}`);
      console.log(`Cliente ${clientId} conectado`);
    });

    socket.on("booking:status_update", (data: unknown) => {
      const parsed = validatePayload(
        socket,
        "booking:status_update",
        data,
        bookingStatusUpdateSchema,
      );
      if (!parsed) return;
      const { bookingId, status } = parsed;

      io.emit(`booking:${bookingId}:status`, { status });
    });

    socket.on("disconnect", async () => {
      console.log(`Cliente desconectado: ${socket.id}`);

      const barberId = activeBarbers.get(socket.id);
      if (barberId) {
        try {
          await prisma.barberProfile.update({
            where: { userId: barberId },
            data: { isActive: false },
          });
          activeBarbers.delete(socket.id);
          console.log(`Barbero ${barberId} marcado offline por desconexión`);
        } catch (error) {
          console.error("Error al marcar barbero offline:", error);
        }
      }
    });

    socket.on("reconnect", () => {
      console.log(`Cliente reconectado: ${socket.id}`);
    });
  });
}

async function findNearbyAvailableBarbers(lat: number, lng: number, radiusKm: number) {
  const barbers = await prisma.barberProfile.findMany({
    where: {
      isActive: true,
      latitude: { not: null },
      longitude: { not: null },
    },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
  });

  return barbers.filter((barber: { latitude: number | null; longitude: number | null }) => {
    if (!barber.latitude || !barber.longitude) return false;
    const distance = calculateDistance(
      { lat, lng },
      { lat: barber.latitude, lng: barber.longitude },
    );
    return distance <= radiusKm;
  });
}

export function getSocket(): Server | null {
  return ioInstance;
}
