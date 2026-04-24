import React, { useMemo } from 'react';
import { useBarberBookings } from '../../hooks/useBarberBookings';
import { EarningsChart } from '../../components/barber/EarningsChart';
import { format, subDays, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { DollarSign, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { Booking } from '../../lib/types';

export function EarningsPage() {
  const { data: bookingsResponse, isLoading } = useBarberBookings('COMPLETED');
  const completedBookings: Booking[] = bookingsResponse?.data || [];

  const { totalAllTime, totalThisWeek, averagePerBooking } = useMemo(() => {
    let allTime = 0;
    let thisWeek = 0;
    const sevenDaysAgo = subDays(new Date(), 7);

    completedBookings.forEach(b => {
      const amount = b.services?.reduce((sum, bs) => sum + bs.price, 0) || 0;
      allTime += amount;
      if (isAfter(new Date(b.scheduledAt), sevenDaysAgo)) {
        thisWeek += amount;
      }
    });

    const average = completedBookings.length > 0 ? allTime / completedBookings.length : 0;

    return { totalAllTime: allTime, totalThisWeek: thisWeek, averagePerBooking: average };
  }, [completedBookings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Ingresos y Estadísticas</h1>
        <p className="text-gray-400 mt-1">Monitorea tus ganancias e historial de servicios completados.</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-900 border border-dark-800 p-6 rounded-xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-gray-400 font-medium">Ingresos Históricos</p>
            <h3 className="text-4xl font-bold text-white mt-2">${totalAllTime.toFixed(2)}</h3>
          </div>
          <DollarSign className="absolute -right-4 -bottom-4 w-32 h-32 text-dark-800 opacity-50" />
        </div>
        
        <div className="bg-dark-900 border border-dark-800 p-6 rounded-xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-gray-400 font-medium">Últimos 7 días</p>
            <h3 className="text-4xl font-bold text-green-400 mt-2">${totalThisWeek.toFixed(2)}</h3>
          </div>
          <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-green-500/10 opacity-50" />
        </div>

        <div className="bg-dark-900 border border-dark-800 p-6 rounded-xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-gray-400 font-medium">Promedio por Cita</p>
            <h3 className="text-4xl font-bold text-blue-400 mt-2">${averagePerBooking.toFixed(2)}</h3>
          </div>
          <CheckCircle className="absolute -right-4 -bottom-4 w-32 h-32 text-blue-500/10 opacity-50" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-white">Historial de Completados</h2>
          <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
            {completedBookings.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No hay reservas completadas aún.</div>
            ) : (
              <div className="divide-y divide-dark-800">
                {completedBookings.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()).map(booking => {
                  const total = booking.services?.reduce((sum, bs) => sum + bs.price, 0) || 0;
                  return (
                    <div key={booking.id} className="p-4 flex justify-between items-center hover:bg-dark-800/50 transition">
                      <div>
                        <p className="font-bold text-white">{booking.client?.name}</p>
                        <p className="text-sm text-gray-400 flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(booking.scheduledAt), "d MMM yyyy, HH:mm", { locale: es })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-400">${total.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{(booking.services?.length || 0)} servicios</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Rendimiento (7 días)</h2>
          <EarningsChart />
        </div>
      </div>
    </div>
  );
}
