// Punto de entrada principal de OpenCircuit
console.log('OpenCircuit inicializado');
// src/main.js
import { SimulationClock } from './core/SimulationClock.js';
import { CircuitGraph } from './core/CircuitGraph.js';
import { ElectricalSolver } from './core/ElectricalSolver.js';

import { CppTranspiler } from './mcu/interpreter/CppTranspiler.js';

import { createComponent } from './components/registry.js';

import { WorkspaceSVG } from './canvas/WorkspaceSVG.js';
import { BreadboardManager } from './canvas/BreadboardManager.js';
import { WireManager } from './canvas/WireManager.js';
import { InteractionMgr } from './canvas/InteractionMgr.js';

import { Toolbar } from './ui/Toolbar.js';
import { ComponentPalette } from './ui/ComponentPalette.js';
import { CodeEditor } from './ui/CodeEditor.js';
import { SerialMonitor } from './ui/SerialMonitor.js';
import { ProjectSerializer } from './storage/ProjectSerializer.js';

import { BoardManager } from './mcu/BoardManager.js';
import { bus } from './core/EventBus.js';

const PRESETS = {
  blink: {
    code: `// Práctica 1: Parpadeo de LED en Pin 13
void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(13, HIGH);
  Serial.println("LED ENCENDIDO");
  delay(600);

  digitalWrite(13, LOW);
  Serial.println("LED APAGADO");
  delay(600);
}`,
    components: [
      { id: 'r1', type: 'resistor', x: 575, y: 123, rotation: 0, props: { ohms: 220 } },
      { id: 'led1', type: 'led', x: 612, y: 99, rotation: 0, props: { color: 'red' } }
    ],
    wires: [
      { id: 'w1', from: 'uno.13', to: 'bb.A5', color: '#ef4444' },
      { id: 'w2', from: 'uno.GND1', to: 'bb.TOP_NEG.1', color: '#111827' },
      { id: 'w3', from: 'bb.E9', to: 'bb.TOP_NEG.9', color: '#111827' }
    ]
  },

  button: {
    code: `// Práctica 2: Control de LED con Pulsador (INPUT_PULLUP)
const int BOTON = 2;
const int LED = 12;

void setup() {
  pinMode(BOTON, INPUT_PULLUP);
  pinMode(LED, OUTPUT);
}

void loop() {
  if (digitalRead(BOTON) == LOW) {
    digitalWrite(LED, HIGH);
  } else {
    digitalWrite(LED, LOW);
  }
  delay(30);
}`,
    components: [
      { id: 'btn1', type: 'pushbutton', x: 567, y: 138, rotation: 0, props: {} },
      { id: 'r1', type: 'resistor', x: 659, y: 123, rotation: 0, props: { ohms: 220 } },
      { id: 'led1', type: 'led', x: 696, y: 99, rotation: 0, props: { color: 'green' } }
    ],
    wires: [
      { id: 'w1', from: 'uno.2', to: 'bb.A4', color: '#3b82f6' },
      { id: 'w2', from: 'uno.GND1', to: 'bb.TOP_NEG.1', color: '#111827' },
      { id: 'w3', from: 'bb.B7', to: 'bb.TOP_NEG.7', color: '#111827' },
      { id: 'w4', from: 'uno.12', to: 'bb.A11', color: '#22c55e' },
      { id: 'w5', from: 'bb.E15', to: 'bb.TOP_NEG.15', color: '#111827' }
    ]
  },

  pot: {
    code: `// Práctica 3: Lectura Analógica de Potenciómetro
void setup() {
  Serial.begin(9600);
}

void loop() {
  int valor = analogRead(A0);
  Serial.print("Lectura A0: ");
  Serial.println(valor);
  delay(250);
}`,
    components: [
      { id: 'pot1', type: 'potentiometer', x: 476, y: 104, rotation: 0, props: { ratio: 0.5 } }
    ],
    wires: [
      { id: 'w1', from: 'uno.5V', to: 'bb.TOP_POS.1', color: '#ef4444' },
      { id: 'w2', from: 'uno.GND1', to: 'bb.TOP_NEG.1', color: '#111827' },
      { id: 'w3', from: 'bb.B6', to: 'bb.TOP_POS.6', color: '#ef4444' },
      { id: 'w4', from: 'bb.B8', to: 'bb.TOP_NEG.8', color: '#111827' },
      { id: 'w5', from: 'uno.A0', to: 'bb.E7', color: '#eab308' }
    ]
  },

  buzzer: {
    code: `// Práctica 4: Escala Musical con Buzzer Piezo
int notas[] = {262, 294, 330, 349, 392, 440, 494, 523};

void setup() {
  pinMode(8, OUTPUT);
}

void loop() {
  for (int i = 0; i < 8; i++) {
    tone(8, notas[i]);
    delay(250);
  }
  noTone(8);
  delay(800);
}`,
    components: [
      { id: 'buz1', type: 'buzzer', x: 490, y: 102, rotation: 0, props: {} }
    ],
    wires: [
      { id: 'w1', from: 'uno.8', to: 'bb.A7', color: '#3b82f6' },
      { id: 'w2', from: 'uno.GND1', to: 'bb.TOP_NEG.1', color: '#111827' },
      { id: 'w3', from: 'bb.E9', to: 'bb.TOP_NEG.9', color: '#111827' }
    ]
  }
};

// 1. Inicializar Núcleo y Administrador de Placas
const clock = new SimulationClock();
const graph = new CircuitGraph();
const transpiler = new CppTranspiler();

const workspace = new WorkspaceSVG(document.getElementById('canvas-container'));
const boardManager = new BoardManager(workspace, graph, clock, transpiler);
const solver = new ElectricalSolver(graph, boardManager);

const breadboardManager = new BreadboardManager(workspace, graph, solver);
//breadboard.render();

const wireManager = new WireManager(workspace, graph);
const interactionMgr = new InteractionMgr(workspace, graph, solver);

// 2. Sincronizar selección exclusiva entre Placas, Componentes y Cables
bus.on('board:selected', ({ board }) => {
  if (board) {
    interactionMgr.select(null);
    wireManager.selectWire(null);
    editor.setCode(board.code);
    const header = document.querySelector('.editor-header span');
    if (header) header.textContent = `Código Arduino (${board.id})`;
  }
});

bus.on('ui:componentSelected', ({ component }) => {
  if (component) wireManager.selectWire(null);
});

bus.on('ui:wireSelected', ({ wireId }) => {
  if (wireId) interactionMgr.select(null);
});

bus.on('sim:restartRequested', () => {
  stopSimulation();
  startSimulation();
});
bus.on('breadboard:selected', ({ breadboard }) => {
  if (breadboard) {
    interactionMgr.select(null);
    wireManager.selectWire(null);
    boardManager.selectBoard(null);
  }
});

bus.on('board:selected', ({ board }) => {
  if (board) {
    interactionMgr.select(null);
    wireManager.selectWire(null);
    breadboardManager.selectBreadboard(null);
    editor.setCode(board.code);
    const header = document.querySelector('.editor-header span');
    if (header) header.textContent = `Código Arduino (${board.id})`;
  }
});

// Reacoplar pines de componentes cuando se mueve o elimina una protoboard
const resnapAllComponents = () => {
  for (const comp of solver.components.values()) {
    interactionMgr._snapComponentPins(comp, false);
  }
  graph.rebuild();
  solver.solve();
};

bus.on('breadboard:movedEnd', resnapAllComponents);
bus.on('breadboard:removed', resnapAllComponents);

// 3. Funciones de Gestión de Escena
function clearWorkspace() {
  wireManager.clearAll();
  boardManager.clearAll();
  breadboardManager.clearAll();
  for (const comp of [...solver.components.values()]) {
    interactionMgr.select(comp);
    interactionMgr.deleteSelected();
  }
}

