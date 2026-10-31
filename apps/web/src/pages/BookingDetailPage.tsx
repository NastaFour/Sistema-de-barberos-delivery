import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, DollarSign, MapPin } from "lucide-react";
import { useParams } from "react-router-dom";
import { bookingAPI } from "../lib/api";

const statusColors: Record<string, string> = {
  PENDING: "badge-warning",
  PENDING_PAYMENT: "badge-warning",
  CONFIRMED: "badge-success",
  IN_PROGRESS: "badge-info",
  COMPLETED: "bg-dark-700/50 text-dark-300 border-dark-600",
  CANCELLED: "badge-danger",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pendiente",
  PENDING_PAYMENT: "Pago Pendiente",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "En Progreso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => bookingAPI.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-dark-400">Reserva no encontrada</p>
      </div>
    );
  }

  const b = data.data;
  const barberName = b.barber?.user?.name || "Barbero";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-white">Detalle de Reserva</h1>
        <span
          className={`badge ${statusColors[b.status] || "bg-dark-700 text-dark-300 border-dark-600"}`}
        >
          {statusLabel[b.status] || b.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Barber */}
          <div className="card-flat">
            <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-4">
              Barbero
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xl font-bold text-white">
                {barberName.charAt(0)}
              </div>
              <div>
                <p className="text-white font-bold text-lg">{barberName}</p>
                {b.barber?.user?.email && (
                  <p className="text-dark-400 text-sm">{b.barber.user.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="card-flat">
            <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-4">
              Servicios
            </h3>
            <div className="space-y-3">
              {(b.services || []).map(
                (s: {
                  id: string;
                  service?: { name?: string; duration?: number };
                  price: number;
                }) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-dark-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{s.service?.name || "Servicio"}</p>
                        <p className="text-dark-400 text-sm">{s.service?.duration || 0} min</p>
                      </div>
                    </div>
                    <span className="text-white font-bold">${s.price}</span>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Details */}
          <div className="card-flat">
            <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-4">
              Detalles
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary-400 shrink-0" />
                <span className="text-white">
                  {format(new Date(b.scheduledAt), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary-400 shrink-0" />
                <span className="text-white">{b.address}</span>
              </div>
              {b.notes && (
                <div className="p-4 bg-dark-800/50 rounded-xl">
                  <p className="text-dark-400 text-xs mb-1">Notas</p>
                  <p className="text-dark-200 text-sm">{b.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="space-y-6">
          <div className="card-flat sticky top-24">
            <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary-400" /> Resumen de Pago
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Subtotal</span>
                <span className="text-white">${b.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Comision (5%)</span>
                <span className="text-white">${b.serviceFee}</span>
              </div>
              <div className="border-t border-dark-800 pt-3 flex justify-between">
                <span className="text-white font-bold">Total</span>
                <span className="text-xl font-display font-bold text-primary-400">${b.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
