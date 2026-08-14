/* ==========================================================================
   SEMS — Storage Adapter Contract
   This is the abstract base every storage adapter must implement:
   LocalStorageAdapter now, ApiAdapter later (Phase 15). Repositories only
   ever call these method names — never a specific adapter's internals —
   which is what lets us swap localStorage for a real backend later with
   ZERO changes to repository or UI code.

   Every method below is intentionally async (returns a Promise), even
   though LocalStorageAdapter's work is synchronous under the hood. This
   keeps the contract identical to what ApiAdapter will need (real network
   calls are always async), so repositories never need to change their
   calling code when the swap happens.
   ========================================================================== */

export class StorageAdapter {
  /**
   * @param {string} collection - e.g. "categories", "expenses", "income"
   * @returns {Promise<Array<Object>>}
   */
  async getAll(collection) {
    throw new Error(`StorageAdapter.getAll() not implemented for collection "${collection}".`);
  }

  /**
   * @param {string} collection
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getById(collection, id) {
    throw new Error(`StorageAdapter.getById() not implemented for collection "${collection}".`);
  }

  /**
   * @param {string} collection
   * @param {Object} item - must already include an "id" field
   * @returns {Promise<Object>} the created item
   */
  async create(collection, item) {
    throw new Error(`StorageAdapter.create() not implemented for collection "${collection}".`);
  }

  /**
   * @param {string} collection
   * @param {string} id
   * @param {Object} updates - partial fields to merge into the existing item
   * @returns {Promise<Object|null>} the updated item, or null if not found
   */
  async update(collection, id, updates) {
    throw new Error(`StorageAdapter.update() not implemented for collection "${collection}".`);
  }

  /**
   * @param {string} collection
   * @param {string} id
   * @returns {Promise<boolean>} true if something was removed
   */
  async remove(collection, id) {
    throw new Error(`StorageAdapter.remove() not implemented for collection "${collection}".`);
  }

  /**
   * @param {string} collection
   * @returns {Promise<void>}
   */
  async clear(collection) {
    throw new Error(`StorageAdapter.clear() not implemented for collection "${collection}".`);
  }
}

export default StorageAdapter;