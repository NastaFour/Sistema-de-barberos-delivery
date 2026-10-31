import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { Navigate, Route, Routes } from "react-router-dom";
import { authAPI } from "./lib/api";
import { useAuthStore } from "./store/authStore";

// Layouts
import DashboardLayout from "./components/layouts/DashboardLayout";

import { BarberLayout } from "./components/layouts/BarberLayout";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import BarberDashboardPage from "./pages/BarberDashboardPage";
import BarberDetailPage from "./pages/BarberDetailPage";
import BarbersPage from "./pages/BarbersPage";
import BookingDetailPage from "./pages/BookingDetailPage";
import BookingPage from "./pages/BookingPage";
// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import { AgendaPage } from "./pages/barber/AgendaPage";
import { AvailabilityPage } from "./pages/barber/AvailabilityPage";
import { EarningsPage } from "./pages/barber/EarningsPage";
import { GalleryPage } from "./pages/barber/GalleryPage";
import { ServicesPage } from "./pages/barber/ServicesPage";
// Protected Route Component
const ProtectedRoute = ({
  children,
  allowedRoles,
}: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await authAPI.getMe();
        if (response.success) {
          setUser(response.data);
        }
      } catch {
        // Not logged in — cookie absent or expired
      }
      setIsLoading(false);
    };

    loadUser();
  }, [setUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1e293b",
            color: "#f1f5f9",
            border: "1px solid #334155",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/barbers" element={<BarbersPage />} />
        <Route path="/barbers/:id" element={<BarberDetailPage />} />

        {/* Protected Routes */}
        <Route
          path="/book"
          element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <MyBookingsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings/:id"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <BookingDetailPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ProfilePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <DashboardLayout>
                <AdminDashboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Barber Routes */}
        <Route
          path="/barber"
          element={
            <ProtectedRoute allowedRoles={["BARBER"]}>
              <BarberLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<BarberDashboardPage />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="availability" element={<AvailabilityPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="earnings" element={<EarningsPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
