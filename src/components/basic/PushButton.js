// Componente Pulsador tÃ¡ctil de 4 terminales
// src/components/basic/PushButton.js
import { BaseComponent } from '../BaseComponent.js';
import { bus } from '../../core/EventBus.js';

export class PushButton extends BaseComponent {
  constructor(id, config = {}) {
    super(id, 'pushbutton', config);
    this.pins = [
      { name: '1A', dx: -20, dy: -15, connectedNode: null },
      { name: '2A', dx: 20, dy: -15, connectedNode: null }
    ];
    this.state = { pressed: false };
  }

  propagate(graph, netStates) {
    if (!this.state.pressed) return;
    const net0 = this.getNetInfo(graph, netStates, 0);
    const net1 = this.getNetInfo(graph, netStates, 1);

    if (net0 && net0.voltage !== null) {
      const target = graph.findNet(this.pins[1].connectedNode);
      netStates.set(target, { ...net0 });
    } else if (net1 && net1.voltage !== null) {
      const target = graph.findNet(this.pins[0].connectedNode);
      netStates.set(target, { ...net1 });
    }
  }

  render(svgParent) {
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('transform', `translate(${this.x}, ${this.y}) rotate(${this.rotation})`);
    g.dataset.componentId = this.id;

    g.innerHTML = `
      <rect x="-18" y="-18" width="36" height="36" rx="4" fill="#374151" stroke="#111827" stroke-width="2" />
      <circle class="btn-cap" cx="0" cy="0" r="11" fill="#1f2937" stroke="#6b7280" stroke-width="1.5" style="cursor:pointer;" />
      <circle cx="-20" cy="-15" r="4" fill="#4b5563" data-pin="0" />
      <circle cx="20" cy="-15" r="4" fill="#4b5563" data-pin="1" />
    `;

    const cap = g.querySelector('.btn-cap');
    cap.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.state.pressed = true;
      cap.setAttribute('fill', '#ef4444');
      bus.emit('circuit:changed');
    });

    const release = () => {
      if (this.state.pressed) {
        this.state.pressed = false;
        cap.setAttribute('fill', '#1f2937');
        bus.emit('circuit:changed');
      }
    };
    window.addEventListener('pointerup', release);

    svgParent.appendChild(g);
    this.el = g;
    return g;
  }
}