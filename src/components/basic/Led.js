// src/components/basic/Led.js
import { BaseComponent } from '../BaseComponent.js';

const LED_PALETTE = {
  red: { off: '#991b1b', strokeOff: '#7f1d1d', on: '#ef4444', strokeOn: '#dc2626', glow: 'rgba(239, 68, 68, 0.8)' },
  green: { off: '#166534', strokeOff: '#14532d', on: '#22c55e', strokeOn: '#16a34a', glow: 'rgba(34, 197, 94, 0.8)' },
  yellow: { off: '#854d0e', strokeOff: '#713f12', on: '#facc15', strokeOn: '#eab308', glow: 'rgba(250, 204, 21, 0.85)' },
  blue: { off: '#1e40af', strokeOff: '#1e3a8a', on: '#3b82f6', strokeOn: '#2563eb', glow: 'rgba(59, 130, 246, 0.8)' }
};

export class Led extends BaseComponent {
  constructor(id, config = {}) {
    super(id, 'led', {
      ...config,
      props: { color: config.props?.color ?? 'red' }
    });
    // Separación de 14px (1 agujero de protoboard):
    // Pin 0 = Ánodo (+) [pata larga doblada a la derecha, dx: +7]
    // Pin 1 = Cátodo (-) [pata recta a la izquierda, dx: -7]
    this.pins = [
      { name: 'anode', dx: 7, dy: 24, connectedNode: null },
      { name: 'cathode', dx: -7, dy: 20, connectedNode: null }
    ];
    this.state = { brightness: 0, warningOvercurrent: false };
  }

  evaluate(graph, netStates) {
    const netAnode = this.getNetInfo(graph, netStates, 0);
    const netCathode = this.getNetInfo(graph, netStates, 1);

    const vA = netAnode?.voltage ?? null;
    const vC = netCathode?.voltage ?? null;

    if (vA !== null && vC !== null && vA - vC >= 1.7) {
      const diff = vA - vC;
      const hasResistor = Boolean(netAnode?.viaResistor || netCathode?.viaResistor);
      this.state.brightness = Math.min(1, diff / 5.0);
      this.state.warningOvercurrent = !hasResistor && diff > 3.3;
    } else {
      this.state.brightness = 0;
      this.state.warningOvercurrent = false;
    }
    this.updateVisuals();
  }

  render(svgParent) {
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('transform', `translate(${this.x}, ${this.y}) rotate(${this.rotation})`);
    g.dataset.componentId = this.id;

    const palette = LED_PALETTE[this.props.color] || LED_PALETTE.red;

    // Escala 0.209 centrada en el eje de las patas (x = 128, y = 268)
    g.innerHTML = `
      <g transform="scale(0.209) translate(-128, -268)">
        <!-- Aura luminosa al encender -->
        <circle class="led-glow" cx="120" cy="135" r="115" fill="${palette.glow}" opacity="0" />

        <!-- Patas metálicas -->
        <g id="led-legs">
          <!-- Cátodo (-) recto izquierda -->
          <polygon points="88,225 101,225 101,365 88,365" fill="#999999" stroke="#666666" stroke-width="2" stroke-linejoin="round" />
          <line x1="92" y1="227" x2="92" y2="363" stroke="#cccccc" stroke-width="2" />
          <!-- Ánodo (+) largo doblado derecha -->
          <polygon points="139,225 152,225 152,265 168,295 168,382 155,382 155,298 139,268" fill="#999999" stroke="#666666" stroke-width="2" stroke-linejoin="round" />
          <polyline points="143,227 143,267 159,297 159,380" fill="none" stroke="#cccccc" stroke-width="2" stroke-linecap="round" />
        </g>

        <!-- Electrodos internos e hilo de oro -->
        <g id="internal-electrodes">
          <path d="M 88,225 L 88,214 L 68,208 L 72,188 L 92,175 L 78,155 L 76,125 L 92,126 L 92,148 L 124,173 L 103,186 L 103,214 L 101,225 Z" fill="#666666" stroke="#4d4d4d" stroke-width="1.5" stroke-linejoin="round" />
          <path d="M 139,225 L 139,214 L 136,162 L 96,144 L 95,127 L 164,125 L 162,155 L 152,167 L 172,193 L 174,209 L 152,214 L 152,225 Z" fill="#666666" stroke="#4d4d4d" stroke-width="1.5" stroke-linejoin="round" />
          <path d="M 84,132 Q 95,120 112,132" fill="none" stroke="#b39b54" stroke-width="2" />
        </g>

        <!-- Cápsula translúcida -->
        <g id="led-body">
          <path class="led-dome" d="M 65,75 A 55,55 0 0,1 175,75 L 177,202 L 63,202 Z" fill="${palette.off}" fill-opacity="0.72" stroke="${palette.strokeOff}" stroke-width="2.5" stroke-linejoin="round" />
          <path d="M 78,72 A 42,42 0 0,1 155,52 A 45,45 0 0,0 85,88 Z" fill="#ffffff" fill-opacity="0.35" />
          <ellipse cx="102" cy="45" rx="14" ry="8" transform="rotate(-25 102 45)" fill="#ffffff" fill-opacity="0.45" />
          <path class="led-rim" d="M 55,202 L 185,202 L 186,222 Q 120,231 54,222 Z" fill="${palette.off}" fill-opacity="0.85" stroke="${palette.strokeOff}" stroke-width="2.5" stroke-linejoin="round" />
          <path d="M 56,202 Q 120,208 184,202 L 184,207 Q 120,213 56,207 Z" fill="#ffffff" fill-opacity="0.35" />
        </g>
      </g>

      <!-- Puntos de conexión interactivos en las puntas -->
      <circle cx="7" cy="24" r="3" fill="transparent" data-pin="0" />
      <circle cx="-7" cy="20" r="3" fill="transparent" data-pin="1" />
    `;

    svgParent.appendChild(g);
    this.el = g;
    return g;
  }

  updateVisuals() {
    if (!this.el) return;
    const palette = LED_PALETTE[this.props.color] || LED_PALETTE.red;
    const dome = this.el.querySelector('.led-dome');
    const rim = this.el.querySelector('.led-rim');
    const glow = this.el.querySelector('.led-glow');

    if (this.state.brightness > 0) {
      const stroke = this.state.warningOvercurrent ? '#facc15' : palette.strokeOn;
      dome?.setAttribute('fill', palette.on);
      dome?.setAttribute('fill-opacity', String(0.75 + this.state.brightness * 0.2));
      dome?.setAttribute('stroke', stroke);
      rim?.setAttribute('fill', palette.on);
      rim?.setAttribute('stroke', stroke);
      glow?.setAttribute('opacity', String(this.state.brightness * 0.9));
    } else {
      dome?.setAttribute('fill', palette.off);
      dome?.setAttribute('fill-opacity', '0.72');
      dome?.setAttribute('stroke', palette.strokeOff);
      rim?.setAttribute('fill', palette.off);
      rim?.setAttribute('stroke', palette.strokeOff);
      glow?.setAttribute('opacity', '0');
    }
  }

  getInspectorControls() {
    return [
      {
        key: 'color',
        label: 'Color del LED',
        type: 'select',
        options: [
          { label: 'Rojo', value: 'red' },
          { label: 'Verde', value: 'green' },
          { label: 'Amarillo', value: 'yellow' },
          { label: 'Azul', value: 'blue' }
        ]
      }
    ];
  }
}