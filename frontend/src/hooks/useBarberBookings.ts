import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingAPI } from '../lib/api';

export function useBarberBookings(status?: string) {
  return useQuery({
    queryKey: ['barber-bookings', status],
    queryFn: () => bookingAPI.getMyBookings(status ? { status } : undefined),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      bookingAPI.updateStatus(id, status),
    onSuccess: () => {
      // Invalidar todas las queries de bookings para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['barber-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
