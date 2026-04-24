import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ApiResponse, Barber, Booking, User, Review } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post<ApiResponse<{ user: User; token: string }>>('/auth/login', { email, password }),

  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    apiClient.post<ApiResponse<{ user: User; token: string }>>('/auth/register', {
      ...data,
      role: 'CLIENT',
    }),

  me: () => apiClient.get<ApiResponse<User>>('/auth/me'),
};

// ── Barbers ───────────────────────────────────────────
export interface BarbersFilter {
  lat?: number;
  lng?: number;
  radius?: number;
  specialty?: string;
  minRating?: number;
  page?: number;
  limit?: number;
}

export const barbersAPI = {
  getAll: (params: BarbersFilter) =>
    apiClient.get<ApiResponse<Barber[]>>('/barbers', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Barber>>(`/barbers/${id}`),

  getReviews: (id: string, page = 1) =>
    apiClient.get<ApiResponse<Review[]>>(`/barbers/${id}/reviews`, { params: { page, limit: 10 } }),

  getAvailableSlots: (barberId: string, date: string) =>
    apiClient.get<ApiResponse<string[]>>('/bookings/available-slots', {
      params: { barberId, date },
    }),
};

// ── Bookings ──────────────────────────────────────────
export interface CreateBookingData {
  barberId: string;
  scheduledAt: string;
  serviceIds: string[];
  address: string;
  latitude: number;
  longitude: number;
  notes?: string;
}

export const bookingsAPI = {
  create: (data: CreateBookingData) =>
    apiClient.post<ApiResponse<Booking>>('/bookings', data),

  getMine: (params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<Booking[]>>('/bookings/my', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Booking>>(`/bookings/${id}`),

  cancel: (id: string) =>
    apiClient.patch<ApiResponse<Booking>>(`/bookings/${id}/status`, { status: 'CANCELLED' }),
};

// ── Reviews ───────────────────────────────────────────
export const reviewsAPI = {
  create: (bookingId: string, data: { rating: number; comment?: string; images?: string[] }) =>
    apiClient.post<ApiResponse<Review>>(`/bookings/${bookingId}/review`, data),
};

// ── Geocoding (Mapbox) ────────────────────────────────
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

export async function geocodeAddress(
  query: string
): Promise<{ lat: number; lng: number; placeName: string }[] | null> {
  if (!MAPBOX_TOKEN || !query.trim()) return null;
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5&country=es,us,mx,co,ar`
    );
    const data = await res.json();
    if (!data.features?.length) return null;
    return data.features.map((f: { center: [number, number]; place_name: string }) => ({
      lat: f.center[1],
      lng: f.center[0],
      placeName: f.place_name,
    }));
  } catch {
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!MAPBOX_TOKEN) return null;
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    );
    const data = await res.json();
    return data.features?.[0]?.place_name ?? null;
  } catch {
    return null;
  }
}
