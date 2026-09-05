'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { apiGet, apiPost } from '../lib/api';
import type { AuthResponse, AuthUser } from '../lib/api/types';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<AuthUser>;
  fetchProfile: () => Promise<AuthUser | null>;
  logout: () => void;
  clearError: () => void;
}

function extractAuth(res: AuthResponse): AuthUser {
  return res.user;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await apiPost<AuthResponse>('/api/auth/login', { email, password });
          const user = extractAuth(res);
          set({ token: res.accessToken, user, isLoading: false });
          return user;
        } catch (err) {
          set({ isLoading: false, error: (err as { message?: string }).message ?? 'Login failed' });
          throw err;
        }
      },

      register: async ({ name, email, password }) => {
        set({ isLoading: true, error: null });
        try {
          const res = await apiPost<AuthResponse>('/api/auth/register', {
            name,
            email,
            password,
          });
          const user = extractAuth(res);
          set({ token: res.accessToken, user, isLoading: false });
          return user;
        } catch (err) {
          set({ isLoading: false, error: (err as { message?: string }).message ?? 'Registration failed' });
          throw err;
        }
      },

      fetchProfile: async () => {
        const { token } = get();
        if (!token) return null;
        try {
          const user = await apiGet<AuthUser>('/api/auth/profile');
          set({ user });
          return user;
        } catch {
          return null;
        }
      },

      logout: () => {
        set({ token: null, user: null, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'mausamnet-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    },
  ),
);

export const useAuth = () => useAuthStore();