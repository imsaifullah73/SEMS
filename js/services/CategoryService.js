/* ==========================================================================
   SEMS — Category Service
   Business logic for managing a user's income/expense categories. Sits
   between the Categories page and the CategoryRepository, validating every
   create/update and returning { success, errors } style results so the UI
   can render per-field errors without duplicating rules. Mirrors the
   BudgetService pattern used elsewhere in the app.
   ========================================================================== */

import { Validator } from '../core/validator.js';
import { eventBus } from '../core/eventBus.js';

const COLOR_PRESETS = ['#6B7280', '#DC2626', '#D97706', '#15803D', '#2563EB', '#7C3AED', '#0D9488', '#D4A017'];

export class CategoryService {
  /**
   * @param {import('../repositories/CategoryRepository.js').CategoryRepository} categoryRepository
   */
  constructor(categoryRepository) {
    if (!categoryRepository) {
      throw new TypeError('CategoryService requires a categoryRepository instance.');
    }
    this.categoryRepository = categoryRepository;
  }

  get colorPresets() {
    return COLOR_PRESETS;
  }

  validateName(name) {
    if (!Validator.isRequired(name)) {
      return { valid: false, errors: ['Name is required.'] };
    }
    if (!Validator.maxLength(name, 40)) {
      return { valid: false, errors: ['Name must be 40 characters or fewer.'] };
    }
    return { valid: true, errors: [] };
  }

  validateType(type) {
    if (!Validator.isOneOf(type, ['expense', 'income'])) {
      return { valid: false, errors: ['Type must be either "expense" or "income".'] };
    }
    return { valid: true, errors: [] };
  }

  async getAll() {
    return this.categoryRepository.getAll();
  }

  async getByType(type) {
    return this.categoryRepository.getByType(type);
  }

  async create({ name, type, color }) {
    const nameCheck = this.validateName(name);
    const typeCheck = this.validateType(type);
    const errors = {};

    if (!nameCheck.valid) errors.name = nameCheck.errors;
    if (!typeCheck.valid) errors.type = typeCheck.errors;
    if (Object.keys(errors).length > 0) return { success: false, errors };

    const created = await this.categoryRepository.create({
      name: name.trim(),
      type,
      color: color || COLOR_PRESETS[0],
    });

    eventBus.emit('category:updated', created);
    return { success: true, data: created };
  }

  async update(id, { name, type, color }) {
    const updates = {};

    if (name !== undefined) {
      const nameCheck = this.validateName(name);
      if (!nameCheck.valid) return { success: false, errors: { name: nameCheck.errors } };
      updates.name = name.trim();
    }
    if (type !== undefined) {
      const typeCheck = this.validateType(type);
      if (!typeCheck.valid) return { success: false, errors: { type: typeCheck.errors } };
      updates.type = type;
    }
    if (color !== undefined) updates.color = color;

    if (Object.keys(updates).length === 0) {
      return { success: false, errors: { name: ['Nothing to update.'] } };
    }

    const updated = await this.categoryRepository.update(id, updates);
    if (!updated) return { success: false, errors: { _form: ['Category not found.'] } };

    eventBus.emit('category:updated', updated);
    return { success: true, data: updated };
  }

  async remove(id) {
    const removed = await this.categoryRepository.remove(id);
    if (removed) eventBus.emit('category:updated', { id, removed: true });
    return removed;
  }
}

export default CategoryService;