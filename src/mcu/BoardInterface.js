// Clase base abstracta para microcontroladores
// src/mcu/BoardInterface.js
import { bus } from '../core/EventBus.js';

export class BoardInterface {
  constructor(id, name, voltageLevel = 5.0) {
    this.id = id;
    this.name = name;
    this.voltageLevel = voltageLevel;
    this.pins = new Map(); // pinName -> { nodeId, mode, value, voltage, pwm, isAnalog, isPwm }
  }

  registerPin(name, options = {}) {
    const nodeId = `${this.id}.${name}`;
    this.pins.set(name, {
      name,
      nodeId,
      mode: options.defaultMode || 'INPUT', // 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP' | 'POWER'
      value: options.defaultValue ?? 0,
      voltage: options.defaultVoltage ?? null,
      pwm: 0,
      isAnalog: Boolean(options.isAnalog),
      isPwm: Boolean(options.isPwm),
      adcResolution: options.adcResolution || 1023
    });
  }

  setPinMode(pinName, mode) {
    const pin = this.pins.get(String(pinName));
    if (!pin || pin.mode === 'POWER') return;

    pin.mode = mode;
    if (mode === 'INPUT_PULLUP') {
      pin.voltage = this.voltageLevel;
    } else if (mode === 'INPUT') {
      pin.voltage = null;
    } else if (mode === 'OUTPUT') {
      pin.voltage = pin.value ? this.voltageLevel : 0;
    }
    bus.emit('board:pinChanged', { pin: pinName, state: pin });
  }

  writeDigital(pinName, highOrLow) {
    const pin = this.pins.get(String(pinName));
    if (!pin || pin.mode === 'POWER') return;

    const val = highOrLow ? 1 : 0;
    pin.value = val;
    pin.pwm = 0;
    if (pin.mode === 'OUTPUT') {
      pin.voltage = val ? this.voltageLevel : 0;
    }
    bus.emit('board:pinChanged', { pin: pinName, state: pin });
  }

  writeAnalog(pinName, dutyCycle) {
    const pin = this.pins.get(String(pinName));
    if (!pin || pin.mode === 'POWER') return;

    const clamped = Math.max(0, Math.min(255, Math.round(dutyCycle)));
    pin.mode = 'OUTPUT';
    pin.pwm = clamped;
    pin.value = clamped > 0 ? 1 : 0;
    pin.voltage = (clamped / 255) * this.voltageLevel;
    bus.emit('board:pinChanged', { pin: pinName, state: pin });
  }

  readDigital(pinName) {
    const pin = this.pins.get(String(pinName));
    if (!pin) return 0;
    return pin.voltage !== null && pin.voltage >= this.voltageLevel * 0.6 ? 1 : 0;
  }

  readAnalog(pinName) {
    const pin = this.pins.get(String(pinName));
    if (!pin || pin.voltage === null) return 0;
    const ratio = Math.max(0, Math.min(1, pin.voltage / this.voltageLevel));
    return Math.round(ratio * pin.adcResolution);
  }

  getAllPinStates() {
    const states = {};
    for (const pin of this.pins.values()) {
      states[pin.nodeId] = {
        mode: pin.mode,
        voltage: pin.voltage,
        pwm: pin.pwm
      };
    }
    return states;
  }

  updateInputsFromNets(graph, netStates) {
    for (const pin of this.pins.values()) {
      if (pin.mode === 'INPUT' || pin.mode === 'INPUT_PULLUP') {
        const netId = graph.findNet(pin.nodeId);
        const net = netStates.get(netId);
        if (net && net.voltage !== null) {
          pin.voltage = net.voltage;
        } else {
          pin.voltage = pin.mode === 'INPUT_PULLUP' ? this.voltageLevel : null;
        }
      }
    }
  }

  reset() {
    for (const pin of this.pins.values()) {
      if (pin.mode !== 'POWER') {
        pin.mode = 'INPUT';
        pin.value = 0;
        pin.voltage = null;
        pin.pwm = 0;
      }
    }
    bus.emit('board:reset');
  }
}