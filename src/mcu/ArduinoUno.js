// DefiniciÃ³n de pines y capacidades del Arduino UNO
// src/mcu/ArduinoUno.js
import { BoardInterface } from './BoardInterface.js';

export class ArduinoUno extends BoardInterface {
  constructor(id = 'uno') {
    super(id, 'Arduino UNO', 5.0);
    this._initPins();
  }

  _initPins() {
    const pwmPins = new Set([3, 5, 6, 9, 10, 11]);

    // Pines digitales D0 - D13
    for (let i = 0; i <= 13; i++) {
      this.registerPin(String(i), {
        isPwm: pwmPins.has(i),
        isAnalog: false
      });
    }

    // Pines analógicos A0 - A5 (también funcionan como digitales 14-19)
    for (let i = 0; i <= 5; i++) {
      this.registerPin(`A${i}`, {
        isAnalog: true,
        adcResolution: 1023
      });
    }

    // Pines de alimentación
    this.registerPin('5V', { defaultMode: 'POWER', defaultVoltage: 5.0 });
    this.registerPin('3.3V', { defaultMode: 'POWER', defaultVoltage: 3.3 });
    this.registerPin('GND1', { defaultMode: 'POWER', defaultVoltage: 0.0 });
    this.registerPin('GND2', { defaultMode: 'POWER', defaultVoltage: 0.0 });
    this.registerPin('GND3', { defaultMode: 'POWER', defaultVoltage: 0.0 });
  }
}