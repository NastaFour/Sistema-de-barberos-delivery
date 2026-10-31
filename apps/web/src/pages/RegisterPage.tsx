import { Loader2, Lock, Mail, Phone, Scissors, User } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../lib/api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "CLIENT" as "CLIENT" | "BARBER",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await authAPI.register(formData);
      if (response.success) {
        toast.success("Cuenta creada exitosamente");
        navigate("/login");
      } else {
        toast.error(response.message || "Error al registrar");
      }
    } catch (error: unknown) {
      const msg =
        error instanceof Error &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message ===
          "string"
          ? (error as { response: { data: { message: string } } }).response.data.message
          : error instanceof Error
            ? error.message
            : "Error al registrar";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />

      <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-base">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center justify-center gap-3 mb-8 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-display font-bold text-2xl tracking-tight">
              BarberGo
            </span>
          </Link>

          <div className="glass rounded-3xl p-8 shadow-float animate-scale-in">
            <h1 className="text-2xl font-display font-bold text-white text-center mb-1">
              Crear Cuenta
            </h1>
            <p className="text-dark-400 text-center text-sm mb-8">Unete a BarberGo</p>

            {/* Role toggle */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "CLIENT" })}
                className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all duration-fast ${
                  formData.role === "CLIENT"
                    ? "border-primary-500 bg-primary-500/10 text-white"
                    : "border-dark-700 text-dark-400 hover:border-dark-600"
                }`}
              >
                Cliente
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "BARBER" })}
                className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all duration-fast ${
                  formData.role === "BARBER"
                    ? "border-primary-500 bg-primary-500/10 text-white"
                    : "border-dark-700 text-dark-400 hover:border-dark-600"
                }`}
              >
                Barbero
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field pl-10"
                  placeholder="Nombre completo"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field pl-10"
                  placeholder="Email"
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field pl-10"
                  placeholder="Telefono (opcional)"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field pl-10"
                  placeholder="Contrasena"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-white w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Creando...
                  </>
                ) : (
                  "Registrarse"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-dark-400 text-sm">
                Ya tenes cuenta?{" "}
                <Link
                  to="/login"
                  className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
                >
                  Inicia sesion
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
