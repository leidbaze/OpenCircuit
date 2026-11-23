// Sistema de eventos Pub/Sub para desacoplar lÃ³gica y vista
// src/core/EventBus.js
export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, payload = {}) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(payload);
        } catch (err) {
          console.error(`[EventBus] Error en evento '${event}':`, err);
        }
      });
    }
  }

  clear() {
    this.listeners.clear();
  }
}

export const bus = new EventBus();