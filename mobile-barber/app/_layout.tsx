import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { socketService } from '../services/socket';
import '../services/locationTask';

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
          if (res.data.success && res.data.data.role === 'BARBER') {
            await setAuth(res.data.data, token);
            await socketService.connect();
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
        </Stack>
      </AuthLoader>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
});
