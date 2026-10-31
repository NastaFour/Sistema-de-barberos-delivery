import prisma from "../config/db";

interface Location {
  lat: number;
  lng: number;
}

interface NearbyBarber {
  id: string;
  userId: string;
  bio: string | null;
  specialty: string[] | null;
  yearsExperience: number | null;
  isVerified: boolean;
  isActive: boolean;
  rating: number;
  totalReviews: number;
  latitude: number | null;
  longitude: number | null;
  serviceRadius: number;
  availability: unknown;
  stripeAccountId: string | null;
  stripeAccountStatus: string;
  name: string;
  email: string;
  avatar: string | null;
  distance: number;
  services: unknown[];
}

export function calculateDistance(coord1: Location, coord2: Location): number {
  const R = 6371;
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

export async function findNearbyBarbers(
  clientLocation: Location,
  radiusKm = 10,
  limit = 20,
): Promise<NearbyBarber[]> {
  const { lat, lng } = clientLocation;

  const barbers = (await prisma.$queryRaw`
    SELECT *
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
      WHERE bp."isActive" = true AND bp.latitude IS NOT NULL AND bp.longitude IS NOT NULL
    ) b
    WHERE b.distance <= ${radiusKm}
    ORDER BY b.distance ASC
    LIMIT ${limit}
  `) as NearbyBarber[];

  const barbersWithServices = await Promise.all(
    barbers.map(async (barber) => {
      const services = await prisma.barberService.findMany({
        where: {
          barberId: barber.id,
          isActive: true,
        },
        orderBy: { price: "asc" },
        take: 3,
      });

      return {
        ...barber,
        services,
        distance: Number.parseFloat(barber.distance.toFixed(2)),
      };
    }),
  );

  return barbersWithServices;
}

export function isWithinRadius(
  barberLocation: Location,
  clientLocation: Location,
  radiusKm: number,
): boolean {
  const distance = calculateDistance(barberLocation, clientLocation);
  return distance <= radiusKm;
}
