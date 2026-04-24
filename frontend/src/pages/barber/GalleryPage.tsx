import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useBarberProfile } from '../../hooks/useBarberServices';
import { Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function GalleryPage() {
  const { user } = useAuthStore();
  const barberId = user?.id || '';
  
  const { data: profileResponse, isLoading } = useBarberProfile(barberId);
  const gallery = profileResponse?.data?.gallery || [];

  const handleUploadFake = () => {
    toast.error("La subida real requiere integración con S3 o Cloudinary.");
  };

  const handleDeleteFake = () => {
    toast.success("Imagen eliminada (simulado).");
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
          <h1 className="text-3xl font-bold text-white">Galería de Trabajos</h1>
          <p className="text-gray-400 mt-1">Muestra tus mejores cortes para atraer clientes.</p>
        </div>
        <button 
          onClick={handleUploadFake}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
        >
          <Upload className="w-5 h-5" />
          Subir Foto
        </button>
      </div>

      {gallery.length === 0 ? (
        <div className="text-center py-20 bg-dark-900 border border-dark-800 rounded-xl">
          <ImageIcon className="w-16 h-16 text-dark-700 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Tu galería está vacía</h2>
          <p className="text-gray-400">Sube fotos de tus trabajos para mejorar tu perfil.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gallery.map((img: any, idx: number) => (
            <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden bg-dark-800 border border-dark-700">
              <img src={img} alt={`Trabajo ${idx}`} className="w-full h-full object-cover transition duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={handleDeleteFake} className="p-3 bg-red-500 rounded-full text-white hover:bg-red-600 transition">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
