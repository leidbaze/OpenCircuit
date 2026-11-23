// Registro central del catÃ¡logo de componentes
// src/components/registry.js
import { Led } from './basic/Led.js';
import { Resistor } from './basic/Resistor.js';
import { PushButton } from './basic/PushButton.js';
import { Potentiometer } from './sensors/Potentiometer.js';
import { LdrSensor } from './sensors/LdrSensor.js';
import { PiezoBuzzer } from './actuators/PiezoBuzzer.js';

export const ComponentCatalog = [
  { type: 'led', name: 'LED', category: 'Básicos', ctor: Led },
  { type: 'resistor', name: 'Resistencia', category: 'Básicos', ctor: Resistor },
  { type: 'pushbutton', name: 'Pulsador', category: 'Básicos', ctor: PushButton },
  { type: 'potentiometer', name: 'Potenciómetro', category: 'Sensores', ctor: Potentiometer },
  { type: 'ldr', name: 'Sensor Luz (LDR)', category: 'Sensores', ctor: LdrSensor },
  { type: 'buzzer', name: 'Buzzer Piezo', category: 'Actuadores', ctor: PiezoBuzzer }
];

export const ComponentRegistry = new Map(
  ComponentCatalog.map((item) => [item.type, item])
);

export function createComponent(type, id, config = {}) {
  const entry = ComponentRegistry.get(type);
  if (!entry) throw new Error(`Componente desconocido: ${type}`);
  return new entry.ctor(id, config);
}