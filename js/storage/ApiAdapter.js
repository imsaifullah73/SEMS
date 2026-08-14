/* ==========================================================================
   SEMS — API Adapter
   The Phase 15 moment: implements the exact same StorageAdapter contract
   as LocalStorageAdapter (Phase 4), but backed by real HTTP calls to the
   Express + PostgreSQL backend instead of window.localStorage. Every
   Repository (ExpenseRepository, IncomeRepository, etc.) is UNCHANGED —
   they only ever called getAll/getById/create/update/remove, and this
   class provides those same methods.
   ========================================================================== */

import { StorageAdapter } from './StorageAdapter.js';
import { CONFIG } from '../core/config.js';
import { AuthService } from '../services/AuthService.js';

function normalizeItem(item) {
  if (item && typeof item.date === 'string' && item.date.length > 10) {
    return { ...item, date: item.date.slice(0, 10) };
  }
  return item;
}

export class ApiAdapter extends StorageAdapter {
  async _authHeaders() {
    const token = AuthService.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  async _request(method, path, body) {
    const res = await fetch(`${CONFIG.API.BASE_URL}${path}`, {
      method,
      headers: await this._authHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      cache: method === 'GET' ? 'no-store' : 'no-cache',
    });

    if (res.status === 401) {
      AuthService.logout();
      throw new Error('Session expired. Please log in again.');
    }

    if (res.status === 204) return null;

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message = data && (data.error || (data.errors && Object.values(data.errors)[0]));
      throw new Error(message || `Request failed with status ${res.status}.`);
    }

    return data;
  }

  async getAll(collection) {
    const data = await this._request('GET', `/${collection}`);
    return Array.isArray(data) ? data.map(normalizeItem) : [];
  }

  async getById(collection, id) {
    const data = await this._request('GET', `/${collection}/${id}`);
    return data ? normalizeItem(data) : null;
  }

  async create(collection, item) {
    const data = await this._request('POST', `/${collection}`, item);
    return normalizeItem(data);
  }

  async update(collection, id, updates) {
    const data = await this._request('PUT', `/${collection}/${id}`, updates);
    return data ? normalizeItem(data) : null;
  }

  async remove(collection, id) {
    const res = await fetch(`${CONFIG.API.BASE_URL}/${collection}/${id}`, {
      method: 'DELETE',
      headers: await this._authHeaders(),
    });

    if (res.status === 401) {
      AuthService.logout();
      throw new Error('Session expired. Please log in again.');
    }
    if (res.status === 404) return false;
    if (!res.ok) throw new Error(`Failed to delete (status ${res.status}).`);
    return true;
  }

  async clear() {
    console.warn('ApiAdapter.clear() is not supported — data now lives on the server.');
  }
}

export default ApiAdapter;