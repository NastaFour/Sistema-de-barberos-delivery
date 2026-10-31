import { z } from "zod";

export const barberOnlineSchema = z.object({
  barberId: z.string().min(1),
});

export const barberOfflineSchema = z.object({
  barberId: z.string().min(1),
});

export const bookingRequestSchema = z.object({
  barberId: z.string().min(1),
  clientId: z.string().min(1),
  scheduledAt: z.string().or(z.date()),
  serviceIds: z.array(z.string().min(1)).min(1),
  address: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  notes: z.string().optional(),
  clientLocation: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
});

export const bookingAcceptSchema = z.object({
  bookingId: z.string().min(1),
  barberId: z.string().min(1),
});

export const locationUpdateSchema = z.object({
  barberId: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
});

export const clientJoinSchema = z.object({
  clientId: z.string().min(1),
});

export const bookingStatusUpdateSchema = z.object({
  bookingId: z.string().min(1),
  status: z.string().min(1),
});
