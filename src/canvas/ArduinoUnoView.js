// Renderizado y coordenadas de el arduino UNO
// src/canvas/ArduinoUnoView.js
import { bus } from '../core/EventBus.js';

export class ArduinoUnoView {
  constructor(workspace, boardId = 'uno', x = 30, y = 55, scale = 0.368) {
    this.workspace = workspace;
    this.boardId = boardId;
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.el = null;
  }

  render(onResetClick) {
    const ns = this.workspace.ns;
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('transform', `translate(${this.x}, ${this.y}) scale(${this.scale})`);
    g.dataset.boardId = this.boardId;

    g.innerHTML = `
      <defs>
        <filter id="unoDropShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="2" dy="4" stdDeviation="2" flood-color="#000000" flood-opacity="0.25" />
        </filter>
        <g id="female-pin">
          <rect x="0" y="0" width="38" height="42" fill="#0d0d0d" />
          <polygon points="3,3 35,3 31,8 7,8" fill="#595959" />
          <polygon points="3,39 35,39 31,34 7,34" fill="#262626" />
          <polygon points="3,3 7,8 7,34 3,39" fill="#404040" />
          <polygon points="35,3 31,8 31,34 35,39" fill="#404040" />
          <rect x="8" y="9" width="22" height="24" fill="#000000" />
        </g>
        <g id="icsp-pair-v">
          <rect x="0" y="0" width="32" height="72" rx="4" fill="#4d4d4d" stroke="#222" stroke-width="1" />
          <circle cx="16" cy="18" r="6" fill="#999999" />
          <circle cx="15" cy="17" r="3" fill="#cccccc" />
          <circle cx="16" cy="54" r="6" fill="#999999" />
          <circle cx="15" cy="53" r="3" fill="#cccccc" />
        </g>
        <g id="icsp-pair-h">
          <rect x="0" y="0" width="72" height="32" rx="4" fill="#4d4d4d" stroke="#222" stroke-width="1" />
          <circle cx="18" cy="16" r="6" fill="#999999" />
          <circle cx="17" cy="15" r="3" fill="#cccccc" />
          <circle cx="54" cy="16" r="6" fill="#999999" />
          <circle cx="53" cy="15" r="3" fill="#cccccc" />
        </g>
        <g id="electrolytic-cap">
          <circle cx="48" cy="48" r="48" fill="#8c8c8c" filter="url(#unoDropShadow)" />
          <circle cx="48" cy="48" r="42" fill="#b3b3b3" />
          <path d="M 8,62 A 42,42 0 0,0 88,62 Z" fill="#4d4d4d" />
        </g>
      </defs>

      <!-- PCB -->
      <path d="M 101,0 L 1068,0 L 1088,20 L 1088,195 L 1126,233 L 1126,742 L 1088,780 L 1088,800 L 101,800 Z" fill="#236b99" />
      <circle cx="326" cy="42" r="24" fill="#1e293b" />
      <circle cx="1088" cy="266" r="24" fill="#1e293b" />
      <circle cx="1088" cy="688" r="24" fill="#1e293b" />
      <circle cx="310" cy="762" r="24" fill="#1e293b" />

      <!-- Conector USB -->
      <g id="usb-connector">
        <circle cx="148" cy="175" r="25" fill="#b3b3b3" />
        <circle cx="148" cy="353" r="25" fill="#b3b3b3" />
        <rect x="0" y="175" width="246" height="178" fill="#bfbfbf" filter="url(#unoDropShadow)" />
        <rect x="0" y="175" width="246" height="178" fill="none" stroke="#808080" stroke-width="2" />
        <rect x="6" y="180" width="234" height="168" fill="#999999" stroke="#666666" stroke-width="2" />
      </g>

      <!-- Jack de alimentación -->
      <g id="power-jack">
        <rect x="52" y="628" width="202" height="126" fill="#3b3b3b" />
        <rect x="52" y="603" width="56" height="174" rx="28" fill="#3b3b3b" />
        <rect x="60" y="611" width="38" height="136" rx="19" fill="#636363" />
        <path d="M 108,638 L 252,638 L 252,647 L 266,647 L 266,738 L 155,738 C 125,738 112,718 112,688 Z" fill="#666666" />
      </g>

      <!-- Botón físico RESET interactivo -->
      <g id="uno-reset-btn" filter="url(#unoDropShadow)" style="cursor:pointer;">
        <rect x="125" y="36" width="20" height="20" fill="#bfbfbf" />
        <rect x="125" y="67" width="20" height="20" fill="#bfbfbf" />
        <rect x="125" y="99" width="20" height="20" fill="#bfbfbf" />
        <rect x="242" y="36" width="21" height="20" fill="#bfbfbf" />
        <rect x="242" y="99" width="21" height="20" fill="#bfbfbf" />
        <rect x="145" y="29" width="97" height="97" fill="#999999" />
        <circle cx="192" cy="80" r="28" fill="#595959" />
        <circle cx="191" cy="77" r="28" fill="#cc2222" />
      </g>

      <!-- Headers hembra superiores (Digitales) -->
      <g transform="translate(359, 18)">
        ${Array.from({ length: 10 }, (_, i) => `<use href="#female-pin" x="${i * 38}" y="0" />`).join('')}
      </g>
      <g transform="translate(762, 18)">
        ${Array.from({ length: 8 }, (_, i) => `<use href="#female-pin" x="${i * 38}" y="0" />`).join('')}
      </g>

      <!-- Headers hembra inferiores (Power y Analog In) -->
      <g transform="translate(495, 740)">
        ${Array.from({ length: 8 }, (_, i) => `<use href="#female-pin" x="${i * 38}" y="0" />`).join('')}
      </g>
      <g transform="translate(835, 740)">
        ${Array.from({ length: 6 }, (_, i) => `<use href="#female-pin" x="${i * 38}" y="0" />`).join('')}
      </g>

      <!-- Pines ICSP -->
      <g transform="translate(310, 81)">
        <use href="#icsp-pair-v" x="0" y="0" />
        <use href="#icsp-pair-v" x="36" y="0" />
        <use href="#icsp-pair-v" x="72" y="0" />
      </g>
      <g transform="translate(1043, 307)">
        <use href="#icsp-pair-h" x="0" y="0" />
        <use href="#icsp-pair-h" x="0" y="36" />
        <use href="#icsp-pair-h" x="0" y="72" />
      </g>

      <!-- ATmega16U2 y Cristal -->
      <g transform="translate(341, 241)">
        <g fill="#b3b3b3">
          <rect x="14" y="0" width="7" height="8" /><rect x="26" y="0" width="7" height="8" />
          <rect x="38" y="0" width="7" height="8" /><rect x="50" y="0" width="7" height="8" />
          <rect x="62" y="0" width="7" height="8" /><rect x="74" y="0" width="7" height="8" />
          <rect x="14" y="88" width="7" height="8" /><rect x="26" y="88" width="7" height="8" />
          <rect x="38" y="88" width="7" height="8" /><rect x="50" y="88" width="7" height="8" />
          <rect x="62" y="88" width="7" height="8" /><rect x="74" y="88" width="7" height="8" />
          <rect x="0" y="14" width="8" height="7" /><rect x="0" y="26" width="8" height="7" />
          <rect x="0" y="38" width="8" height="7" /><rect x="0" y="50" width="8" height="7" />
          <rect x="0" y="62" width="8" height="7" /><rect x="0" y="74" width="8" height="7" />
          <rect x="88" y="14" width="8" height="7" /><rect x="88" y="26" width="8" height="7" />
          <rect x="88" y="38" width="8" height="7" /><rect x="88" y="50" width="8" height="7" />
          <rect x="88" y="62" width="8" height="7" /><rect x="88" y="74" width="8" height="7" />
        </g>
        <rect x="8" y="8" width="80" height="80" fill="#333333" />
      </g>

      <g transform="translate(298, 371)">
        <rect x="0" y="0" width="194" height="81" rx="40.5" fill="#d9d9d9" />
        <rect x="11" y="11" width="172" height="59" rx="29.5" fill="#999999" />
        <rect x="11" y="11" width="172" height="51" rx="25.5" fill="#bfbfbf" />
      </g>

      <!-- Microcontrolador ATmega328P DIP -->
      <g transform="translate(515, 496)">
        <rect x="0" y="0" width="553" height="135" fill="#333333" />
        <g fill="#a6a6a6">
          ${Array.from({ length: 14 }, (_, i) => `
            <rect x="${18 + i * 37}" y="2" width="15" height="6" />
            <rect x="${18 + i * 37}" y="127" width="15" height="6" />
          `).join('')}
        </g>
        <rect x="8" y="12" width="537" height="111" fill="#595959" />
        <circle cx="80" cy="71" r="20" fill="#383838" />
        <circle cx="465" cy="71" r="20" fill="#383838" />
        <path d="M 545,48 A 23,23 0 0,0 545,94 Z" fill="#383838" />
        <path d="M 545,54 A 17,17 0 0,0 545,88 Z" fill="#595959" />
      </g>

      <!-- Regulador de voltaje y componentes SMD -->
      <g transform="translate(154, 498)">
        <rect x="0" y="25" width="23" height="52" fill="#cccccc" />
        <line x1="7" y1="25" x2="7" y2="77" stroke="#999999" stroke-width="2" />
        <line x1="15" y1="25" x2="15" y2="77" stroke="#999999" stroke-width="2" />
        <rect x="23" y="0" width="56" height="98" fill="#595959" />
        <rect x="79" y="10" width="31" height="18" fill="#b3b3b3" />
        <rect x="79" y="40" width="31" height="18" fill="#b3b3b3" />
        <rect x="79" y="70" width="31" height="18" fill="#b3b3b3" />
      </g>

      <g transform="translate(116, 394)">
        <rect x="0" y="0" width="58" height="88" fill="#b3b3b3" />
        <rect x="0" y="12" width="58" height="64" fill="#9c8647" />
        <rect x="13" y="22" width="32" height="44" fill="#7d6b38" />
      </g>

      <g transform="translate(190, 405)">
        <rect x="13" y="0" width="24" height="45" fill="#333333" />
        <rect x="0" y="18" width="13" height="9" fill="#b3b3b3" />
        <rect x="37" y="7" width="14" height="9" fill="#b3b3b3" />
        <rect x="37" y="30" width="14" height="9" fill="#b3b3b3" />
      </g>

      <g transform="translate(345, 481)">
        <rect x="12" y="0" width="48" height="46" fill="#333333" />
        <g fill="#b3b3b3">
          <rect x="0" y="4" width="12" height="7" /><rect x="0" y="15" width="12" height="7" />
          <rect x="0" y="25" width="12" height="7" /><rect x="0" y="36" width="12" height="7" />
          <rect x="60" y="4" width="12" height="7" /><rect x="60" y="15" width="12" height="7" />
          <rect x="60" y="25" width="12" height="7" /><rect x="60" y="36" width="12" height="7" />
        </g>
      </g>

      <g transform="translate(399, 560)">
        <rect x="13" y="0" width="24" height="46" fill="#333333" />
        <g fill="#b3b3b3">
          <rect x="0" y="5" width="13" height="7" /><rect x="0" y="19" width="13" height="7" />
          <rect x="0" y="34" width="13" height="7" />
          <rect x="37" y="5" width="13" height="7" /><rect x="37" y="34" width="13" height="7" />
        </g>
      </g>

      <use href="#electrolytic-cap" x="304" y="627" />
      <use href="#electrolytic-cap" x="415" y="627" />

      <!-- LEDs SMD Integrados (L, TX, RX, ON) -->
      <g transform="translate(494, 171)">
        <rect x="0" y="3" width="46" height="18" fill="#cccccc" />
        <rect x="11" y="0" width="24" height="24" fill="#ffffff" stroke="#b3b3b3" stroke-width="1.5" />
        <rect id="smd-led-l" x="14" y="4" width="18" height="16" fill="#f2f2f2" />
      </g>
      <g transform="translate(494, 243)">
        <rect x="0" y="3" width="46" height="18" fill="#cccccc" />
        <rect x="11" y="0" width="24" height="24" fill="#ffffff" stroke="#b3b3b3" stroke-width="1.5" />
        <rect id="smd-led-tx" x="14" y="4" width="18" height="16" fill="#f2f2f2" />
      </g>
      <g transform="translate(494, 285)">
        <rect x="0" y="3" width="46" height="18" fill="#cccccc" />
        <rect x="11" y="0" width="24" height="24" fill="#ffffff" stroke="#b3b3b3" stroke-width="1.5" />
        <rect id="smd-led-rx" x="14" y="4" width="18" height="16" fill="#f2f2f2" />
      </g>
      <g transform="translate(967, 244)">
        <rect x="0" y="3" width="46" height="18" fill="#cccccc" />
        <rect x="11" y="0" width="24" height="24" fill="#ffffff" stroke="#b3b3b3" stroke-width="1.5" />
        <rect id="smd-led-on" x="14" y="4" width="18" height="16" fill="#f2f2f2" />
      </g>

      <!-- Serigrafía blanca -->
      <g fill="#ffffff" font-family="Arial, Helvetica, sans-serif">
        <g transform="translate(571, 171)">
          <path d="M 45,0 C 20,0 0,20 0,45 C 0,70 20,90 45,90 C 66,90 79,76 90,62 C 101,76 114,90 135,90 C 160,90 180,70 180,45 C 180,20 160,0 135,0 C 114,0 101,14 90,28 C 79,14 66,0 45,0 Z M 45,14 C 60,14 71,24 81,38 C 83,41 85,43 86,45 C 85,47 83,49 81,52 C 71,66 60,76 45,76 C 28,76 14,62 14,45 C 14,28 28,14 45,14 Z M 135,14 C 152,14 166,28 166,45 C 166,62 152,76 135,76 C 120,76 109,66 99,52 C 97,49 95,47 94,45 C 95,43 97,41 99,38 C 109,24 120,14 135,14 Z" />
          <rect x="33" y="42" width="23" height="6" />
          <rect x="122" y="42" width="24" height="6" />
          <rect x="131" y="33" width="6" height="24" />
        </g>

        <text x="576" y="302" font-size="37" font-weight="bold" letter-spacing="2.5">ARDUINO</text>
        <rect x="775" y="178" width="178" height="81" rx="16" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="2,2" />
        <text x="790" y="247" font-size="80" font-weight="normal" letter-spacing="1">UNO</text>

        <text x="467" y="192" font-size="27">L</text>
        <text x="449" y="266" font-size="27">TX</text>
        <text x="450" y="309" font-size="27">RX</text>
        <text x="1024" y="263" font-size="27">ON</text>

        <text x="712" y="141" font-size="27" font-weight="bold" letter-spacing="1">DIGITAL (PWM ~)</text>
        <line x1="523" y1="156" x2="1057" y2="156" stroke="#ffffff" stroke-width="2.5" />

        <text x="688" y="675" font-size="27" font-weight="bold" letter-spacing="1">POWER</text>
        <line x1="605" y1="643" x2="797" y2="643" stroke="#ffffff" stroke-width="2.5" />

        <text x="888" y="675" font-size="27" font-weight="bold" letter-spacing="1">ANALOG IN</text>
        <line x1="841" y1="643" x2="1057" y2="643" stroke="#ffffff" stroke-width="2.5" />

        <g font-size="26" text-anchor="end">
          <text transform="translate(466, 75) rotate(-90)">AREF</text>
          <text transform="translate(504, 75) rotate(-90)">GND</text>
          <text transform="translate(540, 75) rotate(-90)">13</text>
          <text transform="translate(580, 75) rotate(-90)">12</text>
          <text transform="translate(618, 75) rotate(-90)">~11</text>
          <text transform="translate(656, 75) rotate(-90)">~10</text>
          <text transform="translate(694, 75) rotate(-90)">~9</text>
          <text transform="translate(730, 75) rotate(-90)">8</text>
          <text transform="translate(790, 75) rotate(-90)">7</text>
          <text transform="translate(828, 75) rotate(-90)">~6</text>
          <text transform="translate(868, 75) rotate(-90)">~5</text>
          <text transform="translate(906, 75) rotate(-90)">4</text>
          <text transform="translate(944, 75) rotate(-90)">~3</text>
          <text transform="translate(984, 75) rotate(-90)">2</text>
          <text transform="translate(1022, 75) rotate(-90)">TX→1</text>
          <text transform="translate(1060, 75) rotate(-90)">RX←0</text>
        </g>

        <g font-size="26" text-anchor="start">
          <text transform="translate(565, 734) rotate(-90)">IOREF</text>
          <text transform="translate(603, 734) rotate(-90)">RESET</text>
          <text transform="translate(641, 734) rotate(-90)">3.3V</text>
          <text transform="translate(679, 734) rotate(-90)">5V</text>
          <text transform="translate(717, 734) rotate(-90)">GND</text>
          <text transform="translate(757, 734) rotate(-90)">GND</text>
          <text transform="translate(795, 734) rotate(-90)">Vin</text>
        </g>

        <g font-size="26" text-anchor="start">
          <text transform="translate(868, 734) rotate(-90)">A0</text>
          <text transform="translate(906, 734) rotate(-90)">A1</text>
          <text transform="translate(944, 734) rotate(-90)">A2</text>
          <text transform="translate(982, 734) rotate(-90)">A3</text>
          <text transform="translate(1020, 734) rotate(-90)">A4</text>
          <text transform="translate(1058, 734) rotate(-90)">A5</text>
        </g>
      </g>
    `;

    this.workspace.layers.boards.appendChild(g);
    this.el = g;

    this._registerAllPins();
    this._bindInteractions(onResetClick);
    return g;
  }

  _registerAllPins() {
    // Mapeo exacto al centro de cada socket #female-pin (+19, +21 en coordenadas internas)
    const pinMap = [
      // Header superior izquierdo (x base = 359, y base = 18)
      { name: 'SCL', x: 359 + 19, y: 18 + 21 },
      { name: 'SDA', x: 359 + 38 + 19, y: 18 + 21 },
      { name: 'AREF', x: 359 + 76 + 19, y: 18 + 21 },
      { name: 'GND3', x: 359 + 114 + 19, y: 18 + 21 },
      { name: '13', x: 359 + 152 + 19, y: 18 + 21 },
      { name: '12', x: 359 + 190 + 19, y: 18 + 21 },
      { name: '11', x: 359 + 228 + 19, y: 18 + 21 },
      { name: '10', x: 359 + 266 + 19, y: 18 + 21 },
      { name: '9', x: 359 + 304 + 19, y: 18 + 21 },
      { name: '8', x: 359 + 342 + 19, y: 18 + 21 },

      // Header superior derecho (x base = 762, y base = 18)
      { name: '7', x: 762 + 19, y: 18 + 21 },
      { name: '6', x: 762 + 38 + 19, y: 18 + 21 },
      { name: '5', x: 762 + 76 + 19, y: 18 + 21 },
      { name: '4', x: 762 + 114 + 19, y: 18 + 21 },
      { name: '3', x: 762 + 152 + 19, y: 18 + 21 },
      { name: '2', x: 762 + 190 + 19, y: 18 + 21 },
      { name: '1', x: 762 + 228 + 19, y: 18 + 21 },
      { name: '0', x: 762 + 266 + 19, y: 18 + 21 },

      // Header inferior POWER (x base = 495, y base = 740)
      { name: 'NC', x: 495 + 19, y: 740 + 21 },
      { name: 'IOREF', x: 495 + 38 + 19, y: 740 + 21 },
      { name: 'RESET', x: 495 + 76 + 19, y: 740 + 21 },
      { name: '3.3V', x: 495 + 114 + 19, y: 740 + 21 },
      { name: '5V', x: 495 + 152 + 19, y: 740 + 21 },
      { name: 'GND1', x: 495 + 190 + 19, y: 740 + 21 },
      { name: 'GND2', x: 495 + 228 + 19, y: 740 + 21 },
      { name: 'VIN', x: 495 + 266 + 19, y: 740 + 21 },

      // Header inferior ANALOG IN (x base = 835, y base = 740)
      { name: 'A0', x: 835 + 19, y: 740 + 21 },
      { name: 'A1', x: 835 + 38 + 19, y: 740 + 21 },
      { name: 'A2', x: 835 + 76 + 19, y: 740 + 21 },
      { name: 'A3', x: 835 + 114 + 19, y: 740 + 21 },
      { name: 'A4', x: 835 + 152 + 19, y: 740 + 21 },
      { name: 'A5', x: 835 + 190 + 19, y: 740 + 21 }
    ];

    pinMap.forEach((p) => {
      const worldX = this.x + p.x * this.scale;
      const worldY = this.y + p.y * this.scale;
      this.workspace.registerPinLocation(`${this.boardId}.${p.name}`, worldX, worldY, {
        board: this.boardId,
        pinName: p.name
      });
    });
  }

  _bindInteractions(onResetClick) {
    const ledL = this.el.querySelector('#smd-led-l');
    const ledTx = this.el.querySelector('#smd-led-tx');
    const ledOn = this.el.querySelector('#smd-led-on');
    const resetBtn = this.el.querySelector('#uno-reset-btn');

    if (resetBtn && onResetClick) {
      resetBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        onResetClick();
      });
    }

    // LED ON encendido al iniciar simulación
    bus.on('sim:start', () => ledOn?.setAttribute('fill', '#22c55e'));
    bus.on('sim:stop', () => {
      ledOn?.setAttribute('fill', '#f2f2f2');
      ledL?.setAttribute('fill', '#f2f2f2');
      ledTx?.setAttribute('fill', '#f2f2f2');
    });

    // LED integrado L conectado al Pin 13
    bus.on('board:pinChanged', ({ pin, state }) => {
      if (String(pin) === '13') {
        const active = state.voltage !== null && state.voltage > 2.5;
        ledL?.setAttribute('fill', active ? '#f59e0b' : '#f2f2f2');
      }
    });

    // Parpadeo breve en LED TX cuando se usa Serial.print
    bus.on('serial:print', () => {
      ledTx?.setAttribute('fill', '#f59e0b');
      setTimeout(() => ledTx?.setAttribute('fill', '#f2f2f2'), 70);
    });
  }
moveTo(newX, newY) {
    this.x = newX;
    this.y = newY;
    this.el?.setAttribute('transform', `translate(${this.x}, ${this.y}) scale(${this.scale})`);
    this._registerAllPins();
  }

  setSelected(selected) {
    if (!this.el) return;
    this.el.style.filter = selected ? 'drop-shadow(0 0 10px #38bdf8)' : '';
  }

  destroy() {
    this.el?.remove();
    for (const key of [...this.workspace.pinCoordinates.keys()]) {
      if (key.startsWith(`${this.boardId}.`)) {
        this.workspace.pinCoordinates.delete(key);
      }
    }
  }
}
