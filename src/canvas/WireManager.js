// src/canvas/WireManager.js
import { bus } from '../core/EventBus.js';

export class WireManager {
  constructor(workspace, graph) {
    this.workspace = workspace;
    this.graph = graph;
    this.wireEls = new Map();
    this.activeWire = null;
    this.selectedWireId = null;
    this.currentColor = '#ef4444';

    this._bindEvents();
    bus.on('board:moved', ({ boardId }) => this.updateWiresForPrefix(`${boardId}.`));
    bus.on('wire:removeRequested', ({ wireId }) => this.removeWire(wireId));
  }

  setColor(hex) {
    this.currentColor = hex;
    if (this.selectedWireId) {
      this._recolorWire(this.selectedWireId, hex);
    }
  }

  selectWire(id) {
    if (this.selectedWireId && this.wireEls.has(this.selectedWireId)) {
      this.wireEls.get(this.selectedWireId).style.filter = '';
    }
    this.selectedWireId = id;
    if (id && this.wireEls.has(id)) {
      this.wireEls.get(id).style.filter = 'drop-shadow(0 0 6px #38bdf8)';
      bus.emit('ui:wireSelected', { wireId: id });
    }
  }

  deleteSelected() {
    if (this.selectedWireId) {
      this.removeWire(this.selectedWireId);
      this.selectedWireId = null;
    }
  }

  _recolorWire(id, hex) {
    const wire = this.graph.wires.get(id);
    const el = this.wireEls.get(id);
    if (!wire || !el) return;
    wire.color = hex;
    el.querySelector('.wire-main')?.setAttribute('stroke', hex);
    el.querySelectorAll('.wire-tip').forEach((tip) => tip.setAttribute('fill', hex));
  }

  _bindEvents() {
    this.workspace.svg.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const pt = this.workspace.clientToSvg(e.clientX, e.clientY);
      const pin = this.workspace.findNearestPin(pt.x, pt.y, 11);

      if (!pin) {
        this.cancelDraft();
        if (e.target.dataset.bg) this.selectWire(null);
        return;
      }

      if (!this.activeWire) {
        this.selectWire(null);
        this._startDraft(pin);
      } else if (this.activeWire.from.nodeId !== pin.nodeId) {
        const id = `wire_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        this.addWire(id, this.activeWire.from.nodeId, pin.nodeId, this.currentColor);
        this.cancelDraft();
      }
    });

    this.workspace.svg.addEventListener('pointermove', (e) => {
      if (!this.activeWire) return;
      const pt = this.workspace.clientToSvg(e.clientX, e.clientY);
      const nearest = this.workspace.findNearestPin(pt.x, pt.y, 11);
      const targetX = nearest ? nearest.x : pt.x;
      const targetY = nearest ? nearest.y : pt.y;

      const d = this._computeCurve(this.activeWire.from.x, this.activeWire.from.y, targetX, targetY);
      this.activeWire.previewEl.setAttribute('d', d);
    });

    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'Escape') this.cancelDraft();
      if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedWireId) {
        this.deleteSelected();
      }
    });
  }

  _startDraft(pin) {
    const path = document.createElementNS(this.workspace.ns, 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', this.currentColor);
    path.setAttribute('stroke-width', '3.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-dasharray', '6 4');
    path.style.pointerEvents = 'none';

    this.workspace.layers.overlay.appendChild(path);
    this.activeWire = { from: pin, previewEl: path };
  }

  cancelDraft() {
    if (this.activeWire) {
      this.activeWire.previewEl.remove();
      this.activeWire = null;
    }
  }

  addWire(id, fromNode, toNode, color = '#ef4444') {
    const p1 = this.workspace.pinCoordinates.get(fromNode);
    const p2 = this.workspace.pinCoordinates.get(toNode);
    if (!p1 || !p2) return;

    this.graph.addWire(id, fromNode, toNode, color);

    const g = document.createElementNS(this.workspace.ns, 'g');
    g.dataset.wireId = id;
    g.style.cursor = 'pointer';

    const d = this._computeCurve(p1.x, p1.y, p2.x, p2.y);
    g.innerHTML = `
      <path d="${d}" fill="none" stroke="transparent" stroke-width="14" stroke-linecap="round" />
      <path d="${d}" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="5.5" stroke-linecap="round" transform="translate(0,2)" />
      <path class="wire-main" d="${d}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" />
      <circle class="wire-tip" cx="${p1.x}" cy="${p1.y}" r="4.5" fill="${color}" stroke="#0f172a" stroke-width="1.5" />
      <circle class="wire-tip" cx="${p2.x}" cy="${p2.y}" r="4.5" fill="${color}" stroke="#0f172a" stroke-width="1.5" />
    `;

    // Clic izquierdo: seleccionar cable
    g.addEventListener('pointerdown', (e) => {
      if (e.button === 0) {
        e.stopPropagation();
        this.selectWire(id);
      } else if (e.button === 2) {
        // Clic derecho: borrar cable directamente
        e.preventDefault();
        e.stopPropagation();
        this.removeWire(id);
      }
    });

    this.workspace.layers.wires.appendChild(g);
    this.wireEls.set(id, g);
  }

  removeWire(id) {
    this.graph.removeWire(id);
    const el = this.wireEls.get(id);
    if (el) {
      el.remove();
      this.wireEls.delete(id);
    }
    if (this.selectedWireId === id) this.selectedWireId = null;
  }

  clearAll() {
    for (const id of [...this.wireEls.keys()]) {
      this.removeWire(id);
    }
  }

  _computeCurve(x1, y1, x2, y2) {
    const sag = Math.min(85, Math.hypot(x2 - x1, y2 - y1) * 0.28 + 20);
    return `M ${x1} ${y1} C ${x1} ${y1 + sag}, ${x2} ${y2 + sag}, ${x2} ${y2}`;
  }
  updateWiresForPrefix(prefix) {
    for (const [id, wire] of this.graph.wires.entries()) {
      if (wire.from.startsWith(prefix) || wire.to.startsWith(prefix)) {
        const p1 = this.workspace.pinCoordinates.get(wire.from);
        const p2 = this.workspace.pinCoordinates.get(wire.to);
        const el = this.wireEls.get(id);
        if (!p1 || !p2 || !el) continue;

        const d = this._computeCurve(p1.x, p1.y, p2.x, p2.y);
        el.querySelectorAll('path').forEach((path) => path.setAttribute('d', d));
        const tips = el.querySelectorAll('.wire-tip');
        if (tips[0]) { tips[0].setAttribute('cx', p1.x); tips[0].setAttribute('cy', p1.y); }
        if (tips[1]) { tips[1].setAttribute('cx', p2.x); tips[1].setAttribute('cy', p2.y); }
      }
    }
  }
}