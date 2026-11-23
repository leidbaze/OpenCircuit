// src/canvas/WorkspaceSVG.js
import { ArduinoUnoView } from './ArduinoUnoView.js';
export class WorkspaceSVG {
  constructor(containerEl) {
    this.container = containerEl;
    this.ns = 'http://www.w3.org/2000/svg';
    this.pinCoordinates = new Map();
    this.viewBox = { x: 0, y: 0, w: 1100, h: 720 };
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };

    this._initSVG();
    this._initNavigation();
  }

  _initSVG() {
    this.svg = document.createElementNS(this.ns, 'svg');
    this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.w} ${this.viewBox.h}`);
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.svg.style.background = '#1e293b';
    this.svg.style.userSelect = 'none';
    this.svg.style.cursor = 'grab';

    const defs = document.createElementNS(this.ns, 'defs');
    defs.innerHTML = `
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#334155" stroke-width="0.6"/>
      </pattern>
    `;
    this.svg.appendChild(defs);

    const bg = document.createElementNS(this.ns, 'rect');
    bg.setAttribute('width', '6000');
    bg.setAttribute('height', '6000');
    bg.setAttribute('x', '-2000');
    bg.setAttribute('y', '-2000');
    bg.setAttribute('fill', 'url(#grid)');
    bg.dataset.bg = 'true';
    this.svg.appendChild(bg);

    this.layers = {
      boards: this._createLayer('layer-boards'),
      components: this._createLayer('layer-components'),
      wires: this._createLayer('layer-wires'),
      overlay: this._createLayer('layer-overlay')
    };

    // Anillo resaltador para pines cercanos
    this.hoverRing = document.createElementNS(this.ns, 'circle');
    this.hoverRing.setAttribute('r', '7');
    this.hoverRing.setAttribute('fill', 'rgba(56, 189, 248, 0.25)');
    this.hoverRing.setAttribute('stroke', '#38bdf8');
    this.hoverRing.setAttribute('stroke-width', '2');
    this.hoverRing.style.display = 'none';
    this.hoverRing.style.pointerEvents = 'none';
    this.layers.overlay.appendChild(this.hoverRing);

    this.container.appendChild(this.svg);
  }

  // Reemplaza el método _initNavigation() en src/canvas/WorkspaceSVG.js
  _initNavigation() {
    this.svg.addEventListener('contextmenu', (e) => e.preventDefault());

    // Zoom suave centrado en el cursor con la rueda
    this.svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      const mouse = this.clientToSvg(e.clientX, e.clientY);

      const newW = Math.max(400, Math.min(3000, this.viewBox.w * factor));
      const newH = Math.max(260, Math.min(2000, this.viewBox.h * factor));

      this.viewBox.x = mouse.x - ((mouse.x - this.viewBox.x) / this.viewBox.w) * newW;
      this.viewBox.y = mouse.y - ((mouse.y - this.viewBox.y) / this.viewBox.h) * newH;
      this.viewBox.w = newW;
      this.viewBox.h = newH;
      this._updateViewBox();
    }, { passive: false });

    // Paneo arrastrando el fondo con clic izquierdo (si no estás sobre un pin) o clic central/derecho
    this.svg.addEventListener('pointerdown', (e) => {
      const pt = this.clientToSvg(e.clientX, e.clientY);
      const nearPin = this.findNearestPin(pt.x, pt.y, 11);

      const isEmptyBgLeftClick = e.button === 0 && e.target.dataset.bg === 'true' && !nearPin;
      const isMiddleOrRightClick = e.button === 1 || e.button === 2;

      if (isEmptyBgLeftClick || isMiddleOrRightClick) {
        this.isPanning = true;
        this.panStart = { x: e.clientX, y: e.clientY };
        this.svg.style.cursor = 'grabbing';
      }
    });

    window.addEventListener('pointermove', (e) => {
      const pt = this.clientToSvg(e.clientX, e.clientY);

      if (this.isPanning) {
        const scaleX = this.viewBox.w / this.svg.clientWidth;
        const scaleY = this.viewBox.h / this.svg.clientHeight;
        this.viewBox.x -= (e.clientX - this.panStart.x) * scaleX;
        this.viewBox.y -= (e.clientY - this.panStart.y) * scaleY;
        this.panStart = { x: e.clientX, y: e.clientY };
        this._updateViewBox();
        return;
      }

      // Resaltar pin cercano al cursor
      const nearest = this.findNearestPin(pt.x, pt.y, 11);
      if (nearest) {
        this.hoverRing.setAttribute('cx', nearest.x);
        this.hoverRing.setAttribute('cy', nearest.y);
        this.hoverRing.style.display = 'block';
        this.svg.style.cursor = 'crosshair';
      } else {
        this.hoverRing.style.display = 'none';
        this.svg.style.cursor = 'grab';
      }
    });

    window.addEventListener('pointerup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        this.svg.style.cursor = 'grab';
      }
    });
  }

  _updateViewBox() {
    this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.w} ${this.viewBox.h}`);
  }

  _createLayer(id) {
    const g = document.createElementNS(this.ns, 'g');
    g.setAttribute('id', id);
    this.svg.appendChild(g);
    return g;
  }

  registerPinLocation(nodeId, x, y, meta = {}) {
    this.pinCoordinates.set(nodeId, { nodeId, x, y, ...meta });
  }

  findNearestPin(x, y, maxDist = 14) {
    let best = null;
    let bestDist = maxDist;
    for (const pin of this.pinCoordinates.values()) {
      const d = Math.hypot(pin.x - x, pin.y - y);
      if (d <= bestDist) {
        bestDist = d;
        best = pin;
      }
    }
    return best;
  }

  clientToSvg(clientX, clientY) {
    const pt = this.svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = this.svg.getScreenCTM();
    return ctm ? pt.matrixTransform(ctm.inverse()) : { x: clientX, y: clientY };
  }

  renderArduinoUno(boardId = 'uno', x = 30, y = 55, onResetClick = null) {
    const view = new ArduinoUnoView(this, boardId, x, y, 0.368);
    return view.render(onResetClick);
  }

  _drawBoardPin(parent, x, y, label, labelSide) {
    const hole = document.createElementNS(this.ns, 'rect');
    hole.setAttribute('x', x - 5);
    hole.setAttribute('y', y - 5);
    hole.setAttribute('width', '10');
    hole.setAttribute('height', '10');
    hole.setAttribute('fill', '#0f172a');
    hole.setAttribute('stroke', '#94a3b8');
    hole.setAttribute('stroke-width', '1');
    parent.appendChild(hole);

    const txt = document.createElementNS(this.ns, 'text');
    txt.setAttribute('x', labelSide === 'left' ? x - 10 : x + 10);
    txt.setAttribute('y', y + 3);
    txt.setAttribute('text-anchor', labelSide === 'left' ? 'end' : 'start');
    txt.setAttribute('fill', '#f8fafc');
    txt.setAttribute('font-family', 'monospace');
    txt.setAttribute('font-size', '10');
    txt.textContent = label;
    parent.appendChild(txt);
  }
}