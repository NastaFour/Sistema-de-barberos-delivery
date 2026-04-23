import prisma from '../config/db';

interface Location {
  lat: number;
  lng: number;
}

/**
 * Calcula la distancia entre dos puntos usando la fórmula Haversine
 * Retorna distancia en kilómetros
 */
export function calculateDistance(coord1: Location, coord2: Location): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Encuentra barberos cercanos dentro de un radio específico
 * Usa consulta SQL optimizada con fórmula Haversine
 */
export async function findNearbyBarbers(
  clientLocation: Location,
  radiusKm: number = 10,
  limit: number = 20
) {
  const { lat, lng } = clientLocation;

  // Query optimizado usando SQL crudo con Haversine
  const barbers = await prisma.$queryRaw`
    SELECT 
      b.id,
      b."userId",
      b.bio,
      b.specialty,
      b.latitude,
      b.longitude,
      b."rating",
      b."totalReviews",
      b."yearsExperience",
      u.name,
      u.email,
      u.avatar,
      distance
    FROM (
      SELECT 
        bp.*,
        u.name,
        u.email,
        u.avatar,
        (
          6371 * acos(
            cos(radians(${lat})) * 
            cos(radians(bp.latitude)) * 
            cos(radians(bp.longitude) - radians(${lng})) + 
            sin(radians(${lat})) * 
            sin(radians(bp.latitude))
          )
        ) AS distance
      FROM "BarberProfile" bp
      INNER JOIN "User" u ON bp."userId" = u.id
      WHERE bp."isActive" = true
      HAVING distance <= ${radiusKm}
    ) b
    ORDER BY distance ASC
    LIMIT ${limit}
  `;

  // Obtener servicios activos para cada barbero
  const barbersWithServices = await Promise.all(
    (barbers as any[]).map(async (barber) => {
      const services = await prisma.barberService.findMany({
        where: {
          barberId: barber.id,
          isActive: true,
        },
        orderBy: { price: 'asc' },
        take: 3,
      });

      return {
        ...barber,
        services,
        distance: parseFloat(barber.distance.toFixed(2)),
      };
    })
  );

  return barbersWithServices;
}

/**
 * Verifica si un barbero está dentro del radio especificado
 */
export function isWithinRadius(
  barberLocation: Location,
  clientLocation: Location,
  radiusKm: number
): boolean {
  const distance = calculateDistance(barberLocation, clientLocation);
  return distance <= radiusKm;
}
