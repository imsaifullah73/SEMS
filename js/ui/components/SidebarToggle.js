/* ==========================================================================
   SEMS — Sidebar Toggle Accessibility Fix
   The hamburger is a <label for="sidebar-toggle"> so mouse clicks already
   toggle the hidden checkbox natively. Labels don't respond to Enter/Space
   on their own, so this adds keyboard support explicitly. Imported and
   called once by every page controller (Dashboard, Expenses, Income,
   Budget, Reports) since the sidebar shell appears on every page.
   ========================================================================== */

export function initSidebarToggle() {
  const checkbox = document.getElementById('sidebar-toggle');
  const label = document.querySelector('[data-sidebar-toggle-label]');
  if (!checkbox || !label) return;

  label.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      checkbox.checked = !checkbox.checked;
    }
  });
}

export default initSidebarToggle;