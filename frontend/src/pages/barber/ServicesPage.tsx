import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useBarberServices, useCreateService, useUpdateService, useDeleteService } from '../../hooks/useBarberServices';
import { ServiceCard } from '../../components/barber/ServiceCard';
import { BarberService } from '../../lib/types';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export function ServicesPage() {
  const { user } = useAuthStore();
  const barberId = user?.id || '';
  
  const { data: services, isLoading, error } = useBarberServices(barberId);
  const { mutate: createService, isPending: isCreating } = useCreateService();
  const { mutate: updateService, isPending: isUpdating } = useUpdateService();
  const { mutate: deleteService } = useDeleteService();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<BarberService | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({ name: '', description: '', price: '', duration: '30' });

  const handleOpenNew = () => {
    setEditingService(null);
    setFormData({ name: '', description: '', price: '', duration: '30' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service: BarberService) => {
    setEditingService(service);
    setFormData({ 
      name: service.name, 
      description: service.description || '', 
      price: service.price.toString(), 
      duration: service.duration.toString() 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration),
    };

    if (payload.price <= 0 || payload.duration < 15 || payload.name.length < 2) {
      toast.error('Por favor verifica los datos ingresados.');
      return;
    }

    if (editingService) {
      updateService({ serviceId: editingService.id, data: payload, barberId }, {
        onSuccess: () => {
          toast.success('Servicio actualizado');
          setIsModalOpen(false);
        }
      });
    } else {
      createService({ barberId, data: payload }, {
        onSuccess: () => {
          toast.success('Servicio creado');
          setIsModalOpen(false);
        }
      });
    }
  };

  const handleToggleActive = (serviceId: string, isActive: boolean) => {
    updateService({ serviceId, data: { isActive }, barberId }, {
      onSuccess: () => toast.success(isActive ? 'Servicio activado' : 'Servicio desactivado')
    });
  };

  const handleDelete = (service: BarberService) => {
    if (window.confirm(`¿Estás seguro de eliminar el servicio "${service.name}"?`)) {
      deleteService({ serviceId: service.id, barberId }, {
        onSuccess: () => toast.success('Servicio eliminado')
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Mis Servicios</h1>
          <p className="text-gray-400 mt-1">Gestiona los servicios y precios que ofreces.</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          Nuevo Servicio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services?.map((service: BarberService) => (
          <ServiceCard 
            key={service.id} 
            service={service} 
            onEdit={handleOpenEdit} 
            onDelete={handleDelete} 
            onToggleActive={handleToggleActive}
          />
        ))}
      </div>

      {services?.length === 0 && (
        <div className="text-center py-12 bg-dark-900 border border-dark-800 rounded-xl">
          <p className="text-gray-400 mb-4">No tienes servicios configurados aún.</p>
          <button 
            onClick={handleOpenNew}
            className="text-primary hover:underline"
          >
            Crear mi primer servicio
          </button>
        </div>
      )}

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-dark-900 border border-dark-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-dark-800 bg-dark-950">
              <h2 className="text-lg font-bold text-white">{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre del Servicio</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-dark-800 border border-dark-700 text-white rounded px-3 py-2 focus:border-primary outline-none"
                  required 
                  minLength={2}
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Descripción</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-dark-800 border border-dark-700 text-white rounded px-3 py-2 focus:border-primary outline-none resize-none"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Precio ($)</label>
                  <input 
                    type="number" 
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full bg-dark-800 border border-dark-700 text-white rounded px-3 py-2 focus:border-primary outline-none"
                    required 
                    min="1"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Duración (min)</label>
                  <select 
                    value={formData.duration}
                    onChange={e => setFormData({...formData, duration: e.target.value})}
                    className="w-full bg-dark-800 border border-dark-700 text-white rounded px-3 py-2 focus:border-primary outline-none"
                  >
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">1 hora</option>
                    <option value="90">1.5 horas</option>
                    <option value="120">2 horas</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 bg-dark-800 text-white rounded hover:bg-dark-700 transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isCreating || isUpdating}
                  className="flex-1 py-2 bg-primary text-white font-bold rounded hover:bg-primary-hover transition"
                >
                  {isCreating || isUpdating ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
