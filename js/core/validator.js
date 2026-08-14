/* ==========================================================================
   SEMS — Validation Utilities
   Reusable, framework-free validation functions. UI forms (Expense, Income,
   Budget, Auth — built in later phases) will import these instead of
   writing ad-hoc if-statements, so validation rules stay consistent across
   the whole app.
   ========================================================================== */

export const Validator = Object.freeze({
  isRequired(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  },

  isNumber(value) {
    return typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value);
  },

  isPositiveNumber(value) {
    return Validator.isNumber(value) && value > 0;
  },

  isNonNegativeNumber(value) {
    return Validator.isNumber(value) && value >= 0;
  },

  minLength(value, min) {
    return typeof value === 'string' && value.trim().length >= min;
  },

  maxLength(value, max) {
    return typeof value === 'string' && value.trim().length <= max;
  },

  isEmail(value) {
    if (typeof value !== 'string') return false;
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(value.trim());
  },

  isValidDate(value) {
    const date = value instanceof Date ? value : new Date(value);
    return date instanceof Date && !Number.isNaN(date.getTime());
  },

  isDateNotInFuture(value) {
    if (!Validator.isValidDate(value)) return false;
    const date = value instanceof Date ? value : new Date(value);
    return date.getTime() <= Date.now();
  },

  isOneOf(value, allowedValues = []) {
    return allowedValues.includes(value);
  },
});

/**
 * Runs an array of { test, message } rules against a value.
 * Returns { valid, errors }.
 *
 * Example (will be used by the Expense form in Phase 5):
 *   const result = validateField(amount, [
 *     { test: (v) => Validator.isRequired(v), message: 'Amount is required.' },
 *     { test: (v) => Validator.isPositiveNumber(v), message: 'Amount must be a positive number.' },
 *   ]);
 */
export function validateField(value, rules = []) {
  const errors = [];
  for (const rule of rules) {
    if (!rule.test(value)) {
      errors.push(rule.message);
    }
  }
  return { valid: errors.length === 0, errors };
}