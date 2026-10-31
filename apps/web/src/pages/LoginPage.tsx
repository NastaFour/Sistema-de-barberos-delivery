import { Loader2, Lock, Mail, Scissors } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../lib/api";
import { useAuthStore } from "../store/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const loginRes = await authAPI.login(formData);
      if (loginRes.success) {
        const meRes = await authAPI.getMe();
        if (meRes.success) setUser(meRes.data);
        toast.success("Bienvenido de nuevo");
        const user = useAuthStore.getState().user;
        if (user?.role === "ADMIN") navigate("/admin");
        else if (user?.role === "BARBER") navigate("/barber");
        else navigate("/barbers");
      } else {
        toast.error(loginRes.message || "Error al iniciar sesion");
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
            : "Error al iniciar sesion";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />

      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-base">
        <div className="w-full max-w-md">
          {/* Brand */}
          <Link to="/" className="flex items-center justify-center gap-3 mb-10 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-display font-bold text-2xl tracking-tight">
              BarberGo
            </span>
          </Link>

          {/* Card */}
          <div className="glass rounded-3xl p-8 shadow-float animate-scale-in">
            <h1 className="text-2xl font-display font-bold text-white text-center mb-1">
              Iniciar Sesion
            </h1>
            <p className="text-dark-400 text-center text-sm mb-8">Bienvenido de vuelta</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field pl-10"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2"
                >
                  Contrasena
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field pl-10"
                    placeholder="********"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-white w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  "Iniciar Sesion"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-dark-400 text-sm">
                No tienes cuenta?{" "}
                <Link
                  to="/register"
                  className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
                >
                  Registrate
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
