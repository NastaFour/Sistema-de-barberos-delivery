import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { apiResponse } from '../utils/apiResponse';
import { findNearbyBarbers } from '../services/location.service';

/**
 * Obtener lista de barberos con filtros y geolocalización
 */
export async function getBarbers(req: Request, res: Response) {
  try {
    const { lat, lng, radius, specialty, minRating, page = '1', limit = '20' } = req.query;

    // Si hay coordenadas, usar búsqueda por geolocalización
    if (lat && lng) {
      const barbers = await findNearbyBarbers(
        { lat: parseFloat(lat as string), lng: parseFloat(lng as string) },
        parseFloat(radius as string) || 10,
        parseInt(limit as string) || 20
      );

      // Filtrar por especialidad si se proporciona
      let filteredBarbers = barbers;
      if (specialty) {
        filteredBarbers = barbers.filter((barber: any) =>
          barber.specialty?.some((s: string) =>
            s.toLowerCase().includes((specialty as string).toLowerCase())
          )
        );
      }

      // Filtrar por rating mínimo
      if (minRating) {
        filteredBarbers = filteredBarbers.filter(
          (barber: any) => barber.rating >= parseFloat(minRating as string)
        );
      }

      return apiResponse.success(res, 'Barberos encontrados', filteredBarbers);
    }

    // Búsqueda sin geolocalización
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const barbers = await prisma.barberProfile.findMany({
      where: {
        isActive: true,
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
        services: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
          take: 3,
        },
      },
      orderBy: { rating: 'desc' },
      skip,
      take: parseInt(limit as string),
    });

    const total = await prisma.barberProfile.count({
      where: { isActive: true },
    });

    return apiResponse.successWithPagination(res, 'Barberos encontrados', barbers, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
    });
  } catch (error: any) {
    console.error('Error en getBarbers:', error);
    return apiResponse.error(res, 'Error al obtener barberos', error.message, 500);
  }
}

/**
 * Obtener perfil detallado de un barbero
 */
export async function getBarberById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const barber = await prisma.barberProfile.findUnique({
      where: { userId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        services: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        gallery: {
          orderBy: { order: 'asc' },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!barber) {
      return apiResponse.error(res, 'Barbero no encontrado', '', 404);
    }

    return apiResponse.success(res, 'Perfil del barbero', barber);
  } catch (error: any) {
    console.error('Error en getBarberById:', error);
    return apiResponse.error(res, 'Error al obtener perfil del barbero', error.message, 500);
  }
}

/**
 * Obtener reviews de un barbero
 */
export async function getBarberReviews(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { page = '1', limit = '10' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const reviews = await prisma.review.findMany({
      where: { barberId: id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit as string),
    });

    const total = await prisma.review.count({
      where: { barberId: id },
    });

    return apiResponse.successWithPagination(res, 'Reviews obtenidas', reviews, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
    });
  } catch (error: any) {
    console.error('Error en getBarberReviews:', error);
    return apiResponse.error(res, 'Error al obtener reviews', error.message, 500);
  }
}

/**
 * Crear servicio para un barbero
 */
export async function createService(req: Request, res: Response) {
  try {
    const { id: barberId } = req.params;
    const { name, description, price, duration } = req.body;
    const authRequest = req as any;
    const userId = authRequest.user?.userId;

    // Verificar que el usuario es dueño del perfil
    const barber = await prisma.barberProfile.findUnique({
      where: { userId },
    });

    if (!barber || barber.userId !== userId) {
      return apiResponse.error(res, 'No autorizado', '', 403);
    }

    const service = await prisma.barberService.create({
      data: {
        barberId: barber.id,
        name,
        description,
        price,
        duration,
      },
    });

    return apiResponse.success(res, 'Servicio creado exitosamente', service, 201);
  } catch (error: any) {
    console.error('Error en createService:', error);
    return apiResponse.error(res, 'Error al crear servicio', error.message, 500);
  }
}

/**
 * Actualizar servicio
 */
