import { CommentService } from '../../services/CommentService.js';
import { initThemeToggle } from '../components/ThemeToggle.js';
import { qs } from '../../core/utils.js';

function renderTestimonials(comments) {
  const container = qs('[data-testimonials]');
  if (!container) return;

  const testimonials = (comments || []).filter((c) => !c.isReply).slice(0, 4);

  if (!testimonials.length) {
    container.innerHTML = '<div class="card testimonial-card"><p class="testimonial-card__text">No testimonials yet. Be the first to share your experience!</p></div>';
    return;
  }

  container.innerHTML = testimonials.map(
    (t) => `
      <div class="card testimonial-card">
        <div class="testimonial-card__stars">★★★★★</div>
        <p class="testimonial-card__text">"${escapeHtml(t.text)}"</p>
        <div class="testimonial-card__footer">
          <div class="testimonial-card__avatar">${escapeHtml(t.author.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase())}</div>
          <div><strong>${escapeHtml(t.author)}</strong><span>Verified Student</span></div>
        </div>
      </div>
    `
  ).join('');
}

function showError(message) {
  const el = qs('[data-comment-error]');
  if (el) el.textContent = message || '';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderCommentList(comments) {
  const container = qs('[data-comment-list]');
  if (!container) return;

  if (!comments.length) {
    container.innerHTML = '<p class="text-muted">No feedback yet. Be the first to share your thoughts!</p>';
    return;
  }

  const isOwner = CommentService.isOwner();

  container.innerHTML = comments
    .map((c) => {
      const blockedBadge = isOwner && c.blocked
        ? '<span class="badge badge--danger">Blocked</span>'
        : '';
      const replyActions = isOwner
        ? `<button type="button" class="btn btn--sm btn--neutral" data-reply-to="${c.id}">Reply</button>
           <button type="button" class="btn btn--sm ${c.blocked ? 'btn--primary' : 'btn--neutral'}" data-block="${c.id}" data-current="${c.blocked ? 1 : 0}">${c.blocked ? 'Unblock' : 'Block'}</button>`
        : '';
      const replies = (c.replies || [])
        .filter((r) => !r.blocked || isOwner)
        .map((r) => `
          <div class="comment-reply">
            <div class="comment__meta"><strong>${escapeHtml(r.author)}</strong><span class="comment__role">Owner</span><span class="comment__time">${new Date(r.createdAt).toLocaleDateString()}</span></div>
            <p>${escapeHtml(r.text)}</p>
          </div>
        `).join('');

      return `
        <div class="card comment-item" data-comment-id="${c.id}">
          <div class="comment__header">
            <div class="comment__avatar">${escapeHtml(c.author.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase())}</div>
            <div class="comment__meta">
              <strong>${escapeHtml(c.author)}</strong>
              <span class="comment__time">${new Date(c.createdAt).toLocaleDateString()}</span>
              ${blockedBadge}
            </div>
          </div>
          <p class="comment__text">${escapeHtml(c.text)}</p>
          ${replies}
          <div class="comment__actions">${replyActions}</div>
          <div class="comment__reply-box" hidden>
            <form class="form" data-reply-form="${c.id}">
              <div class="form-group">
                <textarea name="reply" class="form-input" rows="2" maxlength="500" placeholder="Write your reply…" required></textarea>
              </div>
              <button type="submit" class="btn btn--sm btn--primary">Send Reply</button>
              <button type="button" class="btn btn--sm btn--neutral" data-cancel-reply="${c.id}">Cancel</button>
            </form>
          </div>
        </div>
      `;
    })
    .join('');

  container.querySelectorAll('[data-reply-to]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const box = container.querySelector(`[data-reply-form="${btn.dataset.replyTo}"]`).closest('.comment__reply-box');
      box.hidden = false;
    });
  });

  container.querySelectorAll('[data-cancel-reply]').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.closest('.comment__reply-box').hidden = true;
    });
  });

  container.querySelectorAll('[data-reply-form]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = form.reply.value.trim();
      const id = form.dataset.replyForm;
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      const result = await CommentService.reply(id, text);
      btn.disabled = false;
      if (!result.success) {
        showError(result.error);
        return;
      }
      form.reset();
      await loadComments();
    });
  });

  container.querySelectorAll('[data-block]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.block;
      const currentlyBlocked = btn.dataset.current === '1';
      const result = await CommentService.setBlocked(id, !currentlyBlocked);
      if (result.success) await loadComments();
      else showError(result.error);
    });
  });
}

async function handleCommentSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn = qs('[data-comment-submit]');
  const author = form.author.value.trim();
  const text = form.text.value.trim();

  showError('');
  btn.disabled = true;
  btn.textContent = 'Posting…';

  const result = await CommentService.post({ author, text });

  if (!result.success) {
    showError(result.error);
    btn.disabled = false;
    btn.textContent = 'Post Comment';
    return;
  }

  form.reset();
  btn.disabled = false;
  btn.textContent = 'Post Comment';
  await loadComments();
}

async function loadComments() {
  const container = qs('[data-comment-list]');
  const result = await CommentService.list();
  if (!result.success) {
    container.innerHTML = '<p class="text-muted">Could not load comments.</p>';
    return;
  }
  const comments = result.data.comments || [];
  renderCommentList(comments);
  renderTestimonials(comments);
}

function init() {
  initThemeToggle();
  const yearEl = qs('[data-year]');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const form = qs('[data-comment-form]');
  if (form) form.addEventListener('submit', handleCommentSubmit);

  loadComments();
}

document.addEventListener('DOMContentLoaded', init);