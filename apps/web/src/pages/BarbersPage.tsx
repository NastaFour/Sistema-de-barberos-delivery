import { useQuery } from "@tanstack/react-query";
import { ChevronUp, MapPin, Star } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { type MapMarker, MapView } from "../components/MapView";
import { useGeolocation } from "../hooks/useGeolocation";
import { barberAPI } from "../lib/api";

const DEFAULT_CENTER: [number, number] = [10.4806, -66.9036];

type ApiBarber = {
  id: string;
  userId?: string;
  name?: string;
  user?: { id: string; name: string; avatar?: string };
  avatar?: string;
  rating?: number;
  specialty?: string[];
  specialties?: string[];
  yearsExperience?: number;
  experience?: number;
  latitude?: number;
  longitude?: number;
  distance?: number;
  services?: unknown[];
};

function getName(b: ApiBarber): string {
  return b.name || b.user?.name || "Barbero";
}
function getAvatar(b: ApiBarber): string | undefined {
  return b.user?.avatar || b.avatar || undefined;
}
function getRating(b: ApiBarber): number {
  return b.rating ?? 0;
}
function getLat(b: ApiBarber): number {
  return b.latitude ?? 0;
}
function getLng(b: ApiBarber): number {
  return b.longitude ?? 0;
}
function getSpecialty(b: ApiBarber): string | undefined {
  const specs = b.specialty || b.specialties;
  return Array.isArray(specs) ? specs[0] : undefined;
}
function getExp(b: ApiBarber): number {
  return b.yearsExperience ?? b.experience ?? 0;
}

