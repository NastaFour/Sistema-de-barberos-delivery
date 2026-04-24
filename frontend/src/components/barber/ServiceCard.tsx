import React from 'react';
import { BarberService } from '../../lib/types';
import { Card, CardContent } from '../ui/card'; // Asumiendo componentes UI
import { Button } from '../ui/button';
import { Clock, DollarSign, Edit, Trash2 } from 'lucide-react';

interface ServiceCardProps {
  service: BarberService;
  onEdit: (service: BarberService) => void;
  onDelete: (service: BarberService) => void;
  onToggleActive: (serviceId: string, isActive: boolean) => void;
}

export function ServiceCard({ service, onEdit, onDelete, onToggleActive }: ServiceCardProps) {
  // Manejo defensivo en caso de que sea un objeto plano (por si el mock no incluye .service)
  // El tipo BarberService de Prisma es el modelo de servicio.
  const name = service.name;
  const description = service.description;
  const duration = service.duration;
  const price = service.price;
  const isActive = service.isActive ?? true;

  return (
    <Card className={`border-dark-800 bg-dark-900 transition-opacity ${!isActive ? 'opacity-60' : ''}`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">{name}</h3>
            {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
          </div>
          {/* Mock toggle for tailwind since we might not have the shadcn switch fully implemented */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={isActive}
              onChange={(e) => onToggleActive(service.id, e.target.checked)}
            />
            <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-300 mb-6">
          <div className="flex items-center gap-1 bg-dark-800 px-2 py-1 rounded">
            <Clock className="w-4 h-4 text-primary" />
            <span>{duration} min</span>
          </div>
          <div className="flex items-center gap-1 bg-dark-800 px-2 py-1 rounded">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span>${price.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(service)}>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" size="sm" className="px-3" onClick={() => onDelete(service)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
