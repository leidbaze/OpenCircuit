// src/canvas/InteractionMgr.js
import { bus } from '../core/EventBus.js';

export class InteractionMgr {
  constructor(workspace, graph, solver) {
    this.workspace = workspace;
    this.graph = graph;
    this.solver = solver;
    this.selectedComponent = null;
    this.dragging = null;
    this.snapDots = [];

    this._bindEvents();
  }

  attachComponent(component) {
    component.render(this.workspace.layers.components);
    this._snapComponentPins(component);

    component.el.style.cursor = 'grab';
    component.el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.dataset.pin !== undefined) return;
      e.stopPropagation();

      this.select(component);
      component.el.style.cursor = 'grabbing';
      const pt = this.workspace.clientToSvg(e.clientX, e.clientY);
      this.dragging = {
        component,
        offsetX: pt.x - component.x,
        offsetY: pt.y - component.y
      };
    });
  }

  select(component) {
    if (this.selectedComponent?.el) {
      this.selectedComponent.el.style.filter = '';
    }
    this.selectedComponent = component;
    if (component?.el) {
      component.el.style.filter = 'drop-shadow(0 0 7px #38bdf8)';
    }
    bus.emit('ui:componentSelected', { component });
  }

  rotateSelected() {
    if (!this.selectedComponent) return;
    const c = this.selectedComponent;
    c.rotation = (c.rotation + 90) % 360;
    c.el.setAttribute('transform', `translate(${c.x}, ${c.y}) rotate(${c.rotation})`);
    this._snapComponentPins(c);
    this.graph.rebuild();
    bus.emit('circuit:changed');
  }

  deleteSelected() {
    if (!this.selectedComponent) return;
    const c = this.selectedComponent;
    this._disconnectComponentPins(c);
    c.el?.remove();
    this.solver.removeComponent(c.id);
    this.selectedComponent = null;
    this.graph.rebuild();
    bus.emit('ui:componentSelected', { component: null });
    bus.emit('circuit:changed');
  }

  _clearSnapPreview() {
    this.snapDots.forEach((d) => d.remove());
    this.snapDots = [];
  }

  _showSnapPreview(component) {
    this._clearSnapPreview();
    const rad = (component.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    component.pins.forEach((pin) => {
      const worldX = component.x + (pin.dx * cos - pin.dy * sin);
      const worldY = component.y + (pin.dx * sin + pin.dy * cos);
      const targetPin = this.workspace.findNearestPin(worldX, worldY, 13);

      if (targetPin) {
        const dot = document.createElementNS(this.workspace.ns, 'circle');
        dot.setAttribute('cx', targetPin.x);
        dot.setAttribute('cy', targetPin.y);
        dot.setAttribute('r', '5.5');
        dot.setAttribute('fill', '#22c55e');
        dot.setAttribute('stroke', '#ffffff');
        dot.setAttribute('stroke-width', '1.5');
        dot.style.pointerEvents = 'none';
        this.workspace.layers.overlay.appendChild(dot);
        this.snapDots.push(dot);
      }
    });
  }

  _bindEvents() {
    this.workspace.svg.addEventListener('pointerdown', (e) => {
      if (e.target.dataset.bg && e.button === 0) {
        this.select(null);
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      const { component, offsetX, offsetY } = this.dragging;
      const pt = this.workspace.clientToSvg(e.clientX, e.clientY);

      component.x = Math.round((pt.x - offsetX) / 7) * 7;
      component.y = Math.round((pt.y - offsetY) / 7) * 7;
      component.el.setAttribute(
        'transform',
        `translate(${component.x}, ${component.y}) rotate(${component.rotation})`
      );
      this._showSnapPreview(component);
      bus.emit('board:moved', { boardId: component.id });
    });

    window.addEventListener('pointerup', () => {
      if (!this.dragging) return;
      const { component } = this.dragging;
      this.dragging = null;
      component.el.style.cursor = 'grab';
      this._clearSnapPreview();
      this._snapComponentPins(component, true);
      this.graph.rebuild();
      bus.emit('circuit:changed');
    });

    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'r' || e.key === 'R') this.rotateSelected();
      if (e.key === 'Delete' || e.key === 'Backspace') this.deleteSelected();
    });
  }

  _disconnectComponentPins(component) {
    component.pins.forEach((pin, idx) => {
      const compNode = `${component.id}.pin${idx}`;
      this.graph.staticLinks = this.graph.staticLinks.filter(
        ([a, b]) => a !== compNode && b !== compNode
      );
      pin.connectedNode = null;
    });
  }

  _snapComponentPins(component, alignToHole = false) {
    this._disconnectComponentPins(component);
    const rad = (component.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Alinear el cuerpo entero del componente si su primer pin cae cerca de un agujero
    if (alignToHole && component.pins.length > 0) {
      const p0 = component.pins[0];
      const wx0 = component.x + (p0.dx * cos - p0.dy * sin);
      const wy0 = component.y + (p0.dx * sin + p0.dy * cos);
      const nearest0 = this.workspace.findNearestPin(wx0, wy0, 13);
      if (nearest0) {
        component.x += nearest0.x - wx0;
        component.y += nearest0.y - wy0;
        component.el.setAttribute(
          'transform',
          `translate(${component.x}, ${component.y}) rotate(${component.rotation})`
        );
      }
    }

    component.pins.forEach((pin, idx) => {
      const worldX = component.x + (pin.dx * cos - pin.dy * sin);
      const worldY = component.y + (pin.dx * sin + pin.dy * cos);
      const targetPin = this.workspace.findNearestPin(worldX, worldY, 13);

      const compNode = `${component.id}.pin${idx}`;
      this.workspace.registerPinLocation(compNode, worldX, worldY, { type: 'comp' });

      if (targetPin) {
        pin.connectedNode = targetPin.nodeId;
        this.graph.addStaticLink(compNode, targetPin.nodeId);
      }
    });
  }
}