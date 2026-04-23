import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { barberAPI, bookingAPI } from '../lib/api';
import { Barber, BarberService } from '../lib/types';
import toast from 'react-hot-toast';

const BarberDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'services' | 'gallery' | 'reviews'>('services');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['barber', id],
    queryFn: () => barberAPI.getById(id!),
  });

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(s => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleBookNow = () => {
    if (selectedServices.length === 0) {
      toast.error('Selecciona al menos un servicio');
      return;
    }
    navigate(`/book?barberId=${id}&services=${selectedServices.join(',')}`);
  };

  const calculateTotal = () => {
    if (!data?.data) return 0;
    const services = data.data.services || [];
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.price || 0);
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="min-h-screen bg-dark-950 pt-20 flex items-center justify-center">
        <p className="text-red-500">Barbero no encontrado</p>
      </div>
    );
  }

  const barber = data.data as Barber;

  return (
    <div className="min-h-screen bg-dark-950 pt-20">
      {/* Header */}
      <div className="relative h-64 bg-dark-800">
        {barber.profile?.gallery && barber.profile.gallery.length > 0 ? (
          <img
            src={barber.profile.gallery[0]}
            alt={barber.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-dark-950 to-transparent p-6">
          <h1 className="text-4xl font-bold text-white">{barber.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            {barber.profile?.rating && (
              <span className="flex items-center text-yellow-500">
                ⭐ {barber.profile.rating.toFixed(1)} ({barber.profile.totalReviews} reseñas)
              </span>
            )}
            <span className="text-gray-400">{barber.profile?.experience || 0} años de experiencia</span>
          </div>
        </div>
      </div>

      {/* Bio & Specialties */}
      <div className="container mx-auto px-4 py-8">
        {barber.profile?.bio && (
          <p className="text-gray-300 mb-6">{barber.profile.bio}</p>
        )}
        {barber.profile?.specialties && (
          <div className="flex flex-wrap gap-2 mb-8">
            {barber.profile.specialties.map((spec: string, i: number) => (
              <span key={i} className="bg-dark-800 text-primary-500 px-3 py-1 rounded-full">
                {spec}
              </span>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 border-b border-dark-700 mb-8">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'services'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Servicios
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'gallery'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Galería
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'reviews'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Reseñas
          </button>
        </div>

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            {(barber.services || []).map((service: BarberService) => (
              <div
                key={service.id}
                className={`bg-dark-900 rounded-lg p-6 cursor-pointer transition-all ${
                  selectedServices.includes(service.id)
                    ? 'border-2 border-primary-500'
                    : 'border border-dark-700 hover:border-dark-600'
                }`}
                onClick={() => handleServiceToggle(service.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                    <p className="text-gray-400 text-sm mb-2">{service.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>⏱️ {service.duration} min</span>
                      <span>💰 ${service.price}</span>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedServices.includes(service.id)
                      ? 'bg-primary-500 border-primary-500'
                      : 'border-dark-600'
                  }`}>
                    {selectedServices.includes(service.id) && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Booking Summary */}
            {selectedServices.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-700 p-6">
                <div className="container mx-auto flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{selectedServices.length} servicios seleccionados</p>
                    <p className="text-2xl font-bold text-primary-500">${calculateTotal()}</p>
                  </div>
                  <button
                    onClick={handleBookNow}
                    className="bg-primary-500 hover:bg-primary-600 text-dark-950 font-bold px-8 py-3 rounded-lg transition-colors"
                  >
                    Reservar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(barber.profile?.gallery || []).map((image: string, i: number) => (
              <img
                key={i}
                src={image}
                alt={`Galería ${i + 1}`}
                className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
              />
            ))}
            {(barber.profile?.gallery || []).length === 0 && (
              <p className="text-gray-400 col-span-full text-center py-12">No hay imágenes en la galería</p>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {(barber.reviews || []).map((review: any) => (
              <div key={review.id} className="bg-dark-900 rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-dark-800 rounded-full flex items-center justify-center text-gray-400">
                    {review.client?.name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{review.client?.name || 'Cliente'}</p>
                    <div className="flex items-center text-yellow-500">
                      {'⭐'.repeat(review.rating)}
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-300">{review.comment}</p>
                )}
                <p className="text-gray-500 text-sm mt-4">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
            {(barber.reviews || []).length === 0 && (
              <p className="text-gray-400 text-center py-12">No hay reseñas todavía</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BarberDetailPage;
