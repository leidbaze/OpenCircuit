// Componente Fotorresistencia (LDR)
// src/components/sensors/LdrSensor.js
import { BaseComponent } from '../BaseComponent.js';
import { bus } from '../../core/EventBus.js';

export class LdrSensor extends BaseComponent {
  constructor(id, config = {}) {
    super(id, 'ldr', {
      ...config,
      props: { lightLevel: config.props?.lightLevel ?? 0.5 } // 0 = oscuridad, 1 = luz plena
    });
    this.pins = [
      { name: 'P1', dx: -12, dy: 18, connectedNode: null },
      { name: 'P2', dx: 12, dy: 18, connectedNode: null }
    ];
  }

  propagate(graph, netStates) {
    const net0 = this.getNetInfo(graph, netStates, 0);
    const net1 = this.getNetInfo(graph, netStates, 1);
    const factor = Number(this.props.lightLevel) || 0;

    if (net0 && net0.voltage !== null && (!net1 || net1.voltage === null)) {
      const target = graph.findNet(this.pins[1].connectedNode);
      netStates.set(target, { voltage: net0.voltage * factor, pwm: 0, sources: [] });
    } else if (net1 && net1.voltage !== null && (!net0 || net0.voltage === null)) {
      const target = graph.findNet(this.pins[0].connectedNode);
      netStates.set(target, { voltage: net1.voltage * factor, pwm: 0, sources: [] });
    }
  }

  render(svgParent) {
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('transform', `translate(${this.x}, ${this.y}) rotate(${this.rotation})`);
    g.dataset.componentId = this.id;

    g.innerHTML = `
      <circle cx="0" cy="-4" r="14" fill="#d97706" stroke="#78350f" stroke-width="2" />
      <path d="M -8 -6 Q -4 -10 0 -6 T 8 -6 M -8 -1 Q -4 -5 0 -1 T 8 -1" fill="none" stroke="#991b1b" stroke-width="2" />
      <circle cx="-12" cy="18" r="4" fill="#4b5563" data-pin="0" />
      <circle cx="12" cy="18" r="4" fill="#4b5563" data-pin="1" />
    `;
    svgParent.appendChild(g);
    this.el = g;
    return g;
  }

  updateVisuals() {
    bus.emit('circuit:changed');
  }

  getInspectorControls() {
    return [
      { key: 'lightLevel', label: 'Nivel de luz ambiental', type: 'range', min: 0, max: 1, step: 0.05 }
    ];
  }
}