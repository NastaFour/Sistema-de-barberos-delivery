import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  },
);

export const authAPI = {
  register: async (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: string;
  }) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },
};

export const barberAPI = {
  getAll: async (params?: {
    lat?: number | null;
    lng?: number | null;
    radius?: number;
    minRating?: number;
    specialty?: string;
  }) => {
    const response = await api.get("/barbers", { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/barbers/${id}`);
    return response.data;
  },

  updateProfile: async (id: string, data: unknown) => {
    const response = await api.put(`/barbers/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: string, isActive: boolean) => {
    const response = await api.patch(`/barbers/${id}/status`, { isActive });
    return response.data;
  },

  createService: async (id: string, data: unknown) => {
    const response = await api.post(`/barbers/${id}/services`, data);
    return response.data;
  },

  updateService: async (serviceId: string, data: unknown) => {
    const response = await api.put(`/barbers/services/${serviceId}`, data);
    return response.data;
  },

  deleteService: async (serviceId: string) => {
    const response = await api.delete(`/barbers/services/${serviceId}`);
    return response.data;
  },

  addGalleryImage: async (data: { imageUrl: string; caption?: string; order?: number }) => {
    const response = await api.post("/barbers/gallery", data);
    return response.data;
  },

  deleteGalleryImage: async (imageId: string) => {
    const response = await api.delete(`/barbers/gallery/${imageId}`);
    return response.data;
  },
};

export const bookingAPI = {
  create: async (data: {
    barberId: string;
    scheduledAt: string;
    serviceIds: string[];
    address: string;
    latitude: number;
    longitude: number;
    notes?: string;
  }) => {
    const response = await api.post("/bookings", data);
    return response.data;
  },

  getMyBookings: async (params?: { status?: string }) => {
    const response = await api.get("/bookings/my", { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/bookings/${id}/status`, { status });
    return response.data;
  },

  getAvailableSlots: async (barberId: string, date: string) => {
    const response = await api.get("/bookings/slots", { params: { barberId, date } });
    return response.data;
  },
};

export const userAPI = {
  getAll: async () => {
    const response = await api.get("/users");
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateProfile: async (
    id: string,
    data: { name?: string; email?: string; phone?: string; bio?: string },
  ) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

export const adminAPI = {
  getStats: async () => {
    const response = await api.get("/admin/stats");
    return response.data;
  },
};

export const reviewsAPI = {
  create: async (data: {
    bookingId: string;
    rating: number;
    comment?: string;
    images?: string[];
  }) => {
    const response = await api.post("/reviews", data);
    return response.data;
  },

  getByBarber: async (
    barberId: string,
    params?: { limit?: number; offset?: number; rating?: number },
  ) => {
    const response = await api.get(`/reviews/barber/${barberId}`, { params });
    return response.data;
  },

  getMyReviews: async () => {
    const response = await api.get("/reviews/my-reviews");
    return response.data;
  },
};

export default api;
