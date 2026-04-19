import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  profileImage?: string;
  bio?: string;
  role: string;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  setUser: (user: UserProfile | null) => void;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'dotask-auth', partialize: (s) => ({ user: s.user, accessToken: s.accessToken }) },
  ),
);
