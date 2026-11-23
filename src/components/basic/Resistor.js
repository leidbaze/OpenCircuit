// src/components/basic/Resistor.js
import { BaseComponent } from '../BaseComponent.js';

const COLOR_MAP = ['#000000', '#78350f', '#dc2626', '#f97316', '#eab308', '#16a34a', '#2563eb', '#9333ea', '#6b7280', '#ffffff'];

export class Resistor extends BaseComponent {
  constructor(id, config = {}) {
    super(id, 'resistor', {
      ...config,
      props: { ohms: config.props?.ohms ?? 220 }
    });
    this.pins = [
      { name: 'T1', dx: -30, dy: 0, connectedNode: null },
      { name: 'T2', dx: 30, dy: 0, connectedNode: null }
    ];
  }

  propagate(graph, netStates) {
    const netA = this.getNetInfo(graph, netStates, 0);
    const netB = this.getNetInfo(graph, netStates, 1);

    if (netA && netA.voltage !== null && (!netB || netB.voltage === null)) {
      const targetNetId = graph.findNet(this.pins[1].connectedNode);
      netStates.set(targetNetId, {
        voltage: netA.voltage,
        pwm: netA.pwm,
        viaResistor: this.props.ohms,
        sources: netA.sources
      });
    } else if (netB && netB.voltage !== null && (!netA || netA.voltage === null)) {
      const targetNetId = graph.findNet(this.pins[0].connectedNode);
      netStates.set(targetNetId, {
        voltage: netB.voltage,
        pwm: netB.pwm,
        viaResistor: this.props.ohms,
        sources: netB.sources
      });
    }
  }

  _getBandColors() {
    const val = Math.max(10, Number(this.props.ohms) || 220);
    const str = String(Math.round(val));
    const d1 = Number(str[0]) || 0;
    const d2 = Number(str[1]) || 0;
    const mult = Math.max(0, str.length - 2);
    return [COLOR_MAP[d1], COLOR_MAP[d2], COLOR_MAP[Math.min(9, mult)], '#d97706'];
  }

  render(svgParent) {
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('transform', `translate(${this.x}, ${this.y}) rotate(${this.rotation})`);
    g.dataset.componentId = this.id;

    const bands = this._getBandColors();
    g.innerHTML = `
      <line x1="-30" y1="0" x2="30" y2="0" stroke="#9ca3af" stroke-width="3" />
      <rect x="-18" y="-7" width="36" height="14" rx="4" fill="#fde68a" stroke="#b45309" stroke-width="1.5" />
      <rect x="-12" y="-7" width="3.5" height="14" fill="${bands[0]}" />
      <rect x="-5" y="-7" width="3.5" height="14" fill="${bands[1]}" />
      <rect x="2" y="-7" width="3.5" height="14" fill="${bands[2]}" />
      <rect x="10" y="-7" width="3" height="14" fill="${bands[3]}" />
      <circle cx="-30" cy="0" r="4" fill="#4b5563" data-pin="0" />
      <circle cx="30" cy="0" r="4" fill="#4b5563" data-pin="1" />
    `;
    svgParent.appendChild(g);
    this.el = g;
    return g;
  }

  getInspectorControls() {
    return [
      {
        key: 'ohms',
        label: 'Resistencia (Ω)',
        type: 'select',
        options: [
          { label: '220 Ω (LED)', value: 220 },
          { label: '330 Ω', value: 330 },
          { label: '1 kΩ', value: 1000 },
          { label: '10 kΩ (Pull-down)', value: 10000 }
        ]
      }
    ];
  }
}