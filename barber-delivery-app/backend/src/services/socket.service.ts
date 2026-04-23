import { Server, Socket } from 'socket.io';
import { prisma } from '../config/db';

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

interface LocationUpdate {
  barberId: string;
  latitude: number;
  longitude: number;
}

/**
 * Configura los eventos de Socket.io para tiempo real
 */
export function setupSocketEvents(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    // Barbero se conecta y une a su room personal
    socket.on('barber:online', async ({ barberId }: { barberId: string }) => {
      socket.join(`barber:${barberId}`);
      await prisma.barberProfile.update({
        where: { userId: barberId },
        data: { isActive: true },
      });
      console.log(`Barbero ${barberId} está en línea`);
    });

    // Barbero se desconecta
    socket.on('barber:offline', async ({ barberId }: { barberId: string }) => {
      socket.leave(`barber:${barberId}`);
      await prisma.barberProfile.update({
        where: { userId: barberId },
        data: { isActive: false },
      });
      console.log(`Barbero ${barberId} está offline`);
    });

    // Cliente solicita un barbero (evento broadcast a barberos cercanos)
    socket.on(
      'booking:request',
      async (data: BookingData & { clientLocation: { lat: number; lng: number } }) => {
        try {
          // Buscar barberos disponibles en la zona
          const nearbyBarbers = await findNearbyAvailableBarbers(
            data.clientLocation.lat,
            data.clientLocation.lng,
            10 // 10km de radio
          );

          // Emitir solicitud a cada barbero cercano
          nearbyBarbers.forEach((barber) => {
            io.to(`barber:${barber.userId}`).emit('booking:new', {
              bookingId: `temp_${Date.now()}`,
              client: {
                id: data.clientId,
                name: 'Cliente', // Se podría obtener de la DB
                address: data.address,
                location: { lat: data.latitude, lng: data.longitude },
              },
              services: data.serviceIds,
              scheduledAt: data.scheduledAt,
              notes: data.notes,
            });
          });

          socket.emit('booking:request_sent', {
            success: true,
            barbersNotified: nearbyBarbers.length,
          });
        } catch (error) {
          socket.emit('booking:error', { message: 'Error al solicitar barbero' });
        }
      }
    );

    // Barbero acepta una solicitud
    socket.on(
      'booking:accept',
      async ({ bookingId, barberId }: { bookingId: string; barberId: string }) => {
        // Notificar al cliente que el barbero aceptó
        socket.emit('booking:accepted', {
          bookingId,
          barberId,
          status: 'CONFIRMED',
          message: 'Tu barbero ha aceptado la solicitud',
        });
      }
    );

    // Barbero actualiza su ubicación en tiempo real
    socket.on('barber:location_update', async (data: LocationUpdate) => {
      // Actualizar ubicación en DB
      await prisma.barberProfile.update({
        where: { userId: data.barberId },
        data: {
          latitude: data.latitude,
          longitude: data.longitude,
        },
      });

      // Broadcast a clientes con reservas activas
      const activeBookings = await prisma.booking.findMany({
        where: {
          barberId: data.barberId,
          status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        },
        select: { clientId: true },
      });

      activeBookings.forEach((booking) => {
        io.to(`client:${booking.clientId}`).emit('barber:location', {
          barberId: data.barberId,
          latitude: data.latitude,
          longitude: data.longitude,
        });
      });
    });

    // Cliente se une a su room personal
    socket.on('client:join', ({ clientId }: { clientId: string }) => {
      socket.join(`client:${clientId}`);
      console.log(`Cliente ${clientId} conectado`);
    });

    // Actualizar estado de reserva
    socket.on(
      'booking:status_update',
      ({ bookingId, status }: { bookingId: string; status: string }) => {
        // Broadcast a todas las partes involucradas
        io.emit(`booking:${bookingId}:status`, { status });
      }
    );

    // Desconexión
    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`);
      // Aquí se podría manejar la lógica de marcar barbero como offline
      // después de un timeout de reconexión
    });

    // Reconexión automática
    socket.on('reconnect', () => {
      console.log(`Cliente reconectado: ${socket.id}`);
    });
  });
}

/**
 * Helper para encontrar barberos disponibles cercanos
 */
async function findNearbyAvailableBarbers(
  lat: number,
  lng: number,
  radiusKm: number
) {
  const { calculateDistance } = await import('./location.service');

  const barbers = await prisma.barberProfile.findMany({
    where: {
      isActive: true,
      latitude: { not: null },
      longitude: { not: null },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  // Filtrar por distancia usando Haversine
  return barbers.filter((barber) => {
    if (!barber.latitude || !barber.longitude) return false;
    const distance = calculateDistance(
      { lat, lng },
      { lat: barber.latitude, lng: barber.longitude }
    );
    return distance <= radiusKm;
  });
}
