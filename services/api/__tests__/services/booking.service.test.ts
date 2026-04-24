import { createBooking } from '../../src/services/booking.service';
import { isSlotAvailable } from '../../src/services/availability.service';
import prisma from '../../src/config/db';

jest.mock('../../src/services/availability.service');
jest.mock('../../src/config/db', () => ({
  $transaction: jest.fn(),
  barberService: {
    findMany: jest.fn(),
  },
  booking: {
    create: jest.fn(),
  }
}));

describe('Booking Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería lanzar error si la fecha es menor a 2 horas', async () => {
    const data = {
      clientId: 'client-1',
      barberId: 'barber-1',
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
      serviceIds: ['service-1'],
      address: '123 Main St',
      latitude: 0,
      longitude: 0,
    };

    await expect(createBooking(data)).rejects.toThrow('La reserva debe ser al menos 2 horas en el futuro');
  });

  it('debería lanzar error si los servicios no existen', async () => {
    const data = {
      clientId: 'client-1',
      barberId: 'barber-1',
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 3), // 3 hours from now
      serviceIds: ['service-1', 'service-2'],
      address: '123 Main St',
      latitude: 0,
      longitude: 0,
    };

    (prisma.barberService.findMany as jest.Mock).mockResolvedValue([
      { id: 'service-1', duration: 30, price: 15 }
    ]); // Solo devuelve uno, pero se pidieron 2

    await expect(createBooking(data)).rejects.toThrow('Uno o más servicios no existen o no están activos');
  });
});
