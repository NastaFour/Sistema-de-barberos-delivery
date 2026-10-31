import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, LogOut, Mail, Phone, User } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../lib/api";
import { useAuthStore } from "../store/authStore";

const roleBadge: Record<string, string> = {
  ADMIN: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  BARBER: "bg-primary-500/15 text-primary-400 border-primary-500/30",
  CLIENT: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  BARBER: "Barbero",
  CLIENT: "Cliente",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    bio: user?.barberProfile?.bio || "",
  });

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => userAPI.updateProfile(user!.id, data),
    onSuccess: (response) => {
      if (response.success && response.data) {
        setUser(response.data);
        toast.success("Perfil actualizado");
        queryClient.invalidateQueries({ queryKey: ["user"] });
        setEditing(false);
      } else {
        toast.error(response.error || "Error al actualizar");
      }
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Error al actualizar");
    },
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-display font-bold text-white">Mi Perfil</h1>

      {/* Header card */}
      <div className="card-flat flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-3xl font-bold text-white shrink-0">
          {user.name?.charAt(0) || "U"}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-display font-bold text-white">{user.name}</h2>
          <div className="flex items-center gap-3 mt-1.5">
            <span className={`badge ${roleBadge[user.role] || ""}`}>
              {roleLabel[user.role] || user.role}
            </span>
            <span className="flex items-center gap-1 text-dark-400 text-sm">
              <Calendar className="w-3.5 h-3.5" />
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString("es") : "-"}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2.5 rounded-xl text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Cerrar sesion"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Edit form */}
      <div className="card-flat">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Informacion personal</h3>
          <button
            onClick={() => setEditing(!editing)}
            className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors"
          >
            {editing ? "Cancelar" : "Editar"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="flex items-center gap-2 text-dark-400 text-sm mb-2">
              <User className="w-4 h-4" /> Nombre
            </label>
            <input
              type="text"
              disabled={!editing}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-dark-400 text-sm mb-2">
              <Mail className="w-4 h-4" /> Email
            </label>
            <input
              type="email"
              disabled={!editing}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-dark-400 text-sm mb-2">
              <Phone className="w-4 h-4" /> Telefono
            </label>
            <input
              type="tel"
              disabled={!editing}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {user.role === "BARBER" && (
            <div className="md:col-span-2">
              <label className="text-dark-400 text-sm mb-2">Biografia</label>
              <input
                type="text"
                disabled={!editing}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Cuentanos sobre tu experiencia"
              />
            </div>
          )}
        </div>

        {editing && (
          <button
            onClick={() => mutation.mutate(formData)}
            disabled={mutation.isPending}
            className="btn-white mt-6 w-full"
          >
            {mutation.isPending ? "Guardando..." : "Guardar Cambios"}
          </button>
        )}
      </div>
    </div>
  );
}
