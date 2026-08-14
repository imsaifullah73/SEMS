/* ==========================================================================
   SEMS — Auth Guard
   Shared helpers used by every protected page's controller: redirect to
   login if not authenticated, personalize the avatar with the user's
   initials, and wire the sidebar Logout button.
   ========================================================================== */

import { AuthService } from '../../services/AuthService.js';

export function requireAuth() {
  if (!AuthService.isAuthenticated()) {
    window.location.href = 'login.html';
    return null;
  }
  return AuthService.getCurrentUser();
}

export function renderUserAvatar(user) {
  const avatarEl = document.querySelector('[data-user-avatar]');
  if (!avatarEl || !user || !user.name) return;
  const initials = user.name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  avatarEl.textContent = initials;
  avatarEl.title = user.name;
}

export function wireLogoutButton() {
  const btn = document.querySelector('[data-action="logout"]');
  if (btn) btn.addEventListener('click', () => AuthService.logout());
}