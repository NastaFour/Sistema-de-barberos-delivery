import React, { useState } from 'react';
import { Booking } from '../../lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MapPin, Phone, User, X, Check, Play, CheckCircle2, AlertCircle } from 'lucide-react';

interface BookingActionModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (bookingId: string, newStatus: string) => void;
  isUpdating?: boolean;
}

export function BookingActionModal({ booking, isOpen, onClose, onUpdateStatus, isUpdating }: BookingActionModalProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (!isOpen || !booking) return null;

  const handleNavigate = () => {
    if (booking.latitude && booking.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${booking.latitude},${booking.longitude}`, '_blank');
    }
  };

  const renderActions = () => {
    if (showCancelConfirm) {
      return (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg w-full">
          <p className="text-red-400 text-sm mb-4 text-center">¿Estás seguro que deseas cancelar esta reserva? Esta acción no se puede deshacer.</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowCancelConfirm(false)}
              className="flex-1 px-4 py-2 bg-dark-700 text-white rounded hover:bg-dark-600 transition"
              disabled={isUpdating}
            >
              No, volver
            </button>
            <button 
              onClick={() => onUpdateStatus(booking.id, 'CANCELLED')}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition font-bold"
              disabled={isUpdating}
            >
              {isUpdating ? 'Cancelando...' : 'Sí, Cancelar'}
            </button>
          </div>
        </div>
      );
    }

    switch (booking.status) {
      case 'PENDING':
        return (
          <div className="flex gap-2 w-full">
            <button 
              onClick={() => setShowCancelConfirm(true)}
              className="flex-1 px-4 py-3 bg-dark-800 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition font-medium"
            >
              Rechazar
            </button>
            <button 
              onClick={() => onUpdateStatus(booking.id, 'CONFIRMED')}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition font-bold flex items-center justify-center gap-2"
              disabled={isUpdating}
            >
              <Check className="w-5 h-5" />
              {isUpdating ? 'Procesando...' : 'Confirmar Reserva'}
            </button>
          </div>
        );
      case 'CONFIRMED':
        return (
          <button 
            onClick={() => onUpdateStatus(booking.id, 'IN_PROGRESS')}
            className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-bold flex items-center justify-center gap-2"
            disabled={isUpdating}
          >
            <Play className="w-5 h-5" />
            {isUpdating ? 'Procesando...' : 'Iniciar Servicio'}
          </button>
        );
      case 'IN_PROGRESS':
        return (
          <button 
            onClick={() => onUpdateStatus(booking.id, 'COMPLETED')}
            className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-bold flex items-center justify-center gap-2"
            disabled={isUpdating}
          >
            <CheckCircle2 className="w-5 h-5" />
            {isUpdating ? 'Procesando...' : 'Completar Servicio'}
          </button>
        );
      default:
        return (
          <div className="w-full py-3 text-center text-gray-500 bg-dark-800 rounded-lg">
            Reserva {booking.status === 'COMPLETED' ? 'Completada' : 'Cancelada'}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-dark-900 border border-dark-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-dark-800 bg-dark-950">
          <h2 className="text-lg font-bold text-white">Detalles de la Reserva</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Client Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-dark-800 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="font-semibold">{booking.client?.name || 'Cliente sin nombre'}</p>
                <p className="text-sm text-gray-400 capitalize">{format(new Date(booking.scheduledAt), "EEEE d 'de' MMMM, HH:mm", { locale: es })}</p>
              </div>
            </div>
            
            {(booking.client as any)?.phone && (
              <div className="flex items-center gap-3 text-gray-300 bg-dark-800/50 p-3 rounded-lg">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-sm">{(booking.client as any).phone}</span>
              </div>
            )}
            
            <div className="flex items-start gap-3 text-gray-300 bg-dark-800/50 p-3 rounded-lg">
              <MapPin className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm leading-snug">{booking.address}</p>
                <button onClick={handleNavigate} className="text-xs text-primary hover:underline mt-1">
                  Navegar con Google Maps
                </button>
              </div>
            </div>
          </div>

          {/* Services Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Servicios Solicitados</h3>
            <div className="space-y-2">
              {booking.services?.map((bs, i) => (
                <div key={i} className="flex justify-between items-center bg-dark-950 border border-dark-800 p-3 rounded-lg">
                  <span className="text-white text-sm">{bs.service.name}</span>
                  <span className="text-primary font-mono text-sm">${bs.price}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-dark-800">
              <span className="text-white font-medium">Total Estimado</span>
              <span className="text-white font-bold text-lg">${booking.services?.reduce((sum, bs) => sum + bs.price, 0) || 0}</span>
            </div>
          </div>

          {booking.notes && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
              <div>
                <span className="text-xs text-yellow-500/80 font-semibold block mb-1">Nota del cliente</span>
                <p className="text-sm text-yellow-400/90 italic">{booking.notes}</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-dark-800 bg-dark-950">
          {renderActions()}
        </div>

      </div>
    </div>
  );
}
