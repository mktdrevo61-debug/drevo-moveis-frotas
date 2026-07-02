// src/services/api.js
/**
 * Axios instance for all API calls.
 * - Base URL: /api  (proxied to localhost:3001 by Vite dev server)
 * - Request interceptor: injects Bearer token from localStorage
 * - Response interceptor: handles 401 by clearing session and redirecting to /login
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('drevo_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  // Pass through successful responses
  (response) => response,

  // Handle errors globally
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token expired or invalid — clear session and force re-login
      localStorage.removeItem('drevo_token');
      localStorage.removeItem('drevo_user');
      // Use window.location for a hard redirect (clears React state as well)
      window.location.replace('/login');
      return Promise.reject(new Error('Sessão expirada. Faça login novamente.'));
    }

    // Surface the backend error message if available
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Erro inesperado. Tente novamente.';

    return Promise.reject(new Error(message));
  },
);

export default api;
