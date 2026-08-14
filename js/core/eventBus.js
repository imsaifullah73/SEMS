/* ==========================================================================
   SEMS — Event Bus
   A minimal publish/subscribe system so unrelated parts of the app (e.g. a
   Service updating data, and a UI component that needs to re-render) can
   communicate WITHOUT importing each other directly. This keeps modules
   decoupled as the app grows in later phases.

   Reserved event names for future phases (documented here so every future
   file uses consistent naming instead of inventing new ones):
     app:ready
     theme:changed
     expense:created / expense:updated / expense:deleted
     income:created  / income:updated  / income:deleted
     budget:updated
     dashboard:refresh
   ========================================================================== */

class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   */
  on(eventName, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError(`EventBus.on: handler for "${eventName}" must be a function.`);
    }
    if (!this._listeners.has(eventName)) {
      this._listeners.set(eventName, new Set());
    }
    this._listeners.get(eventName).add(handler);
    return () => this.off(eventName, handler);
  }

  /**
   * Subscribe to an event, but only fire once.
   */
  once(eventName, handler) {
    const wrapped = (...args) => {
      this.off(eventName, wrapped);
      handler(...args);
    };
    return this.on(eventName, wrapped);
  }

  off(eventName, handler) {
    const handlers = this._listeners.get(eventName);
    if (!handlers) return;
    handlers.delete(handler);
    if (handlers.size === 0) {
      this._listeners.delete(eventName);
    }
  }

  /**
   * Emit an event to all subscribers. Errors inside a listener are caught
   * and logged so one broken listener can't block the others.
   */
  emit(eventName, payload) {
    const handlers = this._listeners.get(eventName);
    if (!handlers) return;
    for (const handler of [...handlers]) {
      try {
        handler(payload);
      } catch (error) {
        console.error(`EventBus: listener for "${eventName}" threw an error.`, error);
      }
    }
  }

  clear(eventName) {
    if (eventName) {
      this._listeners.delete(eventName);
    } else {
      this._listeners.clear();
    }
  }
}

// Singleton instance — every file imports this SAME instance so they're all
// talking on the same bus.
export const eventBus = new EventBus();

// Also export the class itself, in case an isolated bus is ever needed
// (e.g. for testing).
export default EventBus;