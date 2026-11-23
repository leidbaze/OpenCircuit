// src/storage/ProjectSerializer.js
export class ProjectSerializer {
  static exportProject({ boardManager, breadboardManager, solver, graph }) {
    const data = {
      version: '1.2.0',
      app: 'OpenCircuit',
      timestamp: new Date().toISOString(),
      boards: Array.from(boardManager.boards.values()).map((b) => ({
        id: b.id,
        type: 'arduino_uno',
        x: b.view.x,
        y: b.view.y,
        code: b.code
      })),
      breadboards: Array.from(breadboardManager.breadboards.values()).map((bb) => ({
        id: bb.id,
        x: bb.x,
        y: bb.y
      })),
      components: Array.from(solver.components.values()).map((c) => c.toJSON()),
      wires: Array.from(graph.wires.values())
    };
    return JSON.stringify(data, null, 2);
  }

  static downloadJSON(filename, jsonString) {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  static parseJSON(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.components) || !Array.isArray(parsed.wires)) {
      throw new Error('Formato de proyecto OpenCircuit inválido.');
    }
    return parsed;
  }
}