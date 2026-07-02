// src/store/authStore.js
/**
 * Valtio-powered global authentication store.
 * Automatically hydrates from localStorage on module load.
 */
import { proxy } from 'valtio';

// ─── State ────────────────────────────────────────────────────────────────────
export const authStore = proxy({
  /** @type {object|null} Full user object (id, name, email, role) */
  user: null,
  /** @type {string|null} JWT token */
  token: null,
  /** @type {boolean} Whether a valid session exists */
  isAuthenticated: false,
});

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Sets authenticated state from a successful login.
 * @param {object} user  User profile object
 * @param {string} token JWT string
 */
export function setAuth(user, token) {
  authStore.user = user;
  authStore.token = token;
  authStore.isAuthenticated = true;
}

/**
 * Clears all auth state (used on logout or 401).
 */
export function clearAuth() {
  authStore.user = null;
  authStore.token = null;
  authStore.isAuthenticated = false;
}

// ─── Hydrate from localStorage ────────────────────────────────────────────────
// This runs once when the module is first imported, restoring
// the session across page refreshes.
(function hydrateFromStorage() {
  try {
    const token = localStorage.getItem('drevo_token');
    const raw = localStorage.getItem('drevo_user');

    if (token && raw) {
      const user = JSON.parse(raw);
      setAuth(user, token);
    }
  } catch (error) {
    // Corrupt localStorage — clear it
    localStorage.removeItem('drevo_token');
    localStorage.removeItem('drevo_user');
  }
})();
