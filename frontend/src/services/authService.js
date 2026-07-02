// src/services/authService.js
/**
 * Authentication service — wraps all auth-related API calls.
 * Persists token and user data in localStorage under namespaced keys.
 */
import api from './api.js';
import { setAuth, clearAuth } from '../store/authStore.js';

const TOKEN_KEY = 'drevo_token';
const USER_KEY = 'drevo_user';

// ─── login ─────────────────────────────────────────────────────────────────
/**
 * Authenticates user and persists session.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });

  const { token, user } = data.data;

  // Persist to localStorage
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  // Update Valtio store
  setAuth(user, token);

  return { user, token };
}

// ─── logout ─────────────────────────────────────────────────────────────────
/**
 * Clears session from localStorage and Valtio store.
 */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearAuth();
}

// ─── getCurrentUser ──────────────────────────────────────────────────────────
/**
 * Returns the currently authenticated user from localStorage, or null.
 * @returns {object|null}
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── isAuthenticated ─────────────────────────────────────────────────────────
/**
 * Returns true if a token exists in localStorage.
 * @returns {boolean}
 */
export function isAuthenticated() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

// ─── getToken ─────────────────────────────────────────────────────────────────
/**
 * Returns the raw JWT token string or null.
 * @returns {string|null}
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
