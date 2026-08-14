/* ==========================================================================
   SEMS — Expense Repository
   Same layered pattern as CategoryRepository/UserRepository: knows the
   "expenses" collection name, delegates all physical storage work to the
   injected StorageAdapter.
   ========================================================================== */

const COLLECTION = 'expenses';

import { parseLocalDate } from '../core/utils.js';

export class ExpenseRepository {
  /**
   * @param {import('../storage/StorageAdapter.js').StorageAdapter} storageAdapter
   */
  constructor(storageAdapter) {
    if (!storageAdapter) {
      throw new TypeError('ExpenseRepository requires a storageAdapter instance.');
    }
    this.storage = storageAdapter;
  }

  async getAll() {
    return this.storage.getAll(COLLECTION);
  }

  async getById(id) {
    return this.storage.getById(COLLECTION, id);
  }

  async create(expense) {
    return this.storage.create(COLLECTION, expense);
  }

  async update(id, updates) {
    return this.storage.update(COLLECTION, id, updates);
  }

  async remove(id) {
    return this.storage.remove(COLLECTION, id);
  }

  /**
   * Returns all expenses sorted newest-first by date.
   */
  async getSortedByDateDesc() {
    const all = await this.getAll();
    return [...all].sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date));
  }

  /**
   * Returns expenses that fall within the given calendar month.
   * @param {number} year
   * @param {number} monthIndex - 0-based (0 = January)
   */
  async getByMonth(year, monthIndex) {
    const all = await this.getAll();
    return all.filter((expense) => {
      const d = parseLocalDate(expense.date);
      return d.getFullYear() === year && d.getMonth() === monthIndex;
    });
  }
}

export default ExpenseRepository;