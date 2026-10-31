import { z } from "zod";

export const userRoleSchema = z.enum(["CLIENT", "BARBER", "ADMIN"]);

export const bookingStatusSchema = z.enum([
  "PENDING_PAYMENT",
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);

export const geocodingSuggestionSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  placeName: z.string(),
});

export const barberServiceSchema = z.object({
  id: z.string(),
  barberId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  duration: z.number(),
  isActive: z.boolean(),
});

export const bookingServiceSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  serviceId: z.string(),
  quantity: z.number().default(1),
  price: z.number(),
  service: barberServiceSchema,
});

export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
    pagination: z
      .object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
      })
      .optional(),
  });
