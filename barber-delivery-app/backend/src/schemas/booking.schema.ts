import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    barberId: z.string().uuid('Barber ID inválido'),
    scheduledAt: z.string().datetime('Fecha y hora inválidas'),
    serviceIds: z.array(z.string().uuid()).min(1, 'Debe seleccionar al menos un servicio'),
    address: z.string().min(5, 'Dirección muy corta'),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    notes: z.string().max(500).optional(),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  }),
  params: z.object({
    id: z.string().uuid('ID de reserva inválido'),
  }),
});

export const bookingIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de reserva inválido'),
  }),
});

export const getSlotsSchema = z.object({
  query: z.object({
    barberId: z.string().uuid('Barber ID inválido'),
    date: z.string().datetime('Fecha inválida'),
  }),
});
