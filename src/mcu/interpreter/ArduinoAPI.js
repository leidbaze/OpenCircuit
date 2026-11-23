// ImplementaciÃ³n de pinMode, digitalWrite, analogRead, tone, etc.
// src/mcu/interpreter/ArduinoAPI.js
import { bus } from '../../core/EventBus.js';

export class ArduinoAPI {
  constructor(board, clock) {
    this.board = board;
    this.clock = clock;
    this.abortSignal = false;
    this.activeTones = new Map(); // pin -> frequency
  }

  stop() {
    this.abortSignal = true;
    for (const pin of this.activeTones.keys()) {
      this.noTone(pin);
    }
  }

  resetSignal() {
    this.abortSignal = false;
  }

  async yieldTick() {
    if (this.abortSignal) throw new Error('SIM_ABORTED');
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (this.abortSignal) throw new Error('SIM_ABORTED');
  }

  getBindings() {
    const self = this;

    const Serial = {
      begin(baud) {
        bus.emit('serial:begin', { baud });
      },
      print(val) {
        bus.emit('serial:print', { text: String(val), newline: false });
      },
      println(val = '') {
        bus.emit('serial:print', { text: String(val), newline: true });
      }
    };

    return {
      HIGH: 1,
      LOW: 0,
      INPUT: 'INPUT',
      OUTPUT: 'OUTPUT',
      INPUT_PULLUP: 'INPUT_PULLUP',
      LED_BUILTIN: 13,
      A0: 'A0', A1: 'A1', A2: 'A2', A3: 'A3', A4: 'A4', A5: 'A5',

      pinMode: (pin, mode) => self.board.setPinMode(pin, mode),
      digitalWrite: (pin, val) => self.board.writeDigital(pin, val),
      digitalRead: (pin) => self.board.readDigital(pin),
      analogWrite: (pin, val) => self.board.writeAnalog(pin, val),
      analogRead: (pin) => self.board.readAnalog(pin),

      millis: () => self.clock.millis(),
      micros: () => self.clock.micros(),

      delay: async (ms) => {
        const target = self.clock.millis() + ms;
        while (self.clock.millis() < target) {
          if (self.abortSignal) throw new Error('SIM_ABORTED');
          await new Promise((r) => setTimeout(r, 8));
        }
      },

      delayMicroseconds: async (us) => {
        await self.yieldTick();
      },

      tone: (pin, frequency, duration = null) => {
        self.activeTones.set(String(pin), frequency);
        bus.emit('board:tone', { pin: String(pin), frequency, active: true });
        if (duration) {
          setTimeout(() => self.noTone(pin), duration);
        }
      },

      noTone: (pin) => {
        self.activeTones.delete(String(pin));
        bus.emit('board:tone', { pin: String(pin), frequency: 0, active: false });
      },

      map: (x, inMin, inMax, outMin, outMax) =>
        Math.floor(((x - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin),

      constrain: (amt, low, high) => Math.max(low, Math.min(high, amt)),

      Serial,
      __yield: () => self.yieldTick()
    };
  }
}