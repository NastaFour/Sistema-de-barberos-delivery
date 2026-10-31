import type { Request, Response } from "express";
import prisma from "../config/db";
import { findNearbyBarbers } from "../services/location.service";
import type { AuthRequest } from "../types";
import { apiResponse } from "../utils/apiResponse";

export async function getBarbers(req: Request, res: Response) {
  try {
    const { lat, lng, radius, specialty, minRating, page = "1", limit = "20" } = req.query;

    if (lat && lng) {
      const barbers = await findNearbyBarbers(
        { lat: Number.parseFloat(lat as string), lng: Number.parseFloat(lng as string) },
        Number.parseFloat(radius as string) || 10,
        Number.parseInt(limit as string) || 20,
      );

      let filteredBarbers = barbers;
      if (specialty) {
        filteredBarbers = barbers.filter((barber) =>
          barber.specialty?.some((s: string) =>
            s.toLowerCase().includes((specialty as string).toLowerCase()),
          ),
        );
      }

      if (minRating) {
        filteredBarbers = filteredBarbers.filter(
          (barber) => barber.rating >= Number.parseFloat(minRating as string),
        );
      }

      return apiResponse.success(res, "Barberos encontrados", filteredBarbers);
    }

    const skip = (Number.parseInt(page as string) - 1) * Number.parseInt(limit as string);

    const barbers = await prisma.barberProfile.findMany({
      where: { isActive: true },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        services: { where: { isActive: true }, orderBy: { price: "asc" }, take: 3 },
      },
      orderBy: { rating: "desc" },
      skip,
      take: Number.parseInt(limit as string),
    });

    const total = await prisma.barberProfile.count({ where: { isActive: true } });

    return apiResponse.successWithPagination(res, "Barberos encontrados", barbers, {
      page: Number.parseInt(page as string),
      limit: Number.parseInt(limit as string),
      total,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error en getBarbers:", error);
    return apiResponse.error(res, "Error al obtener barberos", message, 500);
  }
}

export async function getBarberById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const barber = await prisma.barberProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        services: { where: { isActive: true }, orderBy: { name: "asc" } },
        gallery: { orderBy: { order: "asc" } },
      },
    });

    if (!barber) {
      return apiResponse.error(res, "Barbero no encontrado", "", 404);
    }

    const reviews = await prisma.review.findMany({
      where: { barberId: barber.userId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { client: { select: { id: true, name: true, avatar: true } } },
    });

    return apiResponse.success(res, "Perfil del barbero", { ...barber, reviews });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error en getBarberById:", error);
    return apiResponse.error(res, "Error al obtener perfil del barbero", message, 500);
  }
}

export async function getBarberReviews(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { page = "1", limit = "10" } = req.query;

    const skip = (Number.parseInt(page as string) - 1) * Number.parseInt(limit as string);

    const reviews = await prisma.review.findMany({
      where: { barberId: id },
      include: { client: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number.parseInt(limit as string),
    });

    const total = await prisma.review.count({ where: { barberId: id } });

    return apiResponse.successWithPagination(res, "Reviews obtenidas", reviews, {
      page: Number.parseInt(page as string),
      limit: Number.parseInt(limit as string),
      total,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error en getBarberReviews:", error);
    return apiResponse.error(res, "Error al obtener reviews", message, 500);
  }
}

export async function createService(req: AuthRequest, res: Response) {
  try {
    const { id: barberId } = req.params;
    const { name, description, price, duration } = req.body;
    const userId = req.user?.userId;

    const barber = await prisma.barberProfile.findUnique({ where: { userId } });

    if (!barber || barber.userId !== userId) {
      return apiResponse.error(res, "No autorizado", "", 403);
    }

    const service = await prisma.barberService.create({
      data: { barberId: barber.id, name, description, price, duration },
    });

    return apiResponse.success(res, "Servicio creado exitosamente", service, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error en createService:", error);
    return apiResponse.error(res, "Error al crear servicio", message, 500);
  }
}

export async function updateService(req: AuthRequest, res: Response) {
  try {
    const { serviceId } = req.params;
    const { name, description, price, duration, isActive } = req.body;
    const userId = req.user?.userId;

    const existingService = await prisma.barberService.findUnique({
      where: { id: serviceId },
      include: { barber: true },
    });

    if (!existingService || existingService.barber.userId !== userId) {
      return apiResponse.error(res, "No autorizado", "", 403);
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

    return apiResponse.success(res, "Servicio actualizado", updatedService);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error en updateService:", error);
    return apiResponse.error(res, "Error al actualizar servicio", message, 500);
  }
}

export async function deleteService(req: AuthRequest, res: Response) {
  try {
    const { serviceId } = req.params;
    const userId = req.user?.userId;

    const service = await prisma.barberService.findUnique({
      where: { id: serviceId },
      include: { barber: true },
    });

    if (!service || service.barber.userId !== userId) {
      return apiResponse.error(res, "No autorizado", "", 403);
    }

    await prisma.barberService.update({
      where: { id: serviceId },
      data: { isActive: false },
    });

    return apiResponse.success(res, "Servicio desactivado");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error en deleteService:", error);
    return apiResponse.error(res, "Error al eliminar servicio", message, 500);
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
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
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    return apiResponse.success(res, "Perfil actualizado", updatedProfile);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error en updateProfile:", error);
    return apiResponse.error(res, "Error al actualizar perfil", message, 500);
  }
}

export async function addToGallery(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { imageUrl, caption, order } = req.body;

    const barber = await prisma.barberProfile.findUnique({ where: { userId } });

    if (!barber) {
      return apiResponse.error(res, "Perfil de barbero no encontrado", "", 404);
    }

    const count = await prisma.barberGallery.count({ where: { barberId: barber.id } });

    const galleryItem = await prisma.barberGallery.create({
      data: {
        barberId: barber.id,
        imageUrl,
        caption: caption || "",
        order: order !== undefined ? order : count,
      },
    });

    return apiResponse.success(res, "Imagen agregada a la galería", galleryItem, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error en addToGallery:", error);
    return apiResponse.error(res, "Error al agregar imagen", message, 500);
  }
}

export async function updateStatus(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return apiResponse.error(res, "isActive debe ser un booleano", "", 400);
    }

    const barber = await prisma.barberProfile.findUnique({ where: { userId } });

    if (!barber) {
      return apiResponse.error(res, "Perfil de barbero no encontrado", "", 404);
    }

    const updated = await prisma.barberProfile.update({
      where: { userId },
      data: { isActive },
    });

    return apiResponse.success(res, "Estado actualizado", updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error en updateStatus:", error);
    return apiResponse.error(res, "Error al actualizar estado", message, 500);
  }
}

export async function removeFromGallery(req: AuthRequest, res: Response) {
  try {
    const { imageId } = req.params;
    const userId = req.user?.userId;

    const galleryItem = await prisma.barberGallery.findUnique({
      where: { id: imageId },
      include: { barber: true },
    });

    if (!galleryItem || galleryItem.barber.userId !== userId) {
      return apiResponse.error(res, "No autorizado", "", 403);
    }

    await prisma.barberGallery.delete({ where: { id: imageId } });

    return apiResponse.success(res, "Imagen eliminada");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error en removeFromGallery:", error);
    return apiResponse.error(res, "Error al eliminar imagen", message, 500);
  }
}
