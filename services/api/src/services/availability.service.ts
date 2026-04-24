import prisma from '../config/db';


interface AvailabilityDay {
  start: string; // "09:00"
  end: string;   // "18:00"
}

interface WeeklyAvailability {
  monday?: AvailabilityDay | null;
  tuesday?: AvailabilityDay | null;
  wednesday?: AvailabilityDay | null;
  thursday?: AvailabilityDay | null;
  friday?: AvailabilityDay | null;
  saturday?: AvailabilityDay | null;
  sunday?: AvailabilityDay | null;
}

const dayMap: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

/**
 * Obtiene los slots disponibles para un barbero en una fecha específica
 */
export async function getAvailableSlots(
  barberId: string,
  date: Date
): Promise<string[]> {
  const dayOfWeek = dayMap[date.getDay()];
  
  // Obtener perfil del barbero con su disponibilidad
  const barberProfile = await prisma.barberProfile.findUnique({
    where: { userId: barberId },
    select: { availability: true },
  });

  if (!barberProfile || !barberProfile.availability) {
    return [];
  }

  const availability = barberProfile.availability as WeeklyAvailability;
  const daySchedule = availability[dayOfWeek as keyof WeeklyAvailability];

  // Si el día no tiene disponibilidad, retornar array vacío
  if (!daySchedule || !daySchedule.start || !daySchedule.end) {
    return [];
  }

  // NO permitir reservas en el pasado
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = daySchedule.start.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    
    if (currentTime >= startTime) {
      // Ajustar el inicio al tiempo actual si ya pasó la hora de inicio
      const adjustedStart = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      daySchedule.start = adjustedStart;
    }
  }

  // Generar slots de 30 minutos
  const slots = generateTimeSlots(daySchedule.start, daySchedule.end, 30);

  // Obtener bookings existentes para esa fecha
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existingBookings = await prisma.booking.findMany({
    where: {
      barberId,
      scheduledAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
      },
    },
    include: {
      services: {
        include: {
          service: true,
        },
      },
    },
  });

  // Calcular duración total de cada booking existente
  const blockedSlots = new Set<string>();
  
  for (const booking of existingBookings) {
    const totalDuration = booking.services.reduce(
      (sum: number, bs: any) => sum + bs.service.duration,
      0
    );
    
    const bookingStart = booking.scheduledAt;
    const bookingEnd = new Date(bookingStart.getTime() + totalDuration * 60000);
    
    // Bloquear slots que coincidan con este booking + buffer de 15 min
    const blockedTimes = getBlockedTimeSlots(bookingStart, bookingEnd, 15);
    blockedTimes.forEach((time) => blockedSlots.add(time));
  }

  // Obtener el servicio más corto del barbero para validar slots mínimos
  const shortestService = await prisma.barberService.findFirst({
    where: {
      barberId,
      isActive: true,
    },
    orderBy: { duration: 'asc' },
    select: { duration: true },
  });

  const minDuration = shortestService?.duration || 30;

  // Filtrar slots disponibles
  const availableSlots = slots.filter((slot) => {
    if (blockedSlots.has(slot)) {
      return false;
    }

    // Verificar si hay tiempo suficiente para al menos el servicio más corto
    const slotTime = timeToMinutes(slot);
    const hasEnoughTime = slots.some((s, index) => {
      const currentIndex = slots.indexOf(slot);
      if (index < currentIndex) return false;
      
      const timeDiff = timeToMinutes(s) - slotTime;
      return timeDiff >= minDuration && !blockedSlots.has(s);
    });

    return hasEnoughTime;
  });

  return availableSlots;
}

/**
 * Genera slots de tiempo entre dos horas con intervalo específico
 */
function generateTimeSlots(start: string, end: string, intervalMinutes: number): string[] {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  const slots: string[] = [];
  
  for (let time = startTime; time < endTime; time += intervalMinutes) {
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    slots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  }
  
  return slots;
}

/**
 * Obtiene todos los slots bloqueados entre dos tiempos con buffer
 */
function getBlockedTimeSlots(start: Date, end: Date, bufferMinutes: number = 15): string[] {
  const blocked: string[] = [];
  
  const startTime = start.getHours() * 60 + start.getMinutes();
  const endTime = end.getHours() * 60 + end.getMinutes() + bufferMinutes;
  
  for (let time = startTime; time < endTime; time += 30) {
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    blocked.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  }
  
  return blocked;
}

/**
 * Convierte tiempo HH:MM a minutos totales
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Verifica si un horario está disponible para una reserva
 */
export async function isSlotAvailable(
  barberId: string,
  scheduledAt: Date,
  serviceIds: string[],
  bufferMinutes: number = 15
): Promise<{ available: boolean; conflictingSlots?: string[] }> {
  const services = await prisma.barberService.findMany({
    where: { id: { in: serviceIds }, barberId, isActive: true },
    select: { duration: true },
  });

  if (services.length !== serviceIds.length) {
    return { available: false };
  }

  const totalDuration = services.reduce((sum: number, s: any) => sum + s.duration, 0);
  const scheduledTime = new Date(scheduledAt);
  const endTime = new Date(scheduledTime.getTime() + totalDuration * 60000);
  const bufferedEnd = new Date(endTime.getTime() + bufferMinutes * 60000);

  // Buscar TODOS los bookings del día y verificar superposición en memoria
  const startOfDay = new Date(scheduledTime);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(scheduledTime);
  endOfDay.setHours(23, 59, 59, 999);

  const existingBookings = await prisma.booking.findMany({
    where: {
      barberId,
      scheduledAt: { gte: startOfDay, lte: endOfDay },
      status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
    },
    include: { services: { include: { service: true } } },
  });

  for (const booking of existingBookings) {
    const bookingDuration = booking.services.reduce((sum: number, bs: any) => sum + bs.service.duration, 0);
    const bookingStart = booking.scheduledAt;
    const bookingEnd = new Date(bookingStart.getTime() + bookingDuration * 60000);
    const bookingBufferedEnd = new Date(bookingEnd.getTime() + bufferMinutes * 60000);

    // Hay superposición si:
    // mi inicio < fin del otro (con buffer) Y mi fin (con buffer) > inicio del otro
    if (scheduledTime < bookingBufferedEnd && bufferedEnd > bookingStart) {
      const availableSlots = await getAvailableSlots(barberId, scheduledTime);
      return { available: false, conflictingSlots: availableSlots.slice(0, 5) };
    }
  }

  return { available: true };
}
