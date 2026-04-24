import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useBarberBookings, useUpdateBookingStatus } from '../hooks/useBarberBookings';
import { useBarberProfile, useUpdateBarberStatus } from '../hooks/useBarberServices';
import { BookingActionModal } from '../components/barber/BookingActionModal';
import { EarningsChart } from '../components/barber/EarningsChart';
import { isSameDay, format, subDays, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, DollarSign, Star, Bell, Clock } from 'lucide-react';
import { Booking } from '../lib/types';
import { StripeConnectBanner } from '../components/StripeConnectBanner';

export default function BarberDashboardPage() {
  const { user } = useAuthStore();
  const barberId = user?.id || '';

  // Hooks
  const { data: profileResponse, isLoading: isLoadingProfile } = useBarberProfile(barberId);
  const { data: bookingsResponse, isLoading: isLoadingBookings } = useBarberBookings();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateBookingStatus();
  const { mutate: updateBarberStatus, isPending: isUpdatingProfile } = useUpdateBarberStatus();

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Data processing
  const profile = profileResponse?.data;
  const bookings: Booking[] = bookingsResponse?.data || [];

  const todayBookings = useMemo(() => {
    return bookings.filter(b => isSameDay(new Date(b.scheduledAt), new Date()));
  }, [bookings]);

  const weeklyEarnings = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    return bookings
      .filter(b => b.status === 'COMPLETED' && isAfter(new Date(b.scheduledAt), sevenDaysAgo))
      .reduce((sum, b) => sum + (b.services?.reduce((s, bs) => s + bs.price, 0) || 0), 0);
  }, [bookings]);

  const nextBooking = useMemo(() => {
    return bookings
      .filter(b => (b.status === 'PENDING' || b.status === 'CONFIRMED') && isAfter(new Date(b.scheduledAt), new Date()))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];
  }, [bookings]);

  const handleOpenModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = (bookingId: string, status: string) => {
    updateStatus({ id: bookingId, status }, {
      onSuccess: () => setIsModalOpen(false)
    });
  };

  const toggleAvailability = () => {
    if (profile) {
      updateBarberStatus({ barberId, isActive: !profile.isActive });
    }
  };

  if (isLoadingProfile || isLoadingBookings) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Hola, {user?.name}</h1>
          <p className="text-gray-400 mt-1">Aquí tienes el resumen de tu barbería hoy.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 bg-dark-800 rounded-full text-gray-400 hover:text-white relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="flex items-center gap-2 bg-dark-800 p-1 pl-4 rounded-full">
            <span className="text-sm font-medium text-gray-300">Disponible</span>
            <label className="relative inline-flex items-center cursor-pointer ml-2">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={profile?.isActive ?? false}
                onChange={toggleAvailability}
                disabled={isUpdatingProfile}
              />
              <div className="w-11 h-6 bg-dark-700 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Stripe Connect Onboarding Banner */}
      <StripeConnectBanner />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-900 border border-dark-800 p-5 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm font-medium">Reservas Hoy</p>
              <h3 className="text-2xl font-bold text-white mt-1">{todayBookings.length}</h3>
            </div>
            <div className="p-2 bg-primary/20 text-primary rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-dark-900 border border-dark-800 p-5 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm font-medium">Ingresos (7 días)</p>
              <h3 className="text-2xl font-bold text-green-400 mt-1">${weeklyEarnings.toFixed(2)}</h3>
            </div>
            <div className="p-2 bg-green-500/20 text-green-500 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-dark-900 border border-dark-800 p-5 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm font-medium">Rating Promedio</p>
              <h3 className="text-2xl font-bold text-yellow-400 mt-1">{profile?.rating?.toFixed(1) || '0.0'}</h3>
            </div>
            <div className="p-2 bg-yellow-500/20 text-yellow-500 rounded-lg">
              <Star className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-dark-900 border border-dark-800 p-5 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm font-medium">Próxima Cita</p>
              <h3 className="text-sm font-bold text-white mt-1 truncate">
                {nextBooking ? format(new Date(nextBooking.scheduledAt), 'HH:mm - d MMM', { locale: es }) : 'Ninguna'}
              </h3>
            </div>
            <div className="p-2 bg-orange-500/20 text-orange-500 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Próximas reservas */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-white">Próximas Reservas</h2>
          {bookings
            .filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS')
            .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
            .slice(0, 5)
            .map(booking => {
              const statusColors = {
                PENDING: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
                CONFIRMED: 'bg-blue-500/20 text-blue-500 border-blue-500/50',
                IN_PROGRESS: 'bg-orange-500/20 text-orange-500 border-orange-500/50',
                COMPLETED: 'bg-green-500/20 text-green-500 border-green-500/50',
                CANCELLED: 'bg-red-500/20 text-red-500 border-red-500/50',
              };
              
              return (
                <div key={booking.id} className="bg-dark-900 border border-dark-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-white">{booking.client?.name}</p>
                    <p className="text-sm text-gray-400 capitalize">{format(new Date(booking.scheduledAt), "EEEE d 'de' MMMM, HH:mm", { locale: es })}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded text-xs border font-medium ${statusColors[booking.status as keyof typeof statusColors] || statusColors.PENDING}`}>
                      {booking.status}
                    </span>
                    <button 
                      onClick={() => handleOpenModal(booking)}
                      className="px-4 py-2 bg-dark-800 text-white rounded hover:bg-dark-700 transition text-sm font-medium"
                    >
                      Ver detalle
                    </button>
                  </div>
                </div>
              );
            })}
          {bookings.length === 0 && (
            <div className="text-center py-8 bg-dark-900 border border-dark-800 rounded-xl">
              <p className="text-gray-400">No tienes reservas pendientes.</p>
            </div>
          )}
        </div>

        {/* Gráfico */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Ingresos</h2>
          <EarningsChart />
        </div>
      </div>

      {/* Modal */}
      <BookingActionModal 
        booking={selectedBooking} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onUpdateStatus={handleUpdateStatus}
        isUpdating={isUpdatingStatus}
      />
    </div>
  );
}
