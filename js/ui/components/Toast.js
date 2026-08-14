/* ==========================================================================
   SEMS — Toast Component
   Lightweight, reusable "action confirmed" notifications. A single shared
   container is created once and reused for every toast, so multiple toasts
   stack cleanly instead of piling up in random positions.
   ========================================================================== */

let container = null;

function ensureContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  return container;
}

/**
 * @param {string} message
 * @param {Object} [options]
 * @param {'success'|'danger'|'info'} [options.type]
 * @param {number} [options.duration] - ms before auto-dismiss
 */
export function showToast(message, { type = 'success', duration = 3000 } = {}) {
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = message;

  const target = ensureContainer();
  target.appendChild(el);

  requestAnimationFrame(() => el.classList.add('toast--visible'));

  setTimeout(() => {
    el.classList.remove('toast--visible');
    setTimeout(() => el.remove(), 200);
  }, duration);
}

export default showToast;