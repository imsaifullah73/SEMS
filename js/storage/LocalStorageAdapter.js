/* ==========================================================================
   SEMS — Local Storage Adapter
   Concrete implementation of StorageAdapter backed by the browser's
   localStorage. Each "collection" (e.g. "categories") is stored as a single
   JSON array under the key `${CONFIG.STORAGE_PREFIX}${collection}`.

   This is the ONLY file in the entire app that touches window.localStorage
   directly. Repositories never do — they always go through this adapter.
   ========================================================================== */

import { StorageAdapter } from './StorageAdapter.js';
import { CONFIG } from '../core/config.js';
import { deepClone, log } from '../core/utils.js';

export class LocalStorageAdapter extends StorageAdapter {
  _key(collection) {
    return `${CONFIG.STORAGE_PREFIX}${collection}`;
  }

  _readCollection(collection) {
    try {
      const raw = window.localStorage.getItem(this._key(collection));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error(`LocalStorageAdapter: failed to read "${collection}".`, error);
      return [];
    }
  }

  _writeCollection(collection, items) {
    try {
      window.localStorage.setItem(this._key(collection), JSON.stringify(items));
      return true;
    } catch (error) {
      console.error(`LocalStorageAdapter: failed to write "${collection}".`, error);
      return false;
    }
  }

  async getAll(collection) {
    return deepClone(this._readCollection(collection));
  }

  async getById(collection, id) {
    const items = this._readCollection(collection);
    const found = items.find((item) => item.id === id);
    return found ? deepClone(found) : null;
  }

  async create(collection, item) {
    if (!item || !item.id) {
      throw new TypeError('LocalStorageAdapter.create: item must include an "id" field.');
    }
    const items = this._readCollection(collection);
    items.push(item);
    this._writeCollection(collection, items);
    log(`Created record in "${collection}":`, item.id);
    return deepClone(item);
  }

  async update(collection, id, updates) {
    const items = this._readCollection(collection);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;

    items[index] = { ...items[index], ...updates, id }; // id can never be overwritten
    this._writeCollection(collection, items);
    log(`Updated record in "${collection}":`, id);
    return deepClone(items[index]);
  }

  async remove(collection, id) {
    const items = this._readCollection(collection);
    const filtered = items.filter((item) => item.id !== id);
    const removed = filtered.length !== items.length;
    if (removed) {
      this._writeCollection(collection, filtered);
      log(`Removed record from "${collection}":`, id);
    }
    return removed;
  }

  async clear(collection) {
    window.localStorage.removeItem(this._key(collection));
    log(`Cleared collection "${collection}".`);
  }
}

export default LocalStorageAdapter;