// Componente Buzzer piezoelÃ©ctrico con Web Audio API
// src/components/actuators/PiezoBuzzer.js
import { BaseComponent } from '../BaseComponent.js';
import { bus } from '../../core/EventBus.js';

export class PiezoBuzzer extends BaseComponent {
  constructor(id, config = {}) {
    super(id, 'buzzer', config);
    this.pins = [
      { name: 'POS', dx: -15, dy: 24, connectedNode: null },
      { name: 'NEG', dx: 15, dy: 24, connectedNode: null }
    ];
    this.audioCtx = null;
    this.oscillator = null;
    this.toneFreq = 0;

    bus.on('board:tone', ({ pin, frequency, active }) => {
      const posNode = this.pins[0].connectedNode;
      if (posNode && posNode.endsWith(`.${pin}`)) {
        this.toneFreq = active ? frequency : 0;
        this._syncAudio();
      }
    });

    bus.on('sim:stop', () => this._stopAudio());
  }

  evaluate(graph, netStates) {
    const vPos = this.getNetVoltage(graph, netStates, 0);
    const vNeg = this.getNetVoltage(graph, netStates, 1);
    const activeCircuit = vPos !== null && vNeg !== null && vPos - vNeg >= 2.0;

    if (activeCircuit || this.toneFreq > 0) {
      this._startAudio(this.toneFreq || 440);
    } else {
      this._stopAudio();
    }
  }

  _syncAudio() {
    if (this.toneFreq > 0) this._startAudio(this.toneFreq);
    else this._stopAudio();
  }

  _startAudio(freq) {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (!this.oscillator) {
        this.oscillator = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        gain.gain.value = 0.08; // Volumen cómodo para aula
        this.oscillator.type = 'square';
        this.oscillator.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        this.oscillator.connect(gain);
        gain.connect(this.audioCtx.destination);
        this.oscillator.start();
        this.el?.querySelector('.buzzer-ring')?.setAttribute('stroke', '#22c55e');
      } else {
        this.oscillator.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      }
    } catch (_) {}
  }

  _stopAudio() {
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch (_) {}
      this.oscillator = null;
      this.el?.querySelector('.buzzer-ring')?.setAttribute('stroke', '#4b5563');
    }
  }

  render(svgParent) {
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('transform', `translate(${this.x}, ${this.y}) rotate(${this.rotation})`);
    g.dataset.componentId = this.id;

    g.innerHTML = `
      <circle class="buzzer-ring" cx="0" cy="-4" r="22" fill="#111827" stroke="#4b5563" stroke-width="3" />
      <circle cx="0" cy="-4" r="6" fill="#374151" />
      <text x="-18" y="18" font-size="10" fill="#dc2626" font-weight="bold">+</text>
      <circle cx="-15" cy="24" r="4" fill="#4b5563" data-pin="0" />
      <circle cx="15" cy="24" r="4" fill="#4b5563" data-pin="1" />
    `;
    svgParent.appendChild(g);
    this.el = g;
    return g;
  }
}