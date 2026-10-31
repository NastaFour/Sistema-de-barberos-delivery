import prisma from "../../src/config/db";
import { getAvailableSlots, isSlotAvailable } from "../../src/services/availability.service";

jest.mock("../../src/config/db", () => ({
  barberProfile: {
    findUnique: jest.fn(),
  },
  booking: {
    findMany: jest.fn(),
  },
  barberService: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
}));

const dayMap: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

function futureDate(daysFromNow = 1): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(10, 0, 0, 0);
  return d;
}

function minutesToMs(minutes: number): number {
  return minutes * 60000;
}

function makeWeeklyAvailability(day: Date, start: string, end: string) {
  const dayName = dayMap[day.getDay()];
  const availability: Record<string, { start: string; end: string }> = {};
  availability[dayName] = { start, end };
  return availability;
}

describe("Availability Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAvailableSlots", () => {
    it("retorna array vacio si el perfil del barbero no existe", async () => {
      (prisma.barberProfile.findUnique as jest.Mock).mockResolvedValue(null);

      const slots = await getAvailableSlots("barber-1", futureDate());
      expect(slots).toEqual([]);
    });

    it("retorna array vacio si availability es null", async () => {
      (prisma.barberProfile.findUnique as jest.Mock).mockResolvedValue({
        availability: null,
      });

      const slots = await getAvailableSlots("barber-1", futureDate());
      expect(slots).toEqual([]);
    });

    it("retorna array vacio si el dia no tiene horario definido", async () => {
      const sunday = new Date(2026, 5, 21); // domingo
      const saturdayAvail = makeWeeklyAvailability(new Date(2026, 5, 20), "09:00", "18:00");
      (prisma.barberProfile.findUnique as jest.Mock).mockResolvedValue({
        availability: saturdayAvail,
      });

      const slots = await getAvailableSlots("barber-1", sunday);
      expect(slots).toEqual([]);
    });

    it("retorna array vacio si el horario del dia no tiene start o end", async () => {
      const date = futureDate(2);
      const avail = makeWeeklyAvailability(date, "", "18:00");
      (prisma.barberProfile.findUnique as jest.Mock).mockResolvedValue({
        availability: avail,
      });

      const slots = await getAvailableSlots("barber-1", date);
      expect(slots).toEqual([]);
    });

    it("genera slots y filtra el ultimo por minDuration", async () => {
      const date = futureDate(2);
      date.setHours(10, 0, 0, 0);
      const avail = makeWeeklyAvailability(date, "09:00", "10:00");

      (prisma.barberProfile.findUnique as jest.Mock).mockResolvedValue({
        availability: avail,
      });
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.barberService.findFirst as jest.Mock).mockResolvedValue({
        duration: 30,
      });

      const slots = await getAvailableSlots("barber-1", date);

      expect(slots).toEqual(["09:00"]);
    });

    it("retorna ambos slots si minDuration <= intervalo y sobra espacio al final", async () => {
      const date = futureDate(2);
      const avail = makeWeeklyAvailability(date, "09:00", "10:30");

      (prisma.barberProfile.findUnique as jest.Mock).mockResolvedValue({
        availability: avail,
      });
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.barberService.findFirst as jest.Mock).mockResolvedValue({
        duration: 30,
      });

      const slots = await getAvailableSlots("barber-1", date);

      // 09:00, 09:30, 10:00 -> 09:00 tiene 09:30 adelante (30min ok), 09:30 tiene 10:00 adelante (30min ok), 10:00 no tiene siguiente
      expect(slots).toEqual(["09:00", "09:30"]);
    });

    it("bloquea slots que se superponen con bookings existentes + buffer 15min", async () => {
      const date = futureDate(2);
      date.setHours(9, 0, 0, 0);
      const avail = makeWeeklyAvailability(date, "09:00", "11:00");

      (prisma.barberProfile.findUnique as jest.Mock).mockResolvedValue({
        availability: avail,
      });
      (prisma.barberService.findFirst as jest.Mock).mockResolvedValue({
        duration: 30,
      });

      const bookingDate = new Date(date);
      bookingDate.setHours(9, 0, 0, 0);

      (prisma.booking.findMany as jest.Mock).mockResolvedValue([
        {
          scheduledAt: bookingDate,
          services: [{ service: { duration: 30 } }],
        },
      ]);

      const slots = await getAvailableSlots("barber-1", date);

      // slots: ["09:00","09:30","10:00","10:30"]
      // bloqueados: 09:00, 09:30 (booking 09:00-09:30 + buffer 15min)
      // disponibles: 10:00, 10:30 -> minDuration 30 -> 10:30 no tiene slot futuro -> filtrado
      expect(slots).toEqual(["10:00"]);
    });

    it("filtra slots que no tienen suficiente tiempo para el servicio mas corto", async () => {
      const date = futureDate(2);
      const avail = makeWeeklyAvailability(date, "09:00", "09:45");

      (prisma.barberProfile.findUnique as jest.Mock).mockResolvedValue({
        availability: avail,
      });
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.barberService.findFirst as jest.Mock).mockResolvedValue({
        duration: 60,
      });

      const slots = await getAvailableSlots("barber-1", date);

      // 09:00, 09:30 -> minDuration 60 -> ninguno tiene 60min de espacio entre slots
      expect(slots).toEqual([]);
    });

    it("usa 30 como minDuration por defecto si no hay servicios activos", async () => {
      const date = futureDate(2);
      const avail = makeWeeklyAvailability(date, "09:00", "10:00");

      (prisma.barberProfile.findUnique as jest.Mock).mockResolvedValue({
        availability: avail,
      });
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.barberService.findFirst as jest.Mock).mockResolvedValue(null);

      const slots = await getAvailableSlots("barber-1", date);

      expect(slots).toEqual(["09:00"]);
    });

    it("genera todos los slots disponibles para un dia sin bookings", async () => {
      const date = futureDate(2);
      const avail = makeWeeklyAvailability(date, "08:00", "12:00");

      (prisma.barberProfile.findUnique as jest.Mock).mockResolvedValue({
        availability: avail,
      });
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.barberService.findFirst as jest.Mock).mockResolvedValue({
        duration: 30,
      });

      const slots = await getAvailableSlots("barber-1", date);

      // 08:00 a 12:00 = 8 slots, menos el ultimo por minDuration = 7
      expect(slots).toHaveLength(7);
      expect(slots[0]).toBe("08:00");
      expect(slots[slots.length - 1]).toBe("11:00");
    });
  });

  describe("isSlotAvailable", () => {
    const barberId = "barber-1";
    const serviceIds = ["svc-1"];

    it("retorna available:false si algun servicio no existe", async () => {
      (prisma.barberService.findMany as jest.Mock).mockResolvedValue([
        { id: "svc-1", duration: 30 },
      ]);

      const result = await isSlotAvailable(barberId, futureDate(), ["svc-1", "svc-2"]);

      expect(result.available).toBe(false);
      expect(result.conflictingSlots).toBeUndefined();
    });

    it("retorna available:true si no hay conflictos", async () => {
      (prisma.barberService.findMany as jest.Mock).mockResolvedValue([{ duration: 30 }]);
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);

      const result = await isSlotAvailable(barberId, futureDate(), serviceIds);

      expect(result.available).toBe(true);
    });

    it("retorna available:false si hay superposicion + conflictingSlots (max 5)", async () => {
      (prisma.barberService.findMany as jest.Mock).mockResolvedValue([{ duration: 30 }]);

      const slotDate = futureDate(2);
      slotDate.setHours(10, 0, 0, 0);

      (prisma.booking.findMany as jest.Mock).mockResolvedValue([
        {
          scheduledAt: new Date(slotDate.getTime() - minutesToMs(15)),
          services: [{ service: { duration: 30 } }],
        },
      ]);

      const avail = makeWeeklyAvailability(slotDate, "09:00", "18:00");
      (prisma.barberProfile.findUnique as jest.Mock).mockResolvedValue({
        availability: avail,
      });
      (prisma.barberService.findFirst as jest.Mock).mockResolvedValue({
        duration: 30,
      });

      const result = await isSlotAvailable(barberId, slotDate, serviceIds);

      expect(result.available).toBe(false);
      expect(result.conflictingSlots).toBeDefined();
      expect(result.conflictingSlots!.length).toBeGreaterThan(0);
      expect(result.conflictingSlots!.length).toBeLessThanOrEqual(5);
    });

    it("retorna available:true cuando hay bookings en el dia pero sin superposicion", async () => {
      (prisma.barberService.findMany as jest.Mock).mockResolvedValue([{ duration: 30 }]);

      const slotDate = futureDate(2);
      slotDate.setHours(12, 0, 0, 0);

      (prisma.booking.findMany as jest.Mock).mockResolvedValue([
        {
          scheduledAt: new Date(slotDate.getTime() - minutesToMs(120)),
          services: [{ service: { duration: 30 } }],
        },
      ]);

      const result = await isSlotAvailable(barberId, slotDate, serviceIds);

      expect(result.available).toBe(true);
      expect(result.conflictingSlots).toBeUndefined();
    });

    it("respeta bufferMinutes personalizado", async () => {
      (prisma.barberService.findMany as jest.Mock).mockResolvedValue([{ duration: 30 }]);

      const slotDate = futureDate(2);
      slotDate.setHours(10, 0, 0, 0);

      (prisma.booking.findMany as jest.Mock).mockResolvedValue([
        {
          scheduledAt: new Date(slotDate.getTime() - minutesToMs(35)),
          services: [{ service: { duration: 30 } }],
        },
      ]);

      const result = await isSlotAvailable(barberId, slotDate, serviceIds, 5);

      expect(result.available).toBe(true);
    });
  });
});
