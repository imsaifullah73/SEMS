/* ==========================================================================
   SEMS — Modal Component
   A reusable, dependency-free modal dialog. Phase 11 adds a proper focus
   trap: while the modal is open, Tab/Shift+Tab cycle only through elements
   inside the dialog, so keyboard/screen-reader users can never accidentally
   tab into the background page behind the modal.
   ========================================================================== */

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export class Modal {
  constructor({ title = '', bodyElement = null, footerElement = null, onClose = null } = {}) {
    this.title = title;
    this.bodyElement = bodyElement;
    this.footerElement = footerElement;
    this.onClose = onClose;
    this._handleKeydown = this._handleKeydown.bind(this);
    this._build();
  }

  _build() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    this.dialog = document.createElement('div');
    this.dialog.className = 'modal-dialog';
    this.dialog.setAttribute('role', 'dialog');
    this.dialog.setAttribute('aria-modal', 'true');
    if (this.title) this.dialog.setAttribute('aria-label', this.title);

    const header = document.createElement('div');
    header.className = 'modal-header';

    const titleEl = document.createElement('h3');
    titleEl.className = 'modal-title';
    titleEl.textContent = this.title;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'modal-close-btn';
    closeBtn.setAttribute('aria-label', 'Close dialog');
    closeBtn.textContent = '\u00D7'; // ×
    closeBtn.addEventListener('click', () => this.close());

    header.append(titleEl, closeBtn);

    const body = document.createElement('div');
    body.className = 'modal-body';
    if (this.bodyElement) body.appendChild(this.bodyElement);

    this.dialog.appendChild(header);
    this.dialog.appendChild(body);

    if (this.footerElement) {
      const footer = document.createElement('div');
      footer.className = 'modal-footer';
      footer.appendChild(this.footerElement);
      this.dialog.appendChild(footer);
    }

    this.overlay.appendChild(this.dialog);
  }

  open() {
    document.body.appendChild(this.overlay);
    document.addEventListener('keydown', this._handleKeydown);
    document.body.style.overflow = 'hidden';

    const focusable = this.dialog.querySelector(FOCUSABLE_SELECTOR);
    if (focusable) focusable.focus();
  }

  close() {
    if (this.overlay.isConnected) {
      this.overlay.remove();
    }
    document.removeEventListener('keydown', this._handleKeydown);
    document.body.style.overflow = '';
    if (typeof this.onClose === 'function') this.onClose();
  }

  _handleKeydown(e) {
    if (e.key === 'Escape') {
      this.close();
      return;
    }
    if (e.key === 'Tab') {
      this._trapFocus(e);
    }
  }

  /**
   * Keeps Tab/Shift+Tab cycling within the dialog only, so keyboard focus
   * can never escape into the page behind the modal while it's open.
   */
  _trapFocus(e) {
    const focusables = Array.from(this.dialog.querySelectorAll(FOCUSABLE_SELECTOR));
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

export default Modal;