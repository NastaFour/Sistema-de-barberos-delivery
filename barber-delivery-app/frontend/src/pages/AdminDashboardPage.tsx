import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI, userAPI } from '../lib/api';
import toast from 'react-hot-toast';

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'barbers' | 'bookings' | 'stats'>('stats');
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminAPI.getStats(),
  });

  const { data: usersData } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => userAPI.getAll(),
    enabled: activeTab === 'users',
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => userAPI.delete(id),
    onSuccess: () => {
      toast.success('Usuario eliminado');
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar usuario');
    },
  });

  const handleDeleteUser = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      deleteUserMutation.mutate(id);
    }
  };

  const users = usersData?.data || [];
  const statsData = stats?.data || {};

  return (
    <div className="min-h-screen bg-dark-950 pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <h1 className="text-3xl font-bold text-white mb-8">Panel de Administración</h1>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-dark-700 mb-8 overflow-x-auto">
          {['stats', 'users', 'barbers', 'bookings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'stats' && 'Estadísticas'}
              {tab === 'users' && 'Usuarios'}
              {tab === 'barbers' && 'Barberos'}
              {tab === 'bookings' && 'Reservas'}
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-dark-900 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400">Total Usuarios</h3>
                <svg className="w-8 h-8 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-white">{statsData.totalUsers || 0}</p>
            </div>

            <div className="bg-dark-900 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400">Barberos Activos</h3>
                <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4.001z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-white">{statsData.totalBarbers || 0}</p>
            </div>

            <div className="bg-dark-900 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400">Reservas Totales</h3>
                <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-white">{statsData.totalBookings || 0}</p>
            </div>

            <div className="bg-dark-900 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400">Ingresos Totales</h3>
                <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-white">${statsData.totalRevenue || 0}</p>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-dark-900 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-dark-800">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">Nombre</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">Rol</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-dark-800/50">
                    <td className="px-6 py-4 text-white">{user.name}</td>
                    <td className="px-6 py-4 text-gray-400">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-500' :
                        user.role === 'BARBER' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-green-500/20 text-green-500'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-500 hover:text-red-400"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Barbers & Bookings tabs - Placeholder */}
        {(activeTab === 'barbers' || activeTab === 'bookings') && (
          <div className="bg-dark-900 rounded-lg p-12 text-center">
            <p className="text-gray-400">Funcionalidad en desarrollo...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
