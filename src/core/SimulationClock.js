// Reloj maestro sincronizado (millis, micros, ticks)
// src/core/SimulationClock.js
import { bus } from './EventBus.js';

export class SimulationClock {
  constructor() {
    this.running = false;
    this.startTime = 0;
    this.elapsedMs = 0;
    this.lastFrameTime = 0;
    this.rafId = null;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastFrameTime = performance.now();
    bus.emit('sim:start');
    this._loop();
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    bus.emit('sim:stop');
  }

  reset() {
    this.stop();
    this.elapsedMs = 0;
    bus.emit('sim:reset');
  }

  millis() {
    return Math.floor(this.elapsedMs);
  }

  micros() {
    return Math.floor(this.elapsedMs * 1000);
  }

  _loop() {
    if (!this.running) return;
    const now = performance.now();
    const dt = now - this.lastFrameTime;
    this.lastFrameTime = now;
    this.elapsedMs += dt;

    bus.emit('sim:tick', { dt, elapsed: this.elapsedMs });
    this.rafId = requestAnimationFrame(() => this._loop());
  }
}