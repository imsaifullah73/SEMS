/* ==========================================================================
   SEMS — Comment Service
   Talks to /api/comments. Visitors can post; the owner (logged in with
   imsaifullah73@gmail.com) can reply and manage blocking.
   ========================================================================== */

import { CONFIG } from '../core/config.js';
import { AuthService } from './AuthService.js';

const OWNER_EMAIL = 'imsaifullah73@gmail.com';

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = AuthService.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function request(method, path, body) {
  const res = await fetch(`${CONFIG.API.BASE_URL}/comments${path}`, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { success: false, error: data.error || 'Something went wrong.' };
  }
  return { success: true, data };
}

export const CommentService = {
  isOwner() {
    const user = AuthService.getCurrentUser();
    return Boolean(user && user.email === OWNER_EMAIL);
  },

  async list() {
    return request('GET', '/');
  },

  async post({ author, text }) {
    return request('POST', '/', { author, text });
  },

  async reply(commentId, text) {
    return request('POST', `/${commentId}/reply`, { text });
  },

  async setBlocked(commentId, blocked) {
    return request('PATCH', `/${commentId}/block`, { blocked });
  },
};

export default CommentService;