export default function BarbersPage() {
  const navigate = useNavigate();
  const { latitude, longitude } = useGeolocation();

  const [filters, setFilters] = useState({ radius: 10, minRating: 0, specialty: "" });
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["barbers", latitude, longitude, filters],
    queryFn: () =>
      barberAPI.getAll({
        lat: latitude || undefined,
        lng: longitude || undefined,
        radius: filters.radius,
        minRating: filters.minRating || undefined,
        specialty: filters.specialty || undefined,
      }),
  });

  const mapCenter: [number, number] =
    latitude && longitude ? [latitude, longitude] : DEFAULT_CENTER;
  const barbers: ApiBarber[] = data?.data || [];

  const markers: MapMarker[] = barbers
    .map((b) => ({
      id: b.id,
      lat: getLat(b),
      lng: getLng(b),
      popup: (
        <div className="text-center min-w-[140px]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold mx-auto mb-2">
            {getName(b).charAt(0)}
          </div>
          <h3 className="font-bold text-white text-sm">{getName(b)}</h3>
          <div className="flex items-center justify-center gap-1 text-amber-400 text-xs my-1">
            <Star className="w-3 h-3 fill-current" />
            <span>{getRating(b).toFixed(1)}</span>
          </div>
          <button
            onClick={() => navigate(`/barbers/${b.id}`)}
            className="mt-1 w-full bg-primary-600 hover:bg-primary-500 py-1 px-2 rounded-lg text-white font-semibold text-xs transition-colors"
          >
            Ver perfil
          </button>
        </div>
      ),
    }))
    .filter((m) => m.lat !== 0 && m.lng !== 0);

  if (latitude && longitude) {
    markers.push({
      id: "user",
      lat: latitude,
      lng: longitude,
      popup: <div className="text-white font-bold text-sm">Tu ubicacion</div>,
    });
  }

  return (
    <div className="h-screen pt-16 flex flex-col md:flex-row bg-dark-950 overflow-hidden relative">
      {/* Sidebar / Bottom sheet */}
      <div
        className={`flex-col z-overlay bg-dark-950 border-r border-dark-800 transition-all duration-normal absolute md:static w-full md:w-1/2 lg:w-1/3 h-full md:h-auto ${isBottomSheetOpen ? "top-16 bottom-0" : "top-[calc(100vh-120px)] bottom-0"} md:top-0 md:flex`}
      >
        <button
          onClick={() => setIsBottomSheetOpen(!isBottomSheetOpen)}
          className="md:hidden w-full p-4 flex flex-col items-center justify-center bg-dark-900 border-t border-dark-800 rounded-t-2xl"
        >
          <div className="w-10 h-1 bg-dark-700 rounded-full mb-2" />
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <ChevronUp
              className={`w-4 h-4 transition-transform ${isBottomSheetOpen ? "rotate-180" : ""}`}
            />
            {isBottomSheetOpen ? "Ocultar" : "Ver barberos"}
          </div>
        </button>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 pb-24 md:pb-6 no-scrollbar">
          <div>
            <h1 className="text-2xl font-display font-bold text-white mb-1">Barberos Cercanos</h1>
            <p className="text-dark-400 text-sm">Encuentra profesionales cerca de ti</p>
          </div>

          {/* Filters */}
          <div className="glass rounded-xl p-4 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-dark-400">Distancia</span>
                <span className="text-primary-400 font-medium">{filters.radius} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={filters.radius}
                onChange={(e) => setFilters({ ...filters, radius: Number(e.target.value) })}
                className="w-full accent-primary-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={filters.minRating}
                onChange={(e) => setFilters({ ...filters, minRating: Number(e.target.value) })}
                className="input-field text-sm py-2"
              >
                <option value={0}>Rating</option>
                <option value={3}>3+ estrellas</option>
                <option value={4}>4+ estrellas</option>
                <option value={4.5}>4.5+ estrellas</option>
              </select>
              <select
                value={filters.specialty}
                onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                className="input-field text-sm py-2"
              >
                <option value="">Especialidad</option>
                <option value="Degradado">Degradado</option>
                <option value="Barba">Barba</option>
                <option value="Corte">Corte</option>
                <option value="Tinte">Tinte</option>
              </select>
            </div>
          </div>

          {/* Loading skeleton */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass rounded-xl p-4 flex gap-4">
                  <div className="w-20 h-20 rounded-xl shimmer" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 rounded shimmer" />
                    <div className="h-3 w-1/2 rounded shimmer" />
                    <div className="h-3 w-1/3 rounded shimmer" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-red-400 text-center py-4 bg-red-500/10 rounded-xl text-sm">
              Error al cargar barberos
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && barbers.length === 0 && (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-dark-400">No se encontraron barberos con estos filtros</p>
            </div>
          )}

          {/* List */}
          {!isLoading && !error && barbers.length > 0 && (
            <div className="space-y-3">
              {barbers.map((b, i) => (
                <div
                  key={b.id}
                  onClick={() => navigate(`/barbers/${b.id}`)}
                  className="stagger-item glass rounded-xl p-4 flex gap-4 cursor-pointer hover:border-primary-500/30 transition-[transform,border-color] duration-fast hover:-translate-y-0.5"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="w-20 h-20 rounded-xl bg-dark-800 flex-shrink-0 overflow-hidden relative">
                    {getAvatar(b) ? (
                      <img
                        src={getAvatar(b)}
                        alt={getName(b)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-dark-500 text-xl">
                        {getName(b).charAt(0)}
                      </div>
                    )}
                    {getRating(b) > 0 && (
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-center text-xs py-0.5 text-amber-400 font-bold backdrop-blur-sm">
                        {getRating(b).toFixed(1)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-lg leading-tight truncate">
                      {getName(b)}
                    </h3>
                    <p className="text-dark-400 text-sm mt-0.5">{getExp(b)} anos exp.</p>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      {b.distance !== undefined && (
                        <span className="flex items-center text-primary-400 font-medium">
                          <MapPin className="w-3 h-3 mr-1" />
                          {b.distance.toFixed(1)} km
                        </span>
                      )}
                      {getSpecialty(b) && (
                        <span className="bg-dark-800 px-2 py-0.5 rounded text-dark-300">
                          {getSpecialty(b)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="absolute md:static top-0 bottom-0 w-full md:w-1/2 lg:w-2/3 h-full z-base">
        <MapView center={mapCenter} zoom={13} markers={markers} />
      </div>
    </div>
  );
}
