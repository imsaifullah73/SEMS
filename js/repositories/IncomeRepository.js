/* ==========================================================================
   SEMS — Income Repository
   Mirrors ExpenseRepository exactly, pointed at the "income" collection.
   ========================================================================== */

const COLLECTION = 'income';

import { parseLocalDate } from '../core/utils.js';

export class IncomeRepository {
  /**
   * @param {import('../storage/StorageAdapter.js').StorageAdapter} storageAdapter
   */
  constructor(storageAdapter) {
    if (!storageAdapter) {
      throw new TypeError('IncomeRepository requires a storageAdapter instance.');
    }
    this.storage = storageAdapter;
  }

  async getAll() {
    return this.storage.getAll(COLLECTION);
  }

  async getById(id) {
    return this.storage.getById(COLLECTION, id);
  }

  async create(income) {
    return this.storage.create(COLLECTION, income);
  }

  async update(id, updates) {
    return this.storage.update(COLLECTION, id, updates);
  }

  async remove(id) {
    return this.storage.remove(COLLECTION, id);
  }

  async getSortedByDateDesc() {
    const all = await this.getAll();
    return [...all].sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date));
  }

  /**
   * @param {number} year
   * @param {number} monthIndex - 0-based (0 = January)
   */
  async getByMonth(year, monthIndex) {
    const all = await this.getAll();
    return all.filter((income) => {
      const d = parseLocalDate(income.date);
      return d.getFullYear() === year && d.getMonth() === monthIndex;
    });
  }
}

export default IncomeRepository;