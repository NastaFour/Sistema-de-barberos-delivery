import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bookingAPI } from '../lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const BookingDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingAPI.getById(id!),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="min-h-screen bg-dark-950 pt-20 flex items-center justify-center">
        <p className="text-red-500">Reserva no encontrada</p>
      </div>
    );
  }

  const booking = data.data;

  return (
    <div className="min-h-screen bg-dark-950 pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-8">Detalle de Reserva</h1>

        <div className="bg-dark-900 rounded-lg p-8 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Estado</h2>
            <span className={`px-4 py-2 rounded-full font-semibold ${
              booking.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' :
              booking.status === 'CONFIRMED' ? 'bg-blue-500/20 text-blue-500' :
              booking.status === 'IN_PROGRESS' ? 'bg-orange-500/20 text-orange-500' :
              booking.status === 'COMPLETED' ? 'bg-green-500/20 text-green-500' :
              'bg-red-500/20 text-red-500'
            }`}>
              {booking.status}
            </span>
          </div>

          {/* Barber Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Barbero</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center text-gray-400">
                {booking.barber?.name?.charAt(0) || 'B'}
              </div>
              <div>
                <p className="text-white font-semibold">{booking.barber?.name}</p>
                <p className="text-gray-400 text-sm">{booking.barber?.email}</p>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Servicios</h3>
            <div className="space-y-2">
              {(booking.services || []).map((service: any) => (
                <div key={service.id} className="flex justify-between items-center bg-dark-800 rounded-lg p-4">
                  <div>
                    <p className="text-white font-semibold">{service.name}</p>
                    <p className="text-gray-400 text-sm">{service.duration} min</p>
                  </div>
                  <span className="text-primary-500 font-bold">${service.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Fecha y Hora</h3>
            <p className="text-gray-300">
              {format(new Date(booking.scheduledAt), "EEEE d 'de' MMMM 'de' yyyy', ' HH:mm", { locale: es })}
            </p>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Dirección</h3>
            <p className="text-gray-300">{booking.address}</p>
            {booking.notes && (
              <div className="mt-4 bg-dark-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-2">Notas:</p>
                <p className="text-gray-300">{booking.notes}</p>
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Resumen de Pago</h3>
            <div className="space-y-2 bg-dark-800 rounded-lg p-4">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal:</span>
                <span>${booking.subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Comisión (5%):</span>
                <span>${booking.serviceFee}</span>
              </div>
              <div className="border-t border-dark-700 pt-2 mt-2 flex justify-between text-white font-bold text-lg">
                <span>Total:</span>
                <span className="text-primary-500">${booking.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailPage;
