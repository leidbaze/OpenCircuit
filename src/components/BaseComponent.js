// Contrato base para todos los componentes electrÃ³nicos
// src/components/BaseComponent.js
export class BaseComponent {
  constructor(id, type, config = {}) {
    this.id = id;
    this.type = type;
    this.x = config.x ?? 100;
    this.y = config.y ?? 100;
    this.rotation = config.rotation ?? 0;
    this.props = { ...config.props }; // Propiedades editables (ej. resistencia: 220, color: 'red')
    this.pins = [];  // [{ name: 'A', dx: -15, dy: 0, connectedNode: null }]
    this.state = {}; // Estado dinámico de simulación
    this.el = null;  // Referencia al elemento <g> en SVG
  }

  getNetVoltage(graph, netStates, pinIndex) {
    const node = this.pins[pinIndex]?.connectedNode;
    if (!node) return null;
    const netId = graph.findNet(node);
    return netStates.get(netId)?.voltage ?? null;
  }

  getNetInfo(graph, netStates, pinIndex) {
    const node = this.pins[pinIndex]?.connectedNode;
    if (!node) return null;
    const netId = graph.findNet(node);
    return netStates.get(netId) ?? null;
  }

  propagate(graph, netStates) {}
  evaluate(graph, netStates) {}
  render(svgParent) {}
  updateVisuals() {}

  getInspectorControls() {
    return [];
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      rotation: this.rotation,
      props: this.props,
      pins: this.pins.map((p) => ({ name: p.name, connectedNode: p.connectedNode }))
    };
  }
}