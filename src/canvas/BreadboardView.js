// src/canvas/BreadboardView.js
export class BreadboardView {
  constructor(workspace, graph, id = 'bb', x = 480, y = 65) {
    this.workspace = workspace;
    this.graph = graph;
    this.id = id;
    this.x = x;
    this.y = y;
    this.pitch = 14;
    this.cols = 45;
    this.el = null;
  }

  render() {
    const ns = this.workspace.ns;
    const width = this.cols * this.pitch + 50;
    const height = 270;

    const g = document.createElementNS(ns, 'g');
    g.setAttribute('transform', `translate(${this.x}, ${this.y})`);
    g.dataset.breadboardId = this.id;

    g.innerHTML = `
      <rect x="0" y="0" width="${width}" height="${height}" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" />
      <rect x="12" y="130" width="${width - 24}" height="10" rx="2" fill="#e2e8f0" />
      <line x1="20" y1="14" x2="${width - 20}" y2="14" stroke="#ef4444" stroke-width="2" />
      <line x1="20" y1="42" x2="${width - 20}" y2="42" stroke="#2563eb" stroke-width="2" />
      <line x1="20" y1="${height - 42}" x2="${width - 20}" y2="${height - 42}" stroke="#ef4444" stroke-width="2" />
      <line x1="20" y1="${height - 14}" x2="${width - 20}" y2="${height - 14}" stroke="#2563eb" stroke-width="2" />
    `;

    // Rieles de alimentación superior e inferior
    const rails = [
      { name: 'TOP_POS', yOffset: 22 },
      { name: 'TOP_NEG', yOffset: 34 },
      { name: 'BOT_POS', yOffset: height - 34 },
      { name: 'BOT_NEG', yOffset: height - 22 }
    ];

    rails.forEach((rail) => {
      for (let c = 1; c <= this.cols; c++) {
        const hx = 25 + (c - 1) * this.pitch;
        const hy = rail.yOffset;
        const nodeId = `${this.id}.${rail.name}.${c}`;
        this._drawHole(g, hx, hy, nodeId);
      }
    });

    // Pistas centrales A-E y F-J
    const topRows = ['A', 'B', 'C', 'D', 'E'];
    const botRows = ['F', 'G', 'H', 'I', 'J'];

    for (let c = 1; c <= this.cols; c++) {
      const hx = 25 + (c - 1) * this.pitch;

      topRows.forEach((row, rIdx) => {
        const hy = 58 + rIdx * this.pitch;
        this._drawHole(g, hx, hy, `${this.id}.${row}${c}`);
      });

      botRows.forEach((row, rIdx) => {
        const hy = 152 + rIdx * this.pitch;
        this._drawHole(g, hx, hy, `${this.id}.${row}${c}`);
      });
    }

    this.workspace.layers.boards.appendChild(g);
    this.el = g;

    this._registerLinksAndCoordinates(true);
    return g;
  }

  _drawHole(parent, x, y, nodeId) {
    const rect = document.createElementNS(this.workspace.ns, 'rect');
    rect.setAttribute('x', x - 3.5);
    rect.setAttribute('y', y - 3.5);
    rect.setAttribute('width', '7');
    rect.setAttribute('height', '7');
    rect.setAttribute('rx', '1.5');
    rect.setAttribute('fill', '#334155');
    rect.dataset.nodeId = nodeId;
    parent.appendChild(rect);
  }

  _registerLinksAndCoordinates(initGraphLinks = false) {
    const height = 270;
    const rails = [
      { name: 'TOP_POS', yOffset: 22 },
      { name: 'TOP_NEG', yOffset: 34 },
      { name: 'BOT_POS', yOffset: height - 34 },
      { name: 'BOT_NEG', yOffset: height - 22 }
    ];

    rails.forEach((rail) => {
      let prevNode = null;
      for (let c = 1; c <= this.cols; c++) {
        const hx = 25 + (c - 1) * this.pitch;
        const hy = rail.yOffset;
        const nodeId = `${this.id}.${rail.name}.${c}`;
        this.workspace.registerPinLocation(nodeId, this.x + hx, this.y + hy, { type: 'bb', board: this.id });

        if (initGraphLinks && prevNode) {
          this.graph.addStaticLink(prevNode, nodeId);
        }
        prevNode = nodeId;
      }
    });

    const topRows = ['A', 'B', 'C', 'D', 'E'];
    const botRows = ['F', 'G', 'H', 'I', 'J'];

    for (let c = 1; c <= this.cols; c++) {
      const hx = 25 + (c - 1) * this.pitch;

      topRows.forEach((row, rIdx) => {
        const hy = 58 + rIdx * this.pitch;
        const nodeId = `${this.id}.${row}${c}`;
        this.workspace.registerPinLocation(nodeId, this.x + hx, this.y + hy, { type: 'bb', board: this.id });
        if (initGraphLinks && rIdx > 0) {
          this.graph.addStaticLink(`${this.id}.${topRows[rIdx - 1]}${c}`, nodeId);
        }
      });

      botRows.forEach((row, rIdx) => {
        const hy = 152 + rIdx * this.pitch;
        const nodeId = `${this.id}.${row}${c}`;
        this.workspace.registerPinLocation(nodeId, this.x + hx, this.y + hy, { type: 'bb', board: this.id });
        if (initGraphLinks && rIdx > 0) {
          this.graph.addStaticLink(`${this.id}.${botRows[rIdx - 1]}${c}`, nodeId);
        }
      });
    }
  }

  moveTo(newX, newY) {
    this.x = newX;
    this.y = newY;
    this.el?.setAttribute('transform', `translate(${this.x}, ${this.y})`);
    this._registerLinksAndCoordinates(false);
  }

  setSelected(selected) {
    if (!this.el) return;
    this.el.style.filter = selected ? 'drop-shadow(0 0 10px #38bdf8)' : '';
  }

  destroy() {
    this.el?.remove();
    const prefix = `${this.id}.`;

    for (const key of [...this.workspace.pinCoordinates.keys()]) {
      if (key.startsWith(prefix)) {
        this.workspace.pinCoordinates.delete(key);
      }
    }

    this.graph.staticLinks = this.graph.staticLinks.filter(
      ([a, b]) => !a.startsWith(prefix) && !b.startsWith(prefix)
    );
    this.graph.rebuild();
  }
}