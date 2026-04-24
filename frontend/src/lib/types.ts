export interface Barber extends User {
  profile?: BarberProfile;
  distance?: number;
  services?: BarberService[];
  reviews?: any[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'CLIENT' | 'BARBER' | 'ADMIN';
  avatar?: string;
  createdAt: string;
  barberProfile?: BarberProfile;
}

export interface BarberProfile {
  id: string;
  userId: string;
  bio?: string;
  specialty: string[];
  yearsExperience?: number;
  isVerified: boolean;
  isActive: boolean;
  rating: number;
  totalReviews: number;
  latitude?: number;
  longitude?: number;
  serviceRadius: number;
  user: User;
  services: BarberService[];
  gallery: string[];
  experience?: number;
  specialties?: string[];
  avatar?: string;
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
  barber: BarberProfile & { user: User };
  services: BookingService[];
  review?: Review;
}

export interface BookingService {
  id: string;
  bookingId: string;
  serviceId: string;
  quantity: number;
  price: number;
  service: BarberService;
}

export type BookingStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface Review {
  id: string;
  bookingId: string;
  clientId: string;
  barberId: string;
  rating: number;
  comment?: string;
  images: string[];
  client: User;
  booking: Pick<Booking, 'id' | 'scheduledAt'>;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
