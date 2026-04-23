import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingAPI } from '../lib/api';
import { Booking } from '../lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

const MyBookingsPage = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => bookingAPI.getMyBookings(),
  });

  const cancelBookingMutation = useMutation({
    mutationFn: (id: string) => bookingAPI.updateStatus(id, 'CANCELLED'),
    onSuccess: () => {
      toast.success('Reserva cancelada');
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al cancelar la reserva');
    },
  });

  const bookings = (data?.data || []) as Booking[];

  const filteredBookings = bookings.filter((booking) => {
    const bookingDate = new Date(booking.scheduledAt);
    const now = new Date();
    
    if (activeTab === 'upcoming') {
      return booking.status === 'PENDING' || booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS';
    }
    if (activeTab === 'past') {
      return booking.status === 'COMPLETED';
    }
    if (activeTab === 'cancelled') {
      return booking.status === 'CANCELLED' || booking.status === 'NO_SHOW';
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-500';
      case 'CONFIRMED': return 'bg-blue-500/20 text-blue-500';
      case 'IN_PROGRESS': return 'bg-orange-500/20 text-orange-500';
      case 'COMPLETED': return 'bg-green-500/20 text-green-500';
      case 'CANCELLED': return 'bg-red-500/20 text-red-500';
      case 'NO_SHOW': return 'bg-gray-500/20 text-gray-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const handleCancel = (bookingId: string) => {
    if (window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
      cancelBookingMutation.mutate(bookingId);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-white mb-8">Mis Reservas</h1>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-dark-700 mb-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'upcoming'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Próximas
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'past'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Pasadas
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'cancelled'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Canceladas
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-dark-900 rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-dark-800 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-dark-800 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-dark-800 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        )}

        {/* Bookings List */}
        {!isLoading && (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-dark-900 rounded-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center text-gray-400">
                      {booking.barber?.name?.charAt(0) || 'B'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{booking.barber?.name || 'Barbero'}</h3>
                      <p className="text-gray-400 text-sm">
                        {format(new Date(booking.scheduledAt), "EEEE d 'de' MMMM', ' HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
                    {booking.status === 'PENDING' && 'Pendiente'}
                    {booking.status === 'CONFIRMED' && 'Confirmada'}
                    {booking.status === 'IN_PROGRESS' && 'En progreso'}
                    {booking.status === 'COMPLETED' && 'Completada'}
                    {booking.status === 'CANCELLED' && 'Cancelada'}
                    {booking.status === 'NO_SHOW' && 'No se presentó'}
                  </span>
                </div>

                {/* Services */}
                <div className="mb-4">
                  <h4 className="text-gray-400 text-sm mb-2">Servicios:</h4>
                  <div className="flex flex-wrap gap-2">
                    {(booking.services || []).map((service: any) => (
                      <span key={service.id} className="bg-dark-800 text-gray-300 px-3 py-1 rounded-full text-sm">
                        {service.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Address & Total */}
                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate max-w-xs">{booking.address}</span>
                  </div>
                  <span className="text-primary-500 font-bold text-lg">${booking.total}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  {booking.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancelBookingMutation.isPending}
                      className="bg-red-500/20 text-red-500 hover:bg-red-500/30 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancelar reserva
                    </button>
                  )}
                  {booking.status === 'COMPLETED' && !booking.review && (
                    <button className="bg-primary-500/20 text-primary-500 hover:bg-primary-500/30 px-4 py-2 rounded-lg transition-colors">
                      Dejar reseña
                    </button>
                  )}
                  <button className="bg-dark-800 text-gray-300 hover:bg-dark-700 px-4 py-2 rounded-lg transition-colors">
                    Ver detalles
                  </button>
                </div>
              </div>
            ))}

            {filteredBookings.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-20 h-20 mx-auto text-gray-600 mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-400">
                  {activeTab === 'upcoming' && 'No tienes reservas próximas'}
                  {activeTab === 'past' && 'No tienes reservas pasadas'}
                  {activeTab === 'cancelled' && 'No tienes reservas canceladas'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;
