import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
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
    if (
      error.response?.status === 401 &&
      !original?._retry &&
      !String(original?.url || '').includes('/auth/refresh')
    ) {
      original._retry = true;
      try {
        const refreshRes = await api.post('/auth/refresh');
        const newToken = refreshRes.data?.accessToken as string | undefined;

        if (newToken) {
          useAuthStore.getState().setAccessToken(newToken);
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${newToken}`;
        }

        return api(original);
      } catch {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
