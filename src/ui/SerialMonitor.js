// Consola de comunicaciÃ³n Serial
// src/ui/SerialMonitor.js
import { bus } from '../core/EventBus.js';

export class SerialMonitor {
  constructor(containerEl) {
    this.container = containerEl;
    this.buffer = '';
    this.render();
    this._bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="serial-header">
        <span>Monitor Serie</span>
        <button id="btn-clear-serial" class="btn-xs">Limpiar</button>
      </div>
      <pre id="serial-output" class="serial-console"></pre>
    `;
    this.outputEl = this.container.querySelector('#serial-output');
    this.container.querySelector('#btn-clear-serial').addEventListener('click', () => this.clear());
  }

  append(text, newline = false) {
    this.buffer += text + (newline ? '\n' : '');
    if (this.buffer.length > 8000) {
      this.buffer = this.buffer.slice(-6000);
    }
    this.outputEl.textContent = this.buffer;
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }

  clear() {
    this.buffer = '';
    this.outputEl.textContent = '';
  }

  _bindEvents() {
    bus.on('serial:begin', ({ baud }) => {
      this.append(`[Serial iniciado a ${baud} baudios]`, true);
    });

    bus.on('serial:print', ({ text, newline }) => {
      this.append(text, newline);
    });

    bus.on('circuit:shortCircuit', ({ netId }) => {
      this.append(`⚠️ ALERTA: Posible cortocircuito detectado en el nodo ${netId}`, true);
    });
  }
}