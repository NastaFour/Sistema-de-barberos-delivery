import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, DollarSign, MapPin, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { bookingAPI } from "../lib/api";

const statusColors: Record<string, string> = {
  PENDING: "badge-warning",
  PENDING_PAYMENT: "badge-warning",
  CONFIRMED: "badge-success",
  IN_PROGRESS: "badge-info",
  COMPLETED: "bg-dark-700/50 text-dark-300 border-dark-600",
  CANCELLED: "badge-danger",
  NO_SHOW: "badge-danger",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pendiente",
  PENDING_PAYMENT: "Pago Pendiente",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "En Progreso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No Asistio",
};

export default function MyBookingsPage() {
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["myBookings"],
    queryFn: () => bookingAPI.getMyBookings(),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingAPI.updateStatus(id, "CANCELLED"),
    onSuccess: () => {
      toast.success("Reserva cancelada");
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Error al cancelar");
    },
  });

  const bookings = data?.data || [];
  const filtered = bookings.filter((b: { status: string }) => {
    if (filter === "all") return true;
    if (filter === "upcoming")
      return ["PENDING", "PENDING_PAYMENT", "CONFIRMED", "IN_PROGRESS"].includes(b.status);
    return ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(b.status);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-display font-bold text-white">Mis Reservas</h1>
        <div className="flex gap-1 bg-dark-800/50 rounded-xl p-1">
          {[
            { key: "all", label: "Todas" },
            { key: "upcoming", label: "Activas" },
            { key: "past", label: "Pasadas" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-fast ${
                filter === f.key ? "bg-dark-700 text-white" : "text-dark-400 hover:text-dark-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-dark-400 text-lg">
            No tenes reservas{" "}
            {filter === "upcoming" ? "activas" : filter === "past" ? "pasadas" : ""}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(
            (
              b: {
                id: string;
                status: string;
                scheduledAt: string;
                total: number;
                address: string;
                barber?: { user?: { name: string; avatar?: string } };
                services?: { service?: { name: string } }[];
              },
              i: number,
            ) => (
              <div
                key={b.id}
                className="stagger-item card-flat"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold shrink-0">
                      {b.barber?.user?.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{b.barber?.user?.name || "Barbero"}</h3>
                      <div className="flex items-center gap-3 mt-1.5 text-sm text-dark-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(b.scheduledAt), "d MMM, HH:mm", { locale: es })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {b.address?.slice(0, 20)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`badge ${statusColors[b.status] || "bg-dark-700 text-dark-300 border-dark-600"}`}
                    >
                      {statusLabel[b.status] || b.status}
                    </span>
                    {["PENDING", "PENDING_PAYMENT", "CONFIRMED"].includes(b.status) && (
                      <button
                        onClick={() => cancelMutation.mutate(b.id)}
                        disabled={cancelMutation.isPending}
                        className="p-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-dark-800 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {(b.services || []).map((s, j) => (
                      <span
                        key={j}
                        className="px-2 py-0.5 rounded-md bg-dark-800 text-dark-300 text-xs"
                      >
                        {s.service?.name || "Servicio"}
                      </span>
                    ))}
                  </div>
                  <span className="flex items-center gap-1 font-bold text-white">
                    <DollarSign className="w-4 h-4 text-primary-400" />
                    {b.total}
                  </span>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
