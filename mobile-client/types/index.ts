export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'CLIENT' | 'BARBER' | 'ADMIN';
  avatar?: string;
  createdAt: string;
}

export interface BarberProfile {
  id: string;
  userId: string;
  bio?: string;
  specialty: string[];
  specialties?: string[];
  experience?: number;
  yearsExperience?: number;
  isVerified: boolean;
  isActive: boolean;
  rating: number;
  totalReviews: number;
  latitude?: number;
  longitude?: number;
  serviceRadius: number;
  gallery: string[];
  avatar?: string;
}

export interface Barber {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'BARBER';
  avatar?: string;
  createdAt: string;
  profile?: BarberProfile;
  distance?: number;
  services?: BarberService[];
  reviews?: Review[];
}

export interface BarberService {
  id: string;
  barberId: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  isActive: boolean;
}

export interface BookingService {
  id: string;
  bookingId: string;
  serviceId: string;
  quantity: number;
  price: number;
  service: BarberService;
}

export interface Booking {
  id: string;
  clientId: string;
  barberId: string;
  status: BookingStatus;
  address: string;
  latitude: number;
  longitude: number;
  notes?: string;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  subtotal: number;
  serviceFee: number;
  total: number;
  client: User;
  barber: Barber;
  services: BookingService[];
  review?: Review;
}

export interface Review {
  id: string;
  bookingId: string;
  clientId: string;
  barberId: string;
  rating: number;
  comment?: string;
  images: string[];
  client: User;
  createdAt: string;
}

export interface GeocodingSuggestion {
  lat: number;
  lng: number;
  placeName: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
