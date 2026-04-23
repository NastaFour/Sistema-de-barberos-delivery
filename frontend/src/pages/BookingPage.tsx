import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { barberAPI, bookingAPI } from '../lib/api';
import { BarberService } from '../lib/types';
import toast from 'react-hot-toast';
import { format, addDays, setHours, setMinutes, isBefore, startOfHour } from 'date-fns';
import { es } from 'date-fns/locale';

const BookingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const barberId = searchParams.get('barberId');
  const serviceIdsParam = searchParams.get('services');
  
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>(
    serviceIdsParam ? serviceIdsParam.split(',') : []
  );

  // Fetch barber data
  const { data: barberData } = useQuery({
    queryKey: ['barber', barberId],
    queryFn: () => barberAPI.getById(barberId!),
    enabled: !!barberId,
  });

  // Fetch available slots
  const { data: slotsData, refetch: refetchSlots } = useQuery({
    queryKey: ['slots', barberId, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => bookingAPI.getAvailableSlots(barberId!, selectedDate.toISOString()),
    enabled: !!barberId && step >= 2,
  });

  const availableSlots = slotsData?.data || [];

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: (data: any) => bookingAPI.create(data),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('¡Reserva creada con éxito!');
        navigate('/my-bookings');
      } else {
        toast.error(response.error || 'Error al crear la reserva');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear la reserva');
    },
  });

  const handleNext = () => {
    if (step === 1 && selectedServices.length === 0) {
      toast.error('Selecciona al menos un servicio');
      return;
    }
    if (step === 2 && !selectedTime) {
      toast.error('Selecciona una hora');
      return;
    }
    if (step === 3 && (!address || !latitude || !longitude)) {
      toast.error('Ingresa una dirección válida');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleConfirm = () => {
    if (!barberId || selectedServices.length === 0 || !selectedTime || !address || !latitude || !longitude) {
      toast.error('Faltan datos por completar');
      return;
    }

    const bookingData = {
      barberId,
      scheduledAt: new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`).toISOString(),
      serviceIds: selectedServices,
      address,
      latitude,
      longitude,
      notes: notes || undefined,
    };

    createBookingMutation.mutate(bookingData);
  };

  const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    
    // Simple geocoding simulation (in real app, use Mapbox/Google Geocoding API)
    if (value.length > 10) {
      // Mock coordinates - in production use actual geocoding
      setLatitude(40.4168 + Math.random() * 0.1);
      setLongitude(-3.7038 + Math.random() * 0.1);
    }
  };

  const barber = barberData?.data;
  const services = (barber?.services || []) as BarberService[];
  const selectedServicesDetails = services.filter(s => selectedServices.includes(s.id));
  const totalDuration = selectedServicesDetails.reduce((sum, s) => sum + s.duration, 0);
  const subtotal = selectedServicesDetails.reduce((sum, s) => sum + s.price, 0);
  const serviceFee = subtotal * 0.05;
  const total = subtotal + serviceFee;

  // Generate next 7 days
  const nextDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  return (
    <div className="min-h-screen bg-dark-950 pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s ? 'bg-primary-500 text-dark-950' : 'bg-dark-800 text-gray-400'
              }`}>
                {s}
              </div>
              {s < 5 && (
                <div className={`w-16 h-1 ${s < step ? 'bg-primary-500' : 'bg-dark-800'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-dark-900 rounded-lg p-8">
          {/* Step 1: Confirm Services */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Confirmar Servicios</h2>
              <div className="space-y-4">
                {selectedServicesDetails.map((service) => (
                  <div key={service.id} className="flex items-center justify-between bg-dark-800 rounded-lg p-4">
                    <div>
                      <h3 className="text-white font-semibold">{service.name}</h3>
                      <p className="text-gray-400 text-sm">{service.duration} min - ${service.price}</p>
                    </div>
                    <button
                      onClick={() => setSelectedServices(selectedServices.filter(s => s !== service.id))}
                      className="text-red-500 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => navigate(`/barbers/${barberId}`)}
                  className="flex-1 bg-dark-800 text-white py-3 rounded-lg hover:bg-dark-700"
                >
                  Volver
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 bg-primary-500 text-dark-950 font-bold py-3 rounded-lg hover:bg-primary-600"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Select Date & Time */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Seleccionar Fecha y Hora</h2>
              
              {/* Date Selector */}
              <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
                {nextDays.map((date) => (
                  <button
                    key={date.toISOString()}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedTime('');
                    }}
                    className={`flex-shrink-0 px-4 py-3 rounded-lg text-center ${
                      format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                        ? 'bg-primary-500 text-dark-950'
                        : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                    }`}
                  >
                    <div className="text-xs uppercase">{format(date, 'EEE', { locale: es })}</div>
                    <div className="text-xl font-bold">{format(date, 'd')}</div>
                  </button>
                ))}
              </div>

              {/* Time Slots */}
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {availableSlots.map((slot: string) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`py-3 rounded-lg font-semibold ${
                      selectedTime === slot
                        ? 'bg-primary-500 text-dark-950'
                        : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              {availableSlots.length === 0 && (
                <p className="text-gray-400 text-center py-8">No hay horarios disponibles para esta fecha</p>
              )}

              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-dark-800 text-white py-3 rounded-lg hover:bg-dark-700"
                >
                  Atrás
                </button>
                <button
                  onClick={handleNext}
                  disabled={!selectedTime}
                  className="flex-1 bg-primary-500 text-dark-950 font-bold py-3 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Address */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Dirección del Servicio</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-2">Dirección completa</label>
                  <input
                    type="text"
                    value={address}
                    onChange={handleAddressChange}
                    placeholder="Calle, número, ciudad..."
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
                {latitude && longitude && (
                  <div className="bg-dark-800 rounded-lg p-4">
                    <p className="text-green-500">✓ Ubicación detectada</p>
                    <p className="text-gray-400 text-sm">Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}</p>
                  </div>
                )}
                <div>
                  <label className="block text-gray-400 mb-2">Notas adicionales (opcional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: Portero automático, piso, referencias..."
                    rows={3}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-dark-800 text-white py-3 rounded-lg hover:bg-dark-700"
                >
                  Atrás
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 bg-primary-500 text-dark-950 font-bold py-3 rounded-lg hover:bg-primary-600"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Summary */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Resumen de Reserva</h2>
              <div className="space-y-4">
                <div className="bg-dark-800 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">Servicios</h3>
                  {selectedServicesDetails.map((service) => (
                    <div key={service.id} className="flex justify-between text-gray-400">
                      <span>{service.name}</span>
                      <span>${service.price}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-dark-800 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">Detalles</h3>
                  <div className="space-y-2 text-gray-400">
                    <div className="flex justify-between">
                      <span>Fecha:</span>
                      <span>{format(selectedDate, 'EEEE d MMMM', { locale: es })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hora:</span>
                      <span>{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duración:</span>
                      <span>{totalDuration} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dirección:</span>
                      <span className="text-right max-w-xs truncate">{address}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-dark-800 rounded-lg p-4">
                  <div className="flex justify-between text-gray-400 mb-2">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 mb-2">
                    <span>Comisión (5%):</span>
                    <span>${serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-dark-700 pt-2 mt-2 flex justify-between text-white font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-primary-500">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-dark-800 text-white py-3 rounded-lg hover:bg-dark-700"
                >
                  Atrás
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={createBookingMutation.isPending}
                  className="flex-1 bg-primary-500 text-dark-950 font-bold py-3 rounded-lg hover:bg-primary-600 disabled:opacity-50"
                >
                  {createBookingMutation.isPending ? 'Confirmando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Success (handled by navigation) */}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
