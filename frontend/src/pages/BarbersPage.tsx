import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { barberAPI } from '../lib/api';
import { Barber } from '../lib/types';
import { useGeolocation } from '../hooks/useGeolocation';
import toast from 'react-hot-toast';

const BarbersPage = () => {
  const navigate = useNavigate();
  const { latitude, longitude, error: geoError } = useGeolocation();
  const [filters, setFilters] = useState({
    radius: 10,
    minRating: 0,
    specialty: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['barbers', latitude, longitude, filters],
    queryFn: () => barberAPI.getAll({
      lat: latitude,
      lng: longitude,
      radius: filters.radius,
      minRating: filters.minRating || undefined,
      specialty: filters.specialty || undefined,
    }),
    enabled: !!latitude && !!longitude,
  });

  if (geoError) {
    toast.error('No se pudo obtener tu ubicación. Por favor permite el acceso.');
  }

  return (
    <div className="min-h-screen bg-dark-950 pt-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Barberos Cercanos</h1>

        {/* Filters */}
        <div className="bg-dark-900 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Radio (km)</label>
              <input
                type="range"
                min="1"
                max="50"
                value={filters.radius}
                onChange={(e) => setFilters({ ...filters, radius: Number(e.target.value) })}
                className="w-full"
              />
              <span className="text-primary-500">{filters.radius} km</span>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Rating mínimo</label>
              <select
                value={filters.minRating}
                onChange={(e) => setFilters({ ...filters, minRating: Number(e.target.value) })}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white"
              >
                <option value={0}>Cualquiera</option>
                <option value={3}>3+ estrellas</option>
                <option value={4}>4+ estrellas</option>
                <option value={4.5}>4.5+ estrellas</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Especialidad</label>
              <select
                value={filters.specialty}
                onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="">Todas</option>
                <option value="Corte clásico">Corte clásico</option>
                <option value="Barba">Barba</option>
                <option value="Fade">Fade</option>
                <option value="Color">Color</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-dark-900 rounded-lg p-6 animate-pulse">
                <div className="w-full h-48 bg-dark-800 rounded-lg mb-4"></div>
                <div className="h-6 bg-dark-800 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-dark-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">Error al cargar barberos: {(error as Error).message}</p>
          </div>
        )}

        {/* Barbers Grid */}
        {!isLoading && data && data.data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.data.map((barber: Barber) => (
              <div
                key={barber.id}
                className="bg-dark-900 rounded-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => navigate(`/barbers/${barber.id}`)}
              >
                <div className="relative h-48 bg-dark-800">
                  {barber.profile?.avatar ? (
                    <img
                      src={barber.profile.avatar}
                      alt={barber.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {barber.profile?.rating && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-dark-950 px-2 py-1 rounded-lg flex items-center gap-1">
                      <span>⭐</span>
                      <span className="font-bold">{barber.profile.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold text-white mb-2">{barber.name}</h3>
                  <p className="text-gray-400 text-sm mb-3">
                    {barber.profile?.experience || 0} años de experiencia
                  </p>
                  {barber.profile?.specialties && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {barber.profile.specialties.slice(0, 3).map((spec: string, i: number) => (
                        <span key={i} className="bg-dark-800 text-primary-500 text-xs px-2 py-1 rounded">
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">
                      {barber.profile?.totalReviews || 0} reseñas
                    </span>
                    {barber.distance && (
                      <span className="text-primary-500 font-semibold">
                        {barber.distance.toFixed(1)} km
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && data && data.data && data.data.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No se encontraron barberos con esos filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarbersPage;
