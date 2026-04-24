import React, { useState } from 'react';
import { useBarberBookings, useUpdateBookingStatus } from '../../hooks/useBarberBookings';
import { WeeklyCalendar } from '../../components/barber/WeeklyCalendar';
import { BookingActionModal } from '../../components/barber/BookingActionModal';
import { Booking } from '../../lib/types';
import { addWeeks, subWeeks, startOfWeek } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export function AgendaPage() {
  const { data: bookingsResponse, isLoading, isError } = useBarberBookings();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateBookingStatus();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const bookings: Booking[] = bookingsResponse?.data || [];

  const handleOpenModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = (bookingId: string, status: string) => {
    updateStatus({ id: bookingId, status }, {
      onSuccess: () => setIsModalOpen(false)
    });
  };

  const prevWeek = () => setSelectedDate(subWeeks(selectedDate, 1));
  const nextWeek = () => setSelectedDate(addWeeks(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center">
        <p className="text-red-400 mb-4">Error al cargar la agenda.</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-dark-800 text-white rounded">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Mi Agenda</h1>
          <p className="text-gray-400 mt-1">Gestiona tus reservas de la semana.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-dark-900 border border-dark-800 rounded-lg p-1">
          <button onClick={prevWeek} className="p-2 hover:bg-dark-800 rounded text-gray-400 hover:text-white transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={goToToday} className="px-4 py-2 text-sm font-medium hover:bg-dark-800 rounded text-white transition flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" /> Hoy
          </button>
          <button onClick={nextWeek} className="p-2 hover:bg-dark-800 rounded text-gray-400 hover:text-white transition">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center bg-dark-900 border border-dark-800 rounded-xl p-12">
          <CalendarIcon className="w-16 h-16 text-dark-700 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No hay reservas</h2>
          <p className="text-gray-400">No tienes citas programadas para estas fechas.</p>
        </div>
      ) : (
        <div className="flex-1 min-h-[600px]">
          <WeeklyCalendar 
            bookings={bookings} 
            selectedDate={selectedDate} 
            onBookingClick={handleOpenModal} 
          />
        </div>
      )}

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
