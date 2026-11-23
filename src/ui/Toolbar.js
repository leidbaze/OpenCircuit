// Barra superior de simulaciÃ³n (Play, Stop, Reset)
// src/ui/Toolbar.js
import { bus } from '../core/EventBus.js';

const WIRE_COLORS = [
  { name: 'Rojo (VCC)', hex: '#ef4444' },
  { name: 'Negro (GND)', hex: '#111827' },
  { name: 'Verde', hex: '#22c55e' },
  { name: 'Azul', hex: '#3b82f6' },
  { name: 'Amarillo', hex: '#eab308' }
];

export class Toolbar {
  constructor(containerEl, callbacks) {
    this.container = containerEl;
    this.callbacks = callbacks;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="toolbar">
        <div class="brand">⚡ OpenCircuit</div>

        <div class="btn-group">
          <button id="btn-run" class="btn btn-primary">▶ Iniciar</button>
          <button id="btn-stop" class="btn btn-danger" disabled>⏹ Detener</button>
          <button id="btn-reset" class="btn">↺ Reset</button>
        </div>

        <div class="btn-group">
          <label class="tool-label">Cable:</label>
          <div id="wire-colors" class="color-swatches"></div>
        </div>

        <div class="btn-group">
          <button id="btn-rotate" class="btn" title="Tecla R">↻ Rotar (R)</button>
          <button id="btn-delete" class="btn" title="Tecla Supr">🗑 Eliminar</button>
        </div>

        <div class="btn-group">
          <select id="preset-select" class="select-input">
            <option value="blink">Ejemplo: Blink LED (Pin 13)</option>
            <option value="button">Ejemplo: Pulsador + LED</option>
            <option value="pot">Ejemplo: Potenciómetro + Serial</option>
            <option value="buzzer">Ejemplo: Melodía Buzzer</option>
          </select>
        </div>

        <div class="btn-group">
          <button id="btn-export" class="btn">💾 Guardar JSON</button>
          <button id="btn-import" class="btn">📂 Abrir JSON</button>
          <input id="file-import" type="file" accept=".json" style="display:none" />
        </div>
      </div>
    `;

    const btnRun = this.container.querySelector('#btn-run');
    const btnStop = this.container.querySelector('#btn-stop');

    btnRun.addEventListener('click', () => this.callbacks.onRun());
    btnStop.addEventListener('click', () => this.callbacks.onStop());
    this.container.querySelector('#btn-reset').addEventListener('click', () => this.callbacks.onReset());
    this.container.querySelector('#btn-rotate').addEventListener('click', () => this.callbacks.onRotate());
    this.container.querySelector('#btn-delete').addEventListener('click', () => this.callbacks.onDelete());

    this.container.querySelector('#preset-select').addEventListener('change', (e) => {
      this.callbacks.onLoadPreset(e.target.value);
    });

    this.container.querySelector('#btn-export').addEventListener('click', () => this.callbacks.onExport());

    const fileInput = this.container.querySelector('#file-import');
    this.container.querySelector('#btn-import').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files?.[0]) {
        this.callbacks.onImport(e.target.files[0]);
        e.target.value = '';
      }
    });

    // Selector de color de cables
    const swatchesEl = this.container.querySelector('#wire-colors');
    WIRE_COLORS.forEach((c, idx) => {
      const btn = document.createElement('button');
      btn.className = `swatch ${idx === 0 ? 'active' : ''}`;
      btn.style.backgroundColor = c.hex;
      btn.title = c.name;
      btn.addEventListener('click', () => {
        swatchesEl.querySelectorAll('.swatch').forEach((s) => s.classList.remove('active'));
        btn.classList.add('active');
        this.callbacks.onSelectWireColor(c.hex);
      });
      swatchesEl.appendChild(btn);
    });

    bus.on('sim:start', () => {
      btnRun.disabled = true;
      btnStop.disabled = false;
    });

    bus.on('sim:stop', () => {
      btnRun.disabled = false;
      btnStop.disabled = true;
    });
  }
}