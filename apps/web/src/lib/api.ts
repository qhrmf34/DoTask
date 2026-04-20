import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4200';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config ?? {};
    const isAuthRoute = original.url?.includes('/auth/login') || original.url?.includes('/auth/register');
    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          // bare axios — 인터셉터 없이 직접 호출해 무한루프 방지
          const refreshRes = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken });
          const { accessToken: newAccess, refreshToken: newRefresh } = refreshRes.data;
          useAuthStore.getState().setAccessToken(newAccess);
          useAuthStore.getState().setRefreshToken(newRefresh);
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${newAccess}`;
          return api(original);
        } catch {
          // refresh 실패 → 로그아웃
        }
      }
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
