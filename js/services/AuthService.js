/* ==========================================================================
   SEMS — Auth Service
   Talks to /api/auth/*, stores the JWT + user profile in localStorage under
   keys separate from the app's data (sems_token, sems_user). Every other
   frontend file that needs auth state imports THIS module.
   ========================================================================== */

import { CONFIG } from '../core/config.js';

const TOKEN_KEY = 'sems_token';
const USER_KEY = 'sems_user';

async function postAuth(path, body) {
  const res = await fetch(`${CONFIG.API.BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { success: false, errors: data.errors || { general: [data.error || 'Something went wrong.'] } };
  }
  return { success: true, data };
}

function persistSession(data) {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export const AuthService = {
  async register({ name, email, password }) {
    const result = await postAuth('/auth/register', { name, email, password });
    if (result.success) persistSession(result.data);
    return result;
  },

  async login({ email, password }) {
    const result = await postAuth('/auth/login', { email, password });
    if (result.success) persistSession(result.data);
    return result;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = 'login.html';
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getCurrentUser() {
    const raw = localStorage.getItem(USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return Boolean(this.getToken());
  },
};

export default AuthService;