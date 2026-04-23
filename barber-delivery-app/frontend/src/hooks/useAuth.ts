import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'CLIENT' | 'BARBER' | 'ADMIN';
  avatar?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  restoreSession: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email, password) => {
        try {
          const { data } = await api.post<{ 
            success: boolean; 
            data: { user: User; accessToken: string; refreshToken: string } 
          }>('/auth/login', { email, password });
          
          if (data.success) {
            set({
              user: data.data.user,
              accessToken: data.data.accessToken,
              refreshToken: data.data.refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });
            // Guardar tokens en headers de axios
            api.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`;
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        const { data: response } = await api.post<{ 
          success: boolean; 
          data: { user: User; accessToken: string; refreshToken: string } 
        }>('/auth/register', data);
        
        if (response.success) {
          set({
            user: response.data.user,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
        delete api.defaults.headers.common['Authorization'];
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },

      restoreSession: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          set({ isLoading: false });
          return;
        }

        try {
          const { data } = await api.post<{ 
            success: boolean; 
            data: { accessToken: string; user: User } 
          }>('/auth/refresh', { refreshToken });

          if (data.success) {
            set({
              accessToken: data.data.accessToken,
              user: data.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
            api.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`;
          } else {
            get().logout();
          }
        } catch (error) {
          get().logout();
        }
      },
    }),
    {
      name: 'barbergo-auth',
      partialize: (state) => ({ 
        refreshToken: state.refreshToken,
        user: state.user 
      }),
    }
  )
);
