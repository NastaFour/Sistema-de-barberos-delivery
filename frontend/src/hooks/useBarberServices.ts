import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { barberAPI } from '../lib/api';

export function useBarberProfile(barberId: string) {
  return useQuery({
    queryKey: ['barber-profile', barberId],
    queryFn: () => barberAPI.getById(barberId),
    enabled: !!barberId,
  });
}

export function useBarberServices(barberId: string) {
  // Obtenemos los servicios desde el perfil del barbero, ya que getById debería devolver el perfil con sus servicios
  const { data, isLoading, error } = useBarberProfile(barberId);
  const services = data?.data?.services || [];
  return { data: services, isLoading, error };
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ barberId, data }: { barberId: string; data: any }) =>
      barberAPI.createService(barberId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['barber-profile', variables.barberId] });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, data, barberId }: { serviceId: string; data: any; barberId: string }) =>
      barberAPI.updateService(serviceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['barber-profile', variables.barberId] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, barberId }: { serviceId: string; barberId: string }) =>
      barberAPI.deleteService(serviceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['barber-profile', variables.barberId] });
    },
  });
}

export function useUpdateBarberProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ barberId, data }: { barberId: string; data: any }) =>
      barberAPI.updateProfile(barberId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['barber-profile', variables.barberId] });
    },
  });
}

export function useUpdateBarberStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ barberId, isActive }: { barberId: string; isActive: boolean }) =>
      barberAPI.updateStatus(barberId, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['barber-profile', variables.barberId] });
    },
  });
}
