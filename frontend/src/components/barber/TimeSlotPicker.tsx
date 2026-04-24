import React from 'react';

interface TimeSlot {
  start: string;
  end: string;
}

interface TimeSlotPickerProps {
  day: string;
  isActive: boolean;
  slots: TimeSlot | null;
  onToggleActive: (day: string, isActive: boolean) => void;
  onChangeTime: (day: string, field: 'start' | 'end', value: string) => void;
}

const dayNames: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

export function TimeSlotPicker({ day, isActive, slots, onToggleActive, onChangeTime }: TimeSlotPickerProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-dark-800 bg-dark-900 last:border-b-0">
      <div className="flex items-center gap-4 w-1/3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={isActive}
            onChange={(e) => onToggleActive(day, e.target.checked)}
          />
          <div className="w-11 h-6 bg-dark-700 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
        <span className="text-white font-medium capitalize">{dayNames[day] || day}</span>
      </div>

      <div className="flex-1 flex items-center justify-end gap-4">
        {isActive && slots ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">De</span>
              <input
                type="time"
                value={slots.start}
                onChange={(e) => onChangeTime(day, 'start', e.target.value)}
                className="bg-dark-800 border border-dark-700 text-white text-sm rounded px-3 py-1.5 focus:border-primary outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Hasta</span>
              <input
                type="time"
                value={slots.end}
                onChange={(e) => onChangeTime(day, 'end', e.target.value)}
                className="bg-dark-800 border border-dark-700 text-white text-sm rounded px-3 py-1.5 focus:border-primary outline-none"
              />
            </div>
          </>
        ) : (
          <span className="text-sm text-gray-500 italic">No disponible</span>
        )}
      </div>
    </div>
  );
}
