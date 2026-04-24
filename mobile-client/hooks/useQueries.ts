import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { barbersAPI, bookingsAPI, reviewsAPI, CreateBookingData, BarbersFilter } from '../services/api';

// ── Barbers ───────────────────────────────────────────
export function useBarbers(filters: BarbersFilter) {
  return useQuery({
    queryKey: ['barbers', filters],
    queryFn: () => barbersAPI.getAll(filters),
    select: (res) => res.data.data,
    staleTime: 60_000,
  });
}

export function useBarber(id: string) {
  return useQuery({
    queryKey: ['barber', id],
    queryFn: () => barbersAPI.getById(id),
    select: (res) => res.data.data,
    enabled: !!id,
  });
}

export function useBarberReviews(id: string, page = 1) {
  return useQuery({
    queryKey: ['barber-reviews', id, page],
    queryFn: () => barbersAPI.getReviews(id, page),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useAvailableSlots(barberId: string, date: string) {
  return useQuery({
    queryKey: ['slots', barberId, date],
    queryFn: () => barbersAPI.getAvailableSlots(barberId, date),
    select: (res) => res.data.data,
    enabled: !!barberId && !!date,
  });
}

// ── Bookings ──────────────────────────────────────────
export function useMyBookings(status?: string) {
  return useQuery({
    queryKey: ['my-bookings', status],
    queryFn: () => bookingsAPI.getMine({ status }),
    select: (res) => res.data.data,
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsAPI.getById(id),
    select: (res) => res.data.data,
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status as string | undefined;
      return status === 'CONFIRMED' || status === 'IN_PROGRESS' ? 5000 : false;
    },
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBookingData) => bookingsAPI.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-bookings'] }),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingsAPI.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-bookings'] }),
  });
}

// ── Reviews ───────────────────────────────────────────
export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: { rating: number; comment?: string; images?: string[] } }) =>
      reviewsAPI.create(bookingId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
      qc.invalidateQueries({ queryKey: ['booking'] });
    },
  });
}
