// Componente PotenciÃ³metro divisor de voltaje
// src/components/sensors/Potentiometer.js
import { BaseComponent } from '../BaseComponent.js';
import { bus } from '../../core/EventBus.js';

export class Potentiometer extends BaseComponent {
  constructor(id, config = {}) {
    super(id, 'potentiometer', {
      ...config,
      props: { ratio: config.props?.ratio ?? 0.5 } // 0.0 a 1.0
    });
    this.pins = [
      { name: 'VCC', dx: -15, dy: 22, connectedNode: null },
      { name: 'SIG', dx: 0, dy: 22, connectedNode: null },
      { name: 'GND', dx: 15, dy: 22, connectedNode: null }
    ];
  }

  propagate(graph, netStates) {
    const vLeft = this.getNetVoltage(graph, netStates, 0);
    const vRight = this.getNetVoltage(graph, netStates, 2);

    if (vLeft !== null && vRight !== null && this.pins[1].connectedNode) {
      const ratio = Number(this.props.ratio) || 0;
      const outVoltage = vRight + (vLeft - vRight) * ratio;
      const wiperNet = graph.findNet(this.pins[1].connectedNode);
      netStates.set(wiperNet, { voltage: outVoltage, pwm: 0, sources: [] });
    }
  }

  render(svgParent) {
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('transform', `translate(${this.x}, ${this.y}) rotate(${this.rotation})`);
    g.dataset.componentId = this.id;

    const angle = -135 + this.props.ratio * 270;
    g.innerHTML = `
      <circle cx="0" cy="-4" r="20" fill="#2563eb" stroke="#1e3a8a" stroke-width="2" />
      <circle cx="0" cy="-4" r="13" fill="#e5e7eb" />
      <line class="pot-dial" x1="0" y1="-4" x2="0" y2="-16" stroke="#111827" stroke-width="3" transform="rotate(${angle} 0 -4)" />
      <circle cx="-15" cy="22" r="4" fill="#4b5563" data-pin="0" />
      <circle cx="0" cy="22" r="4" fill="#4b5563" data-pin="1" />
      <circle cx="15" cy="22" r="4" fill="#4b5563" data-pin="2" />
    `;
    svgParent.appendChild(g);
    this.el = g;
    return g;
  }

  updateVisuals() {
    if (!this.el) return;
    const dial = this.el.querySelector('.pot-dial');
    const angle = -135 + (Number(this.props.ratio) || 0) * 270;
    dial?.setAttribute('transform', `rotate(${angle} 0 -4)`);
    bus.emit('circuit:changed');
  }

  getInspectorControls() {
    return [
      { key: 'ratio', label: 'Perilla (0% - 100%)', type: 'range', min: 0, max: 1, step: 0.01 }
    ];
  }
}