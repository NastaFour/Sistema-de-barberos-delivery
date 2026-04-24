import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StripeProvider } from '@stripe/stripe-react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000 },
  },
});

function AuthLoader({ children }: { children: React.ReactNode }) {
  const { setAuth, logout, setLoading, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        try {
          const res = await authAPI.me();
          if (res.data.success) {
            await setAuth(res.data.data, token);
          } else {
            await logout();
          }
        } catch {
          await logout();
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
      <AuthLoader>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#0a0a0a' },
            headerTintColor: '#fff',
            contentStyle: { backgroundColor: '#0a0a0a' },
            headerTitleStyle: { fontWeight: '700' },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ title: 'Iniciar sesión', headerShown: false }} />
          <Stack.Screen name="auth/register" options={{ title: 'Crear cuenta', headerShown: false }} />
          <Stack.Screen name="barber/[id]" options={{ title: 'Perfil del Barbero' }} />
          <Stack.Screen name="booking/checkout" options={{ title: 'Nueva Reserva' }} />
          <Stack.Screen name="booking/[id]" options={{ title: 'Detalle de Reserva' }} />
          <Stack.Screen name="review/[bookingId]" options={{ title: 'Dejar Reseña' }} />
        </Stack>
      </AuthLoader>
    </QueryClientProvider>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
});
