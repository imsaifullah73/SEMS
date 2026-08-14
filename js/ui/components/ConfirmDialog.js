/* ==========================================================================
   SEMS — Confirm Dialog Component
   Replaces window.confirm() everywhere in the app with a styled, dark-mode
   aware modal that matches the rest of SEMS. Built on top of the existing
   Modal component (Phase 5) instead of duplicating overlay/escape/backdrop
   logic. Returns a Promise<boolean> so calling code stays simple:

     const confirmed = await confirmDialog({
       title: 'Delete this expense?',
       message: 'This cannot be undone.',
       confirmLabel: 'Delete',
       variant: 'danger',
     });
     if (!confirmed) return;
   ========================================================================== */

import { Modal } from './Modal.js';

/**
 * @param {Object} options
 * @param {string} [options.title]
 * @param {string} [options.message]
 * @param {string} [options.confirmLabel]
 * @param {string} [options.cancelLabel]
 * @param {'neutral'|'danger'} [options.variant]
 * @returns {Promise<boolean>} true if confirmed, false if cancelled/dismissed
 */
export function confirmDialog({
  title = 'Are you sure?',
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'neutral',
} = {}) {
  return new Promise((resolve) => {
    const body = document.createElement('div');
    body.className = 'confirm-dialog-body';
    body.innerHTML = `
      <div class="confirm-dialog-icon confirm-dialog-icon--${variant}">${variant === 'danger' ? '!' : 'i'}</div>
      <p class="confirm-dialog-message">${message}</p>
    `;

    const footer = document.createElement('div');
    footer.className = 'confirm-dialog-footer';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn--neutral';
    cancelBtn.textContent = cancelLabel;

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = variant === 'danger' ? 'btn btn--danger' : 'btn btn--primary';
    confirmBtn.textContent = confirmLabel;

    footer.append(cancelBtn, confirmBtn);

    // If the dialog is closed WITHOUT clicking Confirm (Escape, backdrop
    // click, × button, or Cancel), Modal's onClose fires and we resolve
    // false. If Confirm was clicked, resolve(true) already ran first —
    // a Promise only honors its first resolve() call, so this is safe.
    const modal = new Modal({
      title,
      bodyElement: body,
      footerElement: footer,
      onClose: () => resolve(false),
    });

    cancelBtn.addEventListener('click', () => modal.close());
    confirmBtn.addEventListener('click', () => {
      resolve(true);
      modal.close();
    });

    modal.open();
  });
}

export default confirmDialog;