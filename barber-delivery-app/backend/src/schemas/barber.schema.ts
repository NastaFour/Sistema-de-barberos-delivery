import { z } from 'zod';

export const getBarbersSchema = z.object({
  query: z.object({
    lat: z.string().optional(),
    lng: z.string().optional(),
    radius: z.string().optional().default('10'),
    specialty: z.string().optional(),
    minRating: z.string().optional(),
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('20'),
  }),
});

export const getBarberByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const createServiceSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().optional(),
    price: z.number().positive(),
    duration: z.number().int().positive().multipleOf(15, 'La duración debe ser múltiplo de 15 minutos'),
  }),
});

export const updateServiceSchema = z.object({
  params: z.object({
    serviceId: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    duration: z.number().int().positive().multipleOf(15).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    bio: z.string().max(500).optional(),
    specialties: z.array(z.string()).optional(),
    yearsExperience: z.number().int().positive().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    availability: z.record(
      z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
      z.object({
        start: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido. Use HH:MM'),
        end: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido. Use HH:MM'),
      }).nullable()
    ).optional(),
  }),
});

export const addToGallerySchema = z.object({
  body: z.object({
    imageUrl: z.string().url(),
    caption: z.string().optional(),
    order: z.number().int().nonnegative().optional(),
  }),
});
