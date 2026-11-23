// src/mcu/BoardManager.js
import { ArduinoUno } from './ArduinoUno.js';
import { ArduinoUnoView } from '../canvas/ArduinoUnoView.js';
import { ArduinoAPI } from './interpreter/ArduinoAPI.js';
import { bus } from '../core/EventBus.js';

export class BoardManager {
  constructor(workspace, graph, clock, transpiler) {
    this.workspace = workspace;
    this.graph = graph;
    this.clock = clock;
    this.transpiler = transpiler;

    this.boards = new Map(); // id -> { id, model, view, api, code }
    this.activeBoardId = null;
  }

  addBoard(id = `uno_${Date.now().toString().slice(-4)}`, options = {}) {
    const x = options.x ?? 30;
    const y = options.y ?? 60;
    const code = options.code ?? this._getDefaultCode(id);

    const model = new ArduinoUno(id);
    const view = new ArduinoUnoView(this.workspace, id, x, y, 0.368);
    const api = new ArduinoAPI(model, this.clock);

    view.render(() => {
      bus.emit('sim:restartRequested');
    });

    const entry = { id, model, view, api, code };
    this.boards.set(id, entry);

    this._bindBoardInteractions(entry);
    this.selectBoard(id);
    bus.emit('circuit:changed');
    return entry;
  }

  removeBoard(id) {
    const entry = this.boards.get(id);
    if (!entry) return;

    entry.api.stop();
    entry.view.destroy();
    this.boards.delete(id);

    // Eliminar cables conectados a cualquier pin de esta placa
    for (const [wireId, wire] of [...this.graph.wires.entries()]) {
      if (wire.from.startsWith(`${id}.`) || wire.to.startsWith(`${id}.`)) {
        bus.emit('wire:removeRequested', { wireId });
      }
    }

    if (this.activeBoardId === id) {
      const next = this.boards.keys().next().value || null;
      this.selectBoard(next);
    }
    bus.emit('circuit:changed');
  }

  selectBoard(id) {
    if (this.activeBoardId && this.boards.has(this.activeBoardId)) {
      this.boards.get(this.activeBoardId).view.setSelected(false);
    }
    this.activeBoardId = id;
    const current = id ? this.boards.get(id) : null;
    if (current) {
      current.view.setSelected(true);
    }
    bus.emit('board:selected', { board: current });
  }

  getActiveBoard() {
    return this.activeBoardId ? this.boards.get(this.activeBoardId) : null;
  }

  saveCodeForActive(code) {
    const active = this.getActiveBoard();
    if (active) active.code = code;
  }

  getAllPinStates() {
    const combined = {};
    for (const entry of this.boards.values()) {
      Object.assign(combined, entry.model.getAllPinStates());
    }
    return combined;
  }

  updateInputsFromNets(graph, netStates) {
    for (const entry of this.boards.values()) {
      entry.model.updateInputsFromNets(graph, netStates);
    }
  }

  resetAll() {
    for (const entry of this.boards.values()) {
      entry.model.reset();
    }
  }

  stopAll() {
    for (const entry of this.boards.values()) {
      entry.api.stop();
    }
  }

  async runAll(onError) {
    const tasks = [];
    for (const entry of this.boards.values()) {
      tasks.push(
        this.transpiler.run(entry.code, entry.api).catch((err) => {
          if (onError) onError(entry.id, err);
        })
      );
    }
    await Promise.all(tasks);
  }

  clearAll() {
    for (const id of [...this.boards.keys()]) {
      this.removeBoard(id);
    }
  }

  _bindBoardInteractions(entry) {
    const el = entry.view.el;
    let dragging = false;
    let offset = { x: 0, y: 0 };

    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const pt = this.workspace.clientToSvg(e.clientX, e.clientY);
      // Si hizo clic cerca de un pin, permitir cablear en lugar de arrastrar la placa
      if (this.workspace.findNearestPin(pt.x, pt.y, 10)) return;

      e.stopPropagation();
      this.selectBoard(entry.id);
      dragging = true;
      el.style.cursor = 'grabbing';
      offset = { x: pt.x - entry.view.x, y: pt.y - entry.view.y };
    });

    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const pt = this.workspace.clientToSvg(e.clientX, e.clientY);
      const newX = Math.round((pt.x - offset.x) / 7) * 7;
      const newY = Math.round((pt.y - offset.y) / 7) * 7;
      entry.view.moveTo(newX, newY);
      bus.emit('board:moved', { boardId: entry.id });
    });

    window.addEventListener('pointerup', () => {
      if (dragging) {
        dragging = false;
        el.style.cursor = 'grab';
      }
    });
  }

  _getDefaultCode(id) {
    return `// Sketch para placa: ${id}
void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(500);
  digitalWrite(13, LOW);
  delay(500);
}`;
  }
}