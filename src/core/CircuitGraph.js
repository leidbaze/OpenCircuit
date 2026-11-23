// Grafo de nodos elÃ©ctricos (protoboard, pines y cables)
// src/core/CircuitGraph.js
import { bus } from './EventBus.js';

export class CircuitGraph {
  constructor() {
    this.parent = new Map(); // Mapa de nodos conectados (Union-Find)
    this.wires = new Map();  // Registro de cables físicos: id -> { from, to, color }
    this.staticLinks = [];   // Conexiones internas (ej. filas de la protoboard)
  }

  registerNode(nodeId) {
    if (!this.parent.has(nodeId)) {
      this.parent.set(nodeId, nodeId);
    }
  }

  // Crea una unión interna permanente (como los 5 agujeros de una fila de protoboard)
  addStaticLink(nodeA, nodeB) {
    this.registerNode(nodeA);
    this.registerNode(nodeB);
    this.staticLinks.push([nodeA, nodeB]);
    this.rebuild();
  }

  addWire(wireId, nodeA, nodeB, color = '#ef4444') {
    this.wires.set(wireId, { id: wireId, from: nodeA, to: nodeB, color });
    this.rebuild();
    bus.emit('circuit:changed');
  }

  removeWire(wireId) {
    if (this.wires.delete(wireId)) {
      this.rebuild();
      bus.emit('circuit:changed');
    }
  }

  findNet(nodeId) {
    if (!this.parent.has(nodeId)) return nodeId;
    let root = nodeId;
    while (this.parent.get(root) !== root) {
      root = this.parent.get(root);
    }
    // Compresión de ruta
    let curr = nodeId;
    while (curr !== root) {
      const next = this.parent.get(curr);
      this.parent.set(curr, root);
      curr = next;
    }
    return root;
  }

  union(nodeA, nodeB) {
    this.registerNode(nodeA);
    this.registerNode(nodeB);
    const rootA = this.findNet(nodeA);
    const rootB = this.findNet(nodeB);
    if (rootA !== rootB) {
      this.parent.set(rootA, rootB);
    }
  }

  rebuild() {
    for (const key of this.parent.keys()) {
      this.parent.set(key, key);
    }
    for (const [a, b] of this.staticLinks) {
      this.union(a, b);
    }
    for (const wire of this.wires.values()) {
      this.union(wire.from, wire.to);
    }
  }

  areConnected(nodeA, nodeB) {
    return this.findNet(nodeA) === this.findNet(nodeB);
  }
}