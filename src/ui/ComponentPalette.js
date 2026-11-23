// src/ui/ComponentPalette.js
import { ComponentCatalog, createComponent } from '../components/registry.js';
import { bus } from '../core/EventBus.js';

export class ComponentPalette {
  constructor(containerEl, onSpawnComponent) {
    this.container = containerEl;
    this.onSpawnComponent = onSpawnComponent;
    this.render();

    bus.on('ui:componentSelected', ({ component }) => this.renderInspector(component));
  }

  _buildThumbnailSVG(type) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '-36 -30 72 60');
    svg.style.width = '54px';
    svg.style.height = '44px';
    svg.style.overflow = 'visible';

    const previewComp = createComponent(type, `preview_${type}`, { x: 0, y: 0 });
    previewComp.render(svg);
    return svg;
  }

  render() {
    this.container.innerHTML = `
      <div class="sidebar-section">
        <h3>Componentes</h3>
        <div id="palette-list" style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;"></div>
      </div>
      <div class="sidebar-section">
        <h3>Inspector</h3>
        <div id="inspector-panel" class="inspector-box">
          <p class="muted">Haz clic en un componente o cable para editarlo.</p>
        </div>
      </div>
      <div class="sidebar-section">
        <h3>Atajos</h3>
        <div class="inspector-box muted" style="line-height:1.5;">
          • <b>Rueda:</b> Zoom<br/>
          • <b>Clic der. fondo:</b> Mover mesa<br/>
          • <b>Clic der. cable:</b> Borrar cable<br/>
          • <b>Tecla R / Supr:</b> Rotar / Borrar
        </div>
      </div>
    `;

    const listEl = this.container.querySelector('#palette-list');
    // Tarjeta especial para añadir placas Arduino UNO
    const unoBtn = document.createElement('button');
    unoBtn.className = 'palette-item';
    unoBtn.style.cssText = 'flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:8px 4px;';
    unoBtn.innerHTML = `
      <svg viewBox="0 0 112 80" style="width:54px;height:44px;">
        <rect x="6" y="4" width="100" height="72" rx="6" fill="#236b99" />
        <rect x="2" y="16" width="22" height="18" fill="#bfbfbf" />
        <rect x="4" y="54" width="18" height="16" fill="#3b3b3b" />
        <rect x="48" y="46" width="50" height="14" fill="#333333" />
        <text x="42" y="32" fill="#fff" font-size="11" font-weight="bold" font-family="sans-serif">UNO</text>
      </svg>
      <span class="item-name" style="font-size:0.75rem;text-align:center;">Arduino UNO</span>
    `;
    unoBtn.addEventListener('click', () => this.onSpawnComponent('arduino_uno'));
    listEl.appendChild(unoBtn);
    // Tarjeta especial para añadir Protoboards
    const bbBtn = document.createElement('button');
    bbBtn.className = 'palette-item';
    bbBtn.style.cssText = 'flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:8px 4px;';
    bbBtn.innerHTML = `
      <svg viewBox="0 0 112 80" style="width:54px;height:44px;">
        <rect x="6" y="14" width="100" height="52" rx="4" fill="#f8fafc" stroke="#94a3b8" stroke-width="2" />
        <line x1="12" y1="20" x2="100" y2="20" stroke="#ef4444" stroke-width="1.5" />
        <line x1="12" y1="60" x2="100" y2="60" stroke="#2563eb" stroke-width="1.5" />
        <rect x="10" y="38" width="92" height="4" fill="#cbd5e1" />
        <g fill="#334155">
          <circle cx="22" cy="30" r="1.5" /><circle cx="34" cy="30" r="1.5" /><circle cx="46" cy="30" r="1.5" />
          <circle cx="58" cy="30" r="1.5" /><circle cx="70" cy="30" r="1.5" /><circle cx="82" cy="30" r="1.5" />
          <circle cx="22" cy="50" r="1.5" /><circle cx="34" cy="50" r="1.5" /><circle cx="46" cy="50" r="1.5" />
          <circle cx="58" cy="50" r="1.5" /><circle cx="70" cy="50" r="1.5" /><circle cx="82" cy="50" r="1.5" />
        </g>
      </svg>
      <span class="item-name" style="font-size:0.75rem;text-align:center;">Protoboard</span>
    `;
    bbBtn.addEventListener('click', () => this.onSpawnComponent('breadboard'));
    listEl.appendChild(bbBtn);
    ComponentCatalog.forEach((item) => {
      const btn = document.createElement('button');
      btn.className = 'palette-item';
      btn.style.flexDirection = 'column';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.gap = '4px';
      btn.style.padding = '8px 4px';

      const thumb = this._buildThumbnailSVG(item.type);
      const label = document.createElement('span');
      label.className = 'item-name';
      label.style.fontSize = '0.75rem';
      label.style.textAlign = 'center';
      label.textContent = item.name;

      btn.appendChild(thumb);
      btn.appendChild(label);
      btn.addEventListener('click', () => this.onSpawnComponent(item.type));
      listEl.appendChild(btn);
    });
  }

  renderInspector(component) {
    const panel = this.container.querySelector('#inspector-panel');
    if (!component) {
      panel.innerHTML = `<p class="muted">Haz clic en un componente o cable para editarlo.</p>`;
      return;
    }

    const controls = component.getInspectorControls();
    if (controls.length === 0) {
      panel.innerHTML = `<p><strong>${component.type.toUpperCase()}</strong></p><p class="muted">Sin propiedades configurables.</p>`;
      return;
    }

    panel.innerHTML = `<p><strong>${component.type.toUpperCase()}</strong></p>`;
    controls.forEach((ctrl) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'control-row';
      wrapper.innerHTML = `<label>${ctrl.label}</label>`;

      if (ctrl.type === 'select') {
        const select = document.createElement('select');
        select.className = 'select-input';
        ctrl.options.forEach((opt) => {
          const o = document.createElement('option');
          o.value = opt.value;
          o.textContent = opt.label;
          if (String(component.props[ctrl.key]) === String(opt.value)) o.selected = true;
          select.appendChild(o);
        });
        select.addEventListener('change', (e) => {
          component.props[ctrl.key] = isNaN(e.target.value) ? e.target.value : Number(e.target.value);
          component.el?.replaceWith(component.render(component.el.parentNode));
          bus.emit('circuit:changed');
        });
        wrapper.appendChild(select);
      } else if (ctrl.type === 'range') {
        const input = document.createElement('input');
        input.type = 'range';
        input.min = ctrl.min;
        input.max = ctrl.max;
        input.step = ctrl.step;
        input.value = component.props[ctrl.key];
        input.addEventListener('input', (e) => {
          component.props[ctrl.key] = Number(e.target.value);
          component.updateVisuals();
        });
        wrapper.appendChild(input);
      }

      panel.appendChild(wrapper);
    });
  }
}