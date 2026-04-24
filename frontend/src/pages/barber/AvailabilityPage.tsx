import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useBarberProfile, useUpdateBarberProfile } from '../../hooks/useBarberServices';
import { TimeSlotPicker } from '../../components/barber/TimeSlotPicker';
import toast from 'react-hot-toast';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function AvailabilityPage() {
  const { user } = useAuthStore();
  const barberId = user?.id || '';

  const { data: profileResponse, isLoading } = useBarberProfile(barberId);
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateBarberProfile();

  const [availability, setAvailability] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  // Cargar estado inicial
  useEffect(() => {
    if (profileResponse?.data?.availability) {
      setAvailability(profileResponse.data.availability);
    } else {
      // Default template
      const defaultAvail: Record<string, any> = {};
      DAYS.forEach(day => {
        defaultAvail[day] = { start: '09:00', end: '18:00' };
      });
      setAvailability(defaultAvail);
    }
  }, [profileResponse]);

  const handleToggleActive = (day: string, isActive: boolean) => {
    setAvailability(prev => ({
      ...prev,
      [day]: isActive ? { start: '09:00', end: '18:00' } : null
    }));
  };

  const handleChangeTime = (day: string, field: 'start' | 'end', value: string) => {
    setAvailability(prev => {
      const current = prev[day] || { start: '09:00', end: '18:00' };
      return {
        ...prev,
        [day]: { ...current, [field]: value }
      };
    });
  };

  const validateTimes = () => {
    for (const day of DAYS) {
      const slot = availability[day];
      if (slot) {
        if (slot.start >= slot.end) {
          setError(`Error en ${day}: La hora de inicio debe ser anterior a la hora de fin.`);
          return false;
        }
      }
    }
    setError(null);
    return true;
  };

  const handleSave = () => {
    if (!validateTimes()) return;

    updateProfile({ barberId, data: { availability } }, {
      onSuccess: () => toast.success('Horarios guardados correctamente')
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Disponibilidad</h1>
          <p className="text-gray-400 mt-1">Configura tus horarios de trabajo habituales.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isUpdating}
          className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg font-bold transition disabled:opacity-50"
        >
          {isUpdating ? 'Guardando...' : 'Guardar Horarios'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden shadow-lg">
        {DAYS.map(day => (
          <TimeSlotPicker
            key={day}
            day={day}
            isActive={availability[day] !== null && availability[day] !== undefined}
            slots={availability[day]}
            onToggleActive={handleToggleActive}
            onChangeTime={handleChangeTime}
          />
        ))}
      </div>

      <div className="bg-dark-800/50 p-4 rounded-lg text-sm text-gray-400">
        <p>💡 <strong>Tip:</strong> Si desmarcas un día completo, los clientes no podrán hacer reservas para ese día de la semana. Guarda los cambios para que se apliquen en tu perfil público.</p>
      </div>
    </div>
  );
}
