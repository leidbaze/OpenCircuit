// Motor de anÃ¡lisis elÃ©ctrico (continuidad, voltaje, cortocircuitos)
// src/core/ElectricalSolver.js
import { bus } from './EventBus.js';

export class ElectricalSolver {
  constructor(graph, board) {
    this.graph = graph;
    this.board = board;
    this.components = new Map();
    this.netStates = new Map(); // netId -> { voltage: number, pwm: number, drivenBy: string[] }

    bus.on('circuit:changed', () => this.solve());
    bus.on('board:pinChanged', () => this.solve());
  }

  addComponent(component) {
    this.components.set(component.id, component);
    this.solve();
  }

  removeComponent(componentId) {
    this.components.delete(componentId);
    this.solve();
  }

  solve() {
    this.netStates.clear();

    // 1. Propagar fuentes de energía y salidas digitales/PWM del Arduino
    const boardPins = this.board.getAllPinStates();
    for (const [pinNodeId, state] of Object.entries(boardPins)) {
      const netId = this.graph.findNet(pinNodeId);
      if (!this.netStates.has(netId)) {
        this.netStates.set(netId, { voltage: null, pwm: 0, sources: [] });
      }
      const net = this.netStates.get(netId);

      if (state.mode === 'POWER' || state.mode === 'OUTPUT') {
        net.sources.push({ pin: pinNodeId, voltage: state.voltage, pwm: state.pwm || 0 });
      }
    }

    // 2. Verificar conflictos o cortocircuitos (ej. 5V conectado directo a GND)
    for (const [netId, net] of this.netStates.entries()) {
      if (net.sources.length > 0) {
        const voltages = net.sources.map((s) => s.voltage);
        const maxV = Math.max(...voltages);
        const minV = Math.min(...voltages);

        if (maxV > 0 && minV === 0) {
          bus.emit('circuit:shortCircuit', { netId, sources: net.sources });
          net.voltage = 0; // Caída por corto
        } else {
          net.voltage = maxV;
          net.pwm = Math.max(...net.sources.map((s) => s.pwm));
        }
      }
    }

    // 3. Propagar componentes pasivos o interruptores (Resistencias, Botones)
    for (const comp of this.components.values()) {
      if (typeof comp.propagate === 'function') {
        comp.propagate(this.graph, this.netStates);
      }
    }

    // 4. Evaluar estado final de cada componente (LEDs, Buzzers, Sensores)
    for (const comp of this.components.values()) {
      comp.evaluate(this.graph, this.netStates);
    }

    // 5. Actualizar lecturas de pines configurados como INPUT o ANALOG en Arduino
    this.board.updateInputsFromNets(this.graph, this.netStates);
  }
}