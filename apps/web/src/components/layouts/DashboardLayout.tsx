import { Calendar, Home, LogOut, Menu, Scissors, User, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { ConnectionStatusBadge } from "../ConnectionStatusBadge";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { name: "Inicio", href: "/", icon: Home, public: true },
    { name: "Barberos", href: "/barbers", icon: Scissors, public: true },
    ...(isAuthenticated
      ? [
          { name: "Mis Reservas", href: "/my-bookings", icon: Calendar, public: false },
          { name: "Perfil", href: "/profile", icon: User, public: false },
        ]
      : []),
    ...(user?.role === "ADMIN"
      ? [{ name: "Admin", href: "/admin", icon: User, public: false }]
      : []),
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-sticky bg-dark-950/80 backdrop-blur-xl border-b border-dark-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-display font-bold text-lg tracking-tight hidden sm:block">
                BarberGo
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-fast ${
                      isActive(item.href)
                        ? "bg-primary-500/10 text-primary-400"
                        : "text-dark-400 hover:text-white hover:bg-dark-800/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">
              <ConnectionStatusBadge />
              {isAuthenticated && user ? (
                <>
                  <Link to="/profile" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm transition-transform group-hover:scale-105">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <span className="text-dark-200 text-sm font-medium hidden lg:block">
                      {user.name}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-fast"
                    title="Cerrar sesion"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-dark-300 hover:text-white font-medium text-sm transition-colors"
                  >
                    Iniciar Sesion
                  </Link>
                  <Link to="/register" className="btn-primary text-sm py-2 px-4">
                    Registrarse
                  </Link>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-dark-800 bg-dark-950 animate-slide-down">
            <div className="px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-primary-500/10 text-primary-400"
                        : "text-dark-300 hover:text-white hover:bg-dark-800/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}

              <div className="pt-3 border-t border-dark-800 mt-3 flex items-center justify-between">
                <ConnectionStatusBadge />
                {isAuthenticated && user ? (
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 text-red-400 text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" /> Salir
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn-primary text-sm py-2 px-4"
                  >
                    Iniciar Sesion
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-dark-800/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="text-dark-400 font-display font-semibold text-sm">BarberGo</span>
          </div>
          <p className="text-dark-500 text-xs">Barberos a domicilio &middot; 2026</p>
        </div>
      </footer>
    </div>
  );
}
