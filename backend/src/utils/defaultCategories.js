/* ==========================================================================
   SEMS Backend — Default Categories List
   Shared list used by authController when a new user registers, so every
   new account starts with the same 10 categories the frontend uses.
   Extracted here (instead of living only in the old seed.js) so it's
   reusable and there's a single source of truth.
   ========================================================================== */

export const DEFAULT_CATEGORIES = [
  { name: 'Food', type: 'expense', color: '#D97706' },
  { name: 'Transport', type: 'expense', color: '#2563EB' },
  { name: 'Books & Fees', type: 'expense', color: '#2B3467' },
  { name: 'Rent', type: 'expense', color: '#DC2626' },
  { name: 'Entertainment', type: 'expense', color: '#D4A017' },
  { name: 'Other', type: 'expense', color: '#6B7280' },
  { name: 'Allowance', type: 'income', color: '#15803D' },
  { name: 'Scholarship', type: 'income', color: '#1F9D5C' },
  { name: 'Part-time Job', type: 'income', color: '#0F6B44' },
  { name: 'Other Income', type: 'income', color: '#6B7280' },
];