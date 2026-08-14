/* ==========================================================================
   SEMS — Budget Repository
   Same layered pattern as the other repositories, pointed at the "budgets"
   collection. Adds month/year-aware lookups since budgets are always
   scoped to a specific month.
   ========================================================================== */

const COLLECTION = 'budgets';

export class BudgetRepository {
  /**
   * @param {import('../storage/StorageAdapter.js').StorageAdapter} storageAdapter
   */
  constructor(storageAdapter) {
    if (!storageAdapter) {
      throw new TypeError('BudgetRepository requires a storageAdapter instance.');
    }
    this.storage = storageAdapter;
  }

  async getAll() {
    return this.storage.getAll(COLLECTION);
  }

  async getById(id) {
    return this.storage.getById(COLLECTION, id);
  }

  async create(budget) {
    return this.storage.create(COLLECTION, budget);
  }

  async update(id, updates) {
    return this.storage.update(COLLECTION, id, updates);
  }

  async remove(id) {
    return this.storage.remove(COLLECTION, id);
  }

  async getForMonth(year, month) {
    const all = await this.getAll();
    return all.filter((b) => b.year === year && b.month === month);
  }

  async getOverallForMonth(year, month) {
    const forMonth = await this.getForMonth(year, month);
    return forMonth.find((b) => b.categoryId === null) || null;
  }

  async getByCategoryForMonth(categoryId, year, month) {
    const forMonth = await this.getForMonth(year, month);
    return forMonth.find((b) => b.categoryId === categoryId) || null;
  }
}

export default BudgetRepository;