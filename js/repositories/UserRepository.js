/* ==========================================================================
   SEMS — User Repository
   Same pattern as CategoryRepository. No authentication logic here — that
   belongs to AuthService, which doesn't exist until Phase 14. This
   repository only knows how to store/retrieve User records.
   ========================================================================== */

import { createUser } from '../models/User.js';

const COLLECTION = 'users';

export class UserRepository {
  /**
   * @param {import('../storage/StorageAdapter.js').StorageAdapter} storageAdapter
   */
  constructor(storageAdapter) {
    if (!storageAdapter) {
      throw new TypeError('UserRepository requires a storageAdapter instance.');
    }
    this.storage = storageAdapter;
  }

  async getAll() {
    return this.storage.getAll(COLLECTION);
  }

  async getById(id) {
    return this.storage.getById(COLLECTION, id);
  }

  async create({ name, email }) {
    const user = createUser({ name, email });
    return this.storage.create(COLLECTION, user);
  }

  async update(id, updates) {
    return this.storage.update(COLLECTION, id, updates);
  }

  async remove(id) {
    return this.storage.remove(COLLECTION, id);
  }
}

export default UserRepository;