import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { barberAPI } from '../lib/api';
import { Barber } from '../lib/types';
import { useGeolocation } from '../hooks/useGeolocation';
import { MapView, MapMarker } from '../components/MapView';
import { Star, MapPin, Loader2, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_CENTER: [number, number] = [40.4168, -3.7038]; // Madrid as default fallback

const BarbersPage = () => {
  const navigate = useNavigate();
  const { latitude, longitude, error: geoError } = useGeolocation();
  
  const [filters, setFilters] = useState({
    radius: 10,
    minRating: 0,
    specialty: '',
  });

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['barbers', latitude, longitude, filters],
    queryFn: () => barberAPI.getAll({
      lat: latitude || undefined,
      lng: longitude || undefined,
      radius: filters.radius,
      minRating: filters.minRating || undefined,
      specialty: filters.specialty || undefined,
    }),
  });

  if (geoError && !latitude) {
    toast.error('No pudimos obtener tu ubicación, mostrando resultados por defecto.', { id: 'geoError' });
  }

  const mapCenter: [number, number] = latitude && longitude ? [latitude, longitude] : DEFAULT_CENTER;

  const barbers: Barber[] = data?.data || [];

  const markers: MapMarker[] = barbers.map(barber => ({
    id: barber.id,
    lat: barber.profile?.latitude || 0,
    lng: barber.profile?.longitude || 0,
    popup: (
      <div className="text-center min-w-[150px]">
        {barber.profile?.avatar ? (
          <img src={barber.profile.avatar} alt={barber.name} className="w-12 h-12 rounded-full mx-auto mb-2 object-cover" />
        ) : (
          <div className="w-12 h-12 bg-dark-700 rounded-full mx-auto mb-2 flex items-center justify-center text-white">
            {barber.name.charAt(0)}
          </div>
        )}
        <h3 className="font-bold text-white text-sm">{barber.name}</h3>
        <div className="flex items-center justify-center gap-1 text-yellow-400 text-xs my-1">
          <Star className="w-3 h-3 fill-current" />
          <span>{barber.profile?.rating?.toFixed(1) || 'N/A'}</span>
        </div>
        <button 
          onClick={() => navigate(`/barbers/${barber.id}`)}
          className="mt-2 w-full bg-primary py-1 px-2 rounded text-dark-950 font-semibold text-xs"
        >
          Ver perfil
        </button>
      </div>
    )
  })).filter(m => m.lat !== 0 && m.lng !== 0);

  // Si tenemos ubicación, agregamos el marker del usuario
  if (latitude && longitude) {
    markers.push({
      id: 'user',
      lat: latitude,
      lng: longitude,
      popup: <div className="text-white font-bold text-sm">Tu ubicación</div>
    });
  }

  return (
    <div className="h-screen pt-16 flex flex-col md:flex-row bg-dark-950 overflow-hidden relative">
      
      {/* Sidebar (Desktop) / Bottom Sheet (Mobile) */}
      <div className={`
        flex-col z-20 md:z-auto bg-dark-950 border-r border-dark-800 transition-all duration-300 absolute md:static w-full md:w-1/2 lg:w-1/3 h-full md:h-auto
        ${isBottomSheetOpen ? 'top-16 bottom-0' : 'top-[calc(100vh-120px)] bottom-0'}
        md:top-0 md:flex
      `}>
        {/* Toggle Handle for Mobile */}
        <button 
          onClick={() => setIsBottomSheetOpen(!isBottomSheetOpen)}
          className="md:hidden w-full p-4 flex flex-col items-center justify-center bg-dark-900 border-t border-dark-800 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        >
          <div className="w-12 h-1 bg-dark-700 rounded-full mb-2"></div>
          <div className="flex items-center gap-2 text-white font-semibold">
            <ChevronUp className={`w-5 h-5 transition-transform ${isBottomSheetOpen ? 'rotate-180' : ''}`} />
            {isBottomSheetOpen ? 'Ocultar lista' : 'Ver barberos cercanos'}
          </div>
        </button>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-24 md:pb-6 bg-dark-950">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Barberos Cercanos</h1>
            <p className="text-gray-400 text-sm">Encuentra los mejores profesionales cerca de ti.</p>
          </div>

          {/* Filters */}
          <div className="bg-dark-900 rounded-xl p-4 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Distancia</span>
                <span className="text-primary font-medium">{filters.radius} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={filters.radius}
                onChange={(e) => setFilters({ ...filters, radius: Number(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters({ ...filters, minRating: Number(e.target.value) })}
                  className="w-full bg-dark-800 border border-dark-700 text-sm rounded-lg px-3 py-2 text-white outline-none focus:border-primary"
                >
                  <option value={0}>Rating</option>
                  <option value={3}>3+ estrellas</option>
                  <option value={4}>4+ estrellas</option>
                  <option value={4.5}>4.5+ estrellas</option>
                </select>
              </div>
              <div>
                <select
                  value={filters.specialty}
                  onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                  className="w-full bg-dark-800 border border-dark-700 text-sm rounded-lg px-3 py-2 text-white outline-none focus:border-primary"
                >
                  <option value="">Especialidad</option>
                  <option value="Corte clásico">Corte clásico</option>
                  <option value="Barba">Barba</option>
                  <option value="Fade">Fade</option>
                  <option value="Color">Color</option>
                </select>
              </div>
            </div>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p>Buscando barberos...</p>
            </div>
          ) : error ? (
            <div className="text-red-400 text-center py-4 bg-red-500/10 rounded-lg">
              Error al cargar barberos
            </div>
          ) : barbers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No se encontraron barberos con estos filtros cerca de ti.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {barbers.map(barber => (
                <div 
                  key={barber.id} 
                  onClick={() => navigate(`/barbers/${barber.id}`)}
                  className="bg-dark-900 border border-dark-800 rounded-xl p-4 flex gap-4 cursor-pointer hover:bg-dark-800 transition"
                >
                  <div className="w-20 h-20 bg-dark-800 rounded-lg flex-shrink-0 overflow-hidden relative">
                    {barber.profile?.avatar ? (
                      <img src={barber.profile.avatar} alt={barber.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-gray-500 text-xl">
                        {barber.name.charAt(0)}
                      </div>
                    )}
                    {barber.profile?.rating && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-center text-xs py-0.5 text-yellow-400 font-bold backdrop-blur-sm">
                        ⭐ {barber.profile.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg leading-tight">{barber.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{barber.profile?.experience || 0} años exp.</p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      {barber.distance !== undefined && (
                        <div className="flex items-center text-primary font-medium">
                          <MapPin className="w-3 h-3 mr-1" />
                          {barber.distance.toFixed(1)} km
                        </div>
                      )}
                      {barber.profile?.specialties && barber.profile.specialties[0] && (
                        <span className="bg-dark-700 px-2 py-0.5 rounded text-gray-300">
                          {barber.profile.specialties[0]}
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

      {/* Map Area */}
      <div className="absolute md:static top-0 bottom-0 w-full md:w-1/2 lg:w-2/3 h-full z-0">
        <MapView 
          center={mapCenter} 
          zoom={13} 
          markers={markers} 
        />
      </div>
      
    </div>
  );
};

export default BarbersPage;