export async function updateService(req: Request, res: Response) {
  try {
    const { serviceId } = req.params;
    const { name, description, price, duration, isActive } = req.body;
    const authRequest = req as any;
    const userId = authRequest.user?.userId;

    // Verificar propiedad
    const existingService = await prisma.barberService.findUnique({
      where: { id: serviceId },
      include: { barber: true },
    });

    if (!existingService || existingService.barber.userId !== userId) {
      return apiResponse.error(res, 'No autorizado', '', 403);
    }

    const updatedService = await prisma.barberService.update({
      where: { id: serviceId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price !== undefined && { price }),
        ...(duration !== undefined && { duration }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return apiResponse.success(res, 'Servicio actualizado', updatedService);
  } catch (error: any) {
    console.error('Error en updateService:', error);
    return apiResponse.error(res, 'Error al actualizar servicio', error.message, 500);
  }
}

/**
 * Eliminar/desactivar servicio
 */
export async function deleteService(req: Request, res: Response) {
  try {
    const { serviceId } = req.params;
    const authRequest = req as any;
    const userId = authRequest.user?.userId;

    const service = await prisma.barberService.findUnique({
      where: { id: serviceId },
      include: { barber: true },
    });

    if (!service || service.barber.userId !== userId) {
      return apiResponse.error(res, 'No autorizado', '', 403);
    }

    // Desactivar en lugar de eliminar
    await prisma.barberService.update({
      where: { id: serviceId },
      data: { isActive: false },
    });

    return apiResponse.success(res, 'Servicio desactivado');
  } catch (error: any) {
    console.error('Error en deleteService:', error);
    return apiResponse.error(res, 'Error al eliminar servicio', error.message, 500);
  }
}

/**
 * Actualizar perfil del barbero
 */
export async function updateProfile(req: Request, res: Response) {
  try {
    const authRequest = req as any;
    const userId = authRequest.user?.userId;
    const { bio, specialty, yearsExperience, latitude, longitude, availability } = req.body;

    const updatedProfile = await prisma.barberProfile.update({
      where: { userId },
      data: {
        ...(bio && { bio }),
        ...(specialty && { specialty }),
        ...(yearsExperience !== undefined && { yearsExperience }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(availability && { availability }),
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

    return apiResponse.success(res, 'Perfil actualizado', updatedProfile);
  } catch (error: any) {
    console.error('Error en updateProfile:', error);
    return apiResponse.error(res, 'Error al actualizar perfil', error.message, 500);
  }
}

/**
 * Agregar imagen a galería
 */
export async function addToGallery(req: Request, res: Response) {
  try {
    const authRequest = req as any;
    const userId = authRequest.user?.userId;
    const { imageUrl, caption, order } = req.body;

    const barber = await prisma.barberProfile.findUnique({
      where: { userId },
    });

    if (!barber) {
      return apiResponse.error(res, 'Perfil de barbero no encontrado', '', 404);
    }

    // Contar imágenes existentes para determinar el orden
    const count = await prisma.barberGallery.count({
      where: { barberId: barber.id },
    });

    const galleryItem = await prisma.barberGallery.create({
      data: {
        barberId: barber.id,
        imageUrl,
        caption: caption || '',
        order: order !== undefined ? order : count,
      },
    });

    return apiResponse.success(res, 'Imagen agregada a la galería', galleryItem, 201);
  } catch (error: any) {
    console.error('Error en addToGallery:', error);
    return apiResponse.error(res, 'Error al agregar imagen', error.message, 500);
  }
}

/**
 * Eliminar imagen de galería
 */
export async function removeFromGallery(req: Request, res: Response) {
  try {
    const { imageId } = req.params;
    const authRequest = req as any;
    const userId = authRequest.user?.userId;

    const galleryItem = await prisma.barberGallery.findUnique({
      where: { id: imageId },
      include: { barber: true },
    });

    if (!galleryItem || galleryItem.barber.userId !== userId) {
      return apiResponse.error(res, 'No autorizado', '', 403);
    }

    await prisma.barberGallery.delete({
      where: { id: imageId },
    });

    return apiResponse.success(res, 'Imagen eliminada');
  } catch (error: any) {
    console.error('Error en removeFromGallery:', error);
    return apiResponse.error(res, 'Error al eliminar imagen', error.message, 500);
  }
}
