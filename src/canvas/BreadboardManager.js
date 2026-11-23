// src/canvas/BreadboardManager.js
import { BreadboardView } from './BreadboardView.js';
import { bus } from '../core/EventBus.js';

export class BreadboardManager {
  constructor(workspace, graph, solver = null) {
    this.workspace = workspace;
    this.graph = graph;
    this.solver = solver;
    this.breadboards = new Map(); // id -> BreadboardView
    this.activeBreadboardId = null;
  }

  addBreadboard(id = `bb_${Date.now().toString().slice(-4)}`, options = {}) {
    const x = options.x ?? 480;
    const y = options.y ?? 65;

    const bb = new BreadboardView(this.workspace, this.graph, id, x, y);
    bb.render();

    this.breadboards.set(id, bb);
    this._bindInteractions(bb);
    this.selectBreadboard(id);
    bus.emit('circuit:changed');
    return bb;
  }

  removeBreadboard(id) {
    const bb = this.breadboards.get(id);
    if (!bb) return;

    bb.destroy();
    this.breadboards.delete(id);

    const prefix = `${id}.`;
    for (const [wireId, wire] of [...this.graph.wires.entries()]) {
      if (wire.from.startsWith(prefix) || wire.to.startsWith(prefix)) {
        bus.emit('wire:removeRequested', { wireId });
      }
    }

    if (this.activeBreadboardId === id) {
      this.activeBreadboardId = null;
    }
    bus.emit('breadboard:removed', { id });
    bus.emit('circuit:changed');
  }

  selectBreadboard(id) {
    if (this.activeBreadboardId && this.breadboards.has(this.activeBreadboardId)) {
      this.breadboards.get(this.activeBreadboardId).setSelected(false);
    }
    this.activeBreadboardId = id;
    const current = id ? this.breadboards.get(id) : null;
    if (current) {
      current.setSelected(true);
    }
    bus.emit('breadboard:selected', { breadboard: current });
  }

  clearAll() {
    for (const id of [...this.breadboards.keys()]) {
      this.removeBreadboard(id);
    }
  }

  _getAttachedComponents(bbId) {
    if (!this.solver) return [];
    const prefix = `${bbId}.`;
    const attached = [];

    for (const comp of this.solver.components.values()) {
      const isAttached = comp.pins.some(
        (pin) => pin.connectedNode && pin.connectedNode.startsWith(prefix)
      );
      if (isAttached) {
        attached.push(comp);
      }
    }
    return attached;
  }

  _bindInteractions(bb) {
    const el = bb.el;
    let dragging = false;
    let offset = { x: 0, y: 0 };
    let lastPos = { x: bb.x, y: bb.y };
    let attachedComps = [];

    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const pt = this.workspace.clientToSvg(e.clientX, e.clientY);

      // Si hizo clic justo encima de un agujero, dejar que WireManager inicie un cable
      if (this.workspace.findNearestPin(pt.x, pt.y, 8)) return;

      e.stopPropagation();
      this.selectBreadboard(bb.id);
      dragging = true;
      el.style.cursor = 'grabbing';
      offset = { x: pt.x - bb.x, y: pt.y - bb.y };
      lastPos = { x: bb.x, y: bb.y };
      attachedComps = this._getAttachedComponents(bb.id);
    });

    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const pt = this.workspace.clientToSvg(e.clientX, e.clientY);
      const newX = Math.round((pt.x - offset.x) / 7) * 7;
      const newY = Math.round((pt.y - offset.y) / 7) * 7;

      const dx = newX - lastPos.x;
      const dy = newY - lastPos.y;
      if (dx === 0 && dy === 0) return;

      lastPos = { x: newX, y: newY };
      bb.moveTo(newX, newY);

      // Mover cada componente insertado en esta protoboard y actualizar sus pines
      for (const comp of attachedComps) {
        comp.x += dx;
        comp.y += dy;
        comp.el?.setAttribute(
          'transform',
          `translate(${comp.x}, ${comp.y}) rotate(${comp.rotation})`
        );

        const rad = (comp.rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        comp.pins.forEach((pin, idx) => {
          const worldX = comp.x + (pin.dx * cos - pin.dy * sin);
          const worldY = comp.y + (pin.dx * sin + pin.dy * cos);
          this.workspace.registerPinLocation(`${comp.id}.pin${idx}`, worldX, worldY, { type: 'comp' });
        });

        bus.emit('board:moved', { boardId: comp.id });
      }

      bus.emit('board:moved', { boardId: bb.id });
    });

    window.addEventListener('pointerup', () => {
      if (dragging) {
        dragging = false;
        attachedComps = [];
        el.style.cursor = 'grab';
        bus.emit('breadboard:movedEnd', { id: bb.id });
      }
    });
  }
}