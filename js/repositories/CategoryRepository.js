/* ==========================================================================
   SEMS — Category Repository
   Sits between Services/UI and the Storage Adapter. Knows the collection
   name ("categories") and the Category model, but nothing about HOW data is
   physically stored — that's the adapter's job. Any future ExpenseService
   or IncomeService (Phase 5/6) will import this repository to look up
   categories, never touch storage directly.
   ========================================================================== */

import { createCategory, DEFAULT_CATEGORIES } from '../models/Category.js';

const COLLECTION = 'categories';

export class CategoryRepository {
  /**
   * @param {import('../storage/StorageAdapter.js').StorageAdapter} storageAdapter
   */
  constructor(storageAdapter) {
    if (!storageAdapter) {
      throw new TypeError('CategoryRepository requires a storageAdapter instance.');
    }
    this.storage = storageAdapter;
  }

  async getAll() {
    return this.storage.getAll(COLLECTION);
  }

  async getByType(type) {
    const all = await this.getAll();
    return all.filter((category) => category.type === type);
  }

  async getById(id) {
    return this.storage.getById(COLLECTION, id);
  }

  async create({ name, type, color, icon }) {
    const category = createCategory({ name, type, color, icon });
    return this.storage.create(COLLECTION, category);
  }

  async update(id, updates) {
    return this.storage.update(COLLECTION, id, updates);
  }

  async remove(id) {
    return this.storage.remove(COLLECTION, id);
  }

  /**
   * Seeds the default category set — but ONLY if no categories exist yet.
   * Safe to call on every app load; it's a no-op after the first run.
   * @returns {Promise<boolean>} true if seeding happened, false if skipped
   */
  async seedDefaults() {
    const existing = await this.getAll();
    if (existing.length > 0) return false;

    for (const defaults of DEFAULT_CATEGORIES) {
      const category = createCategory(defaults);
      await this.storage.create(COLLECTION, category);
    }
    return true;
  }
}

export default CategoryRepository;