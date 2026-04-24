import React from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Booking } from '../../lib/types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface WeeklyCalendarProps {
  bookings: Booking[];
  onBookingClick: (booking: Booking) => void;
  selectedDate: Date;
}

export function WeeklyCalendar({ bookings, onBookingClick, selectedDate }: WeeklyCalendarProps) {
  const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Semana empieza en lunes

  const days = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
  const hours = Array.from({ length: 13 }).map((_, i) => i + 8); // 8 AM to 8 PM

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'CONFIRMED': return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
      case 'IN_PROGRESS': return 'bg-orange-500/20 text-orange-500 border-orange-500/50';
      case 'COMPLETED': return 'bg-green-500/20 text-green-500 border-green-500/50';
      case 'CANCELLED': return 'bg-red-500/20 text-red-500 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/50';
    }
  };

  return (
    <div className="flex flex-col h-[600px] overflow-y-auto bg-dark-900 border border-dark-800 rounded-lg">
      <div className="flex sticky top-0 z-10 bg-dark-950 border-b border-dark-800">
        <div className="w-16 flex-shrink-0 border-r border-dark-800"></div>
        {days.map(day => (
          <div key={day.toISOString()} className="flex-1 text-center py-3 border-r border-dark-800 last:border-r-0">
            <div className="text-sm text-gray-400 capitalize">{format(day, 'EEE', { locale: es })}</div>
            <div className={cn(
              "text-lg font-bold w-8 h-8 mx-auto rounded-full flex items-center justify-center mt-1",
              isSameDay(day, new Date()) ? "bg-primary text-white" : "text-white"
            )}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex-1 flex relative">
        <div className="w-16 flex-shrink-0 border-r border-dark-800">
          {hours.map(hour => (
            <div key={hour} className="h-20 text-xs text-gray-500 text-right pr-2 pt-2 border-b border-dark-800">
              {hour}:00
            </div>
          ))}
        </div>
        
        <div className="flex-1 grid grid-cols-7">
          {days.map(day => (
            <div key={day.toISOString()} className="border-r border-dark-800 last:border-r-0 relative">
              {hours.map(hour => (
                <div key={`${day.toISOString()}-${hour}`} className="h-20 border-b border-dark-800/50"></div>
              ))}
              
              {/* Render Bookings */}
              {bookings
                .filter(b => isSameDay(new Date(b.scheduledAt), day))
                .map(booking => {
                  const date = new Date(booking.scheduledAt);
                  const startHour = date.getHours();
                  const startMinutes = date.getMinutes();
                  
                  if (startHour < 8 || startHour > 20) return null; // Fuera del horario visible
                  
                  const top = ((startHour - 8) * 80) + (startMinutes / 60 * 80);
                  const totalDuration = booking.services?.reduce((sum, bs) => sum + bs.service.duration, 0) || 60;
                  const height = (totalDuration / 60) * 80;

                  return (
                    <div
                      key={booking.id}
                      onClick={() => onBookingClick(booking)}
                      className={cn(
                        "absolute left-1 right-1 rounded p-2 text-xs border cursor-pointer hover:opacity-80 transition-opacity overflow-hidden",
                        getStatusColor(booking.status)
                      )}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <div className="font-semibold truncate">{booking.client?.name || 'Cliente'}</div>
                      <div className="truncate opacity-80">{format(date, 'HH:mm')} - {totalDuration} min</div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