function loadScene(sceneData) {
  stopSimulation();
  clearWorkspace();

  const boardsList = sceneData.boards || [
    { id: 'uno', x: 25, y: 60, code: sceneData.code || '' }
  ];
  boardsList.forEach((b) => {
    boardManager.addBoard(b.id, { x: b.x, y: b.y, code: b.code });
  });

  const bbList = sceneData.breadboards || [
    { id: 'bb', x: 480, y: 65 }
  ];
  bbList.forEach((bb) => {
    breadboardManager.addBreadboard(bb.id, { x: bb.x, y: bb.y });
  });

  sceneData.components.forEach((c) => {
    const comp = createComponent(c.type, c.id, c);
    solver.addComponent(comp);
    interactionMgr.attachComponent(comp);
  });

  sceneData.wires.forEach((w) => {
    wireManager.addWire(w.id, w.from, w.to, w.color);
  });

  solver.solve();
}

async function startSimulation() {
  serial.clear();
  boardManager.resetAll();
  solver.solve();
  clock.start();

  await boardManager.runAll((boardId, err) => {
    serial.append(`❌ [${boardId}] Error: ${err.message}`, true);
    stopSimulation();
  });
}

function stopSimulation() {
  boardManager.stopAll();
  clock.stop();
  boardManager.resetAll();
  solver.solve();
}

function deleteActiveSelection() {
  if (interactionMgr.selectedComponent) {
    interactionMgr.deleteSelected();
  } else if (wireManager.selectedWireId) {
    wireManager.deleteSelected();
  } else if (breadboardManager.activeBreadboardId) {
    breadboardManager.removeBreadboard(breadboardManager.activeBreadboardId);
  } else if (boardManager.activeBoardId) {
    boardManager.removeBoard(boardManager.activeBoardId);
  }
}

window.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
  if (e.key === 'Delete' || e.key === 'Backspace') {
    deleteActiveSelection();
  }
});

// 4. Inicializar UI
const editor = new CodeEditor(document.getElementById('editor-container'));
editor.textarea.addEventListener('input', () => {
  boardManager.saveCodeForActive(editor.getCode());
});

const serial = new SerialMonitor(document.getElementById('serial-container'));

new ComponentPalette(document.getElementById('palette-container'), (type) => {
  if (type === 'arduino_uno') {
    const count = boardManager.boards.size;
    const id = count === 0 ? 'uno' : `uno_${count + 1}`;
    boardManager.addBoard(id, { x: 25, y: 60 + count * 320 });
    return;
  }

  if (type === 'breadboard') {
    const count = breadboardManager.breadboards.size;
    const id = count === 0 ? 'bb' : `bb_${count + 1}`;
    breadboardManager.addBreadboard(id, { x: 480, y: 65 + count * 300 });
    return;
  }

  const id = `${type}_${Date.now().toString().slice(-4)}`;
  const comp = createComponent(type, id, { x: 520, y: 380 });
  solver.addComponent(comp);
  interactionMgr.attachComponent(comp);
  interactionMgr.select(comp);
});

new Toolbar(document.getElementById('toolbar-container'), {
  onRun: startSimulation,
  onStop: stopSimulation,
  onReset: () => {
    stopSimulation();
    startSimulation();
  },
  onRotate: () => interactionMgr.rotateSelected(),
  onDelete: deleteActiveSelection,
  onSelectWireColor: (hex) => wireManager.setColor(hex),
  onLoadPreset: (key) => {
    if (PRESETS[key]) loadScene(PRESETS[key]);
  },
  onExport: () => {
    const json = ProjectSerializer.exportProject({
      boardManager,
      breadboardManager,
      solver,
      graph
    });
    ProjectSerializer.downloadJSON('practica_opencircuit.json', json);
  },
  onImport: (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = ProjectSerializer.parseJSON(e.target.result);
        loadScene(data);
      } catch (err) {
        alert(err.message);
      }
    };
    reader.readAsText(file);
  }
});

// 5. Cargar práctica inicial por defecto
loadScene(PRESETS.blink);