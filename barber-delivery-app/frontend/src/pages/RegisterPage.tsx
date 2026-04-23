import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../lib/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'CLIENT' as 'CLIENT' | 'BARBER',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authAPI.register(formData);
      
      if (response.success) {
        toast.success('¡Cuenta creada exitosamente!');
        navigate('/login');
      } else {
        toast.error(response.message || 'Error al registrar');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">B</span>
            </div>
            <span className="text-white font-display font-bold text-2xl">BarberGo</span>
          </Link>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Crear Cuenta</h1>
          <p className="text-dark-400">Únete a BarberGo hoy mismo</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-dark-300 mb-2">Nombre</label>
              <input id="name" type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Tu nombre" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-2">Email</label>
              <input id="email" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" placeholder="tu@email.com" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-dark-300 mb-2">Teléfono</label>
              <input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-field" placeholder="+34 600 000 000" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark-300 mb-2">Contraseña</label>
              <input id="password" type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="input-field" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Tipo de cuenta</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setFormData({ ...formData, role: 'CLIENT' })} className={`p-3 rounded-lg border ${formData.role === 'CLIENT' ? 'border-primary-500 bg-primary-500/20 text-white' : 'border-dark-600 text-dark-400'}`}>Cliente</button>
                <button type="button" onClick={() => setFormData({ ...formData, role: 'BARBER' })} className={`p-3 rounded-lg border ${formData.role === 'BARBER' ? 'border-primary-500 bg-primary-500/20 text-white' : 'border-dark-600 text-dark-400'}`}>Barbero</button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full">{isLoading ? 'Creando cuenta...' : 'Registrarse'}</button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-dark-400">¿Ya tienes cuenta? <Link to="/login" className="text-primary-500 hover:text-primary-400 font-medium">Inicia sesión</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
