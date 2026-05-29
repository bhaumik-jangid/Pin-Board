import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

/*
  In production (Docker): window.location.origin = http://localhost
  NGINX routes /api/* to the correct service.
  In dev: Vite proxy handles /api/* → localhost:3001/3002
  Both cases: baseURL = '/api' works correctly.
*/
export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url      = error.config?.url ?? '';
    const hasToken = !!useAuthStore.getState().token;
    const isAuth   = url.includes('/auth/login') ||
                     url.includes('/auth/register') ||
                     url.includes('/auth/me');

    if (error.response?.status === 401 && hasToken && !isAuth) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};
