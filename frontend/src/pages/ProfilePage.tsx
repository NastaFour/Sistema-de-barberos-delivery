import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { userAPI } from '../lib/api';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.profile?.bio || '',
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => userAPI.updateProfile(data),
    onSuccess: (response) => {
      if (response.success && response.data) {
        setUser(response.data);
        toast.success('Perfil actualizado correctamente');
        queryClient.invalidateQueries({ queryKey: ['user'] });
      } else {
        toast.error(response.error || 'Error al actualizar perfil');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar perfil');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-dark-950 pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-8">Mi Perfil</h1>

        <div className="bg-dark-900 rounded-lg p-8">
          {/* Avatar */}
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center text-4xl font-bold text-dark-950">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
              <p className="text-gray-400">{user?.role === 'BARBER' ? 'Barbero' : 'Cliente'}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-400 mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              {user?.role === 'BARBER' && (
                <div>
                  <label className="block text-gray-400 mb-2">Biografía</label>
                  <input
                    type="text"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="w-full bg-primary-500 text-dark-950 font-bold py-3 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </div>

        {/* Account Info */}
        <div className="bg-dark-900 rounded-lg p-8 mt-8">
          <h3 className="text-xl font-bold text-white mb-6">Información de Cuenta</h3>
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-dark-700">
              <span className="text-gray-400">ID de Usuario:</span>
              <span className="text-white font-mono text-sm">{user?.id}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-dark-700">
              <span className="text-gray-400">Rol:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                user?.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-500' :
                user?.role === 'BARBER' ? 'bg-blue-500/20 text-blue-500' :
                'bg-green-500/20 text-green-500'
              }`}>
                {user?.role}
              </span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-400">Fecha de Registro:</span>
              <span className="text-white">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
