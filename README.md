# ⚡ OpenCircuit

**OpenCircuit** es un simulador educativo interactivo y de código abierto de circuitos electrónicos y microcontroladores **Arduino UNO**, desarrollado en JavaScript modular moderno (ES Modules) y gráficos vectoriales SVG, diseñado para funcionar de manera rápida, fluida y sin dependencias pesadas en laboratorios escolares.

---

## ✨ Características Principales

* **Mesa de trabajo vectorial interactiva (SVG):**
  * **Arduino UNO R3 realista:** Pines digitales (`D0–D13`), entradas analógicas (`A0–A5`), rieles de alimentación (`5V`, `3.3V`, `GND`), botón físico `RESET` funcional y LEDs SMD integrados (`ON`, `L`, `TX`) animados en tiempo real.
  * **Protoboard de 830 puntos:** Conectividad interna fiel a una placa real (buses superiores e inferiores `+` / `-` y pistas centrales divididas `A–E` y `F–J`).
  * **Navegación fluida:** Zoom centrado en el cursor con la rueda del ratón, paneo libre arrastrando el fondo del plano, acoplamiento automático (*snapping*) de terminales y trazado de cables curvos Bézier.
* **Catálogo extensible de componentes:**
  * **Básicos:** LEDs (rojo, verde, amarillo, azul) con detección de polaridad y alerta de sobrecorriente, resistencias con código de 4 bandas de color dinámicas (`220 Ω`, `330 Ω`, `1 kΩ`, `10 kΩ`) y pulsadores momentáneos.
  * **Sensores:** Potenciómetro (divisor de voltaje ajustable) y fotorresistencia (LDR) con control de luz ambiental.
  * **Actuadores:** Buzzer piezoeléctrico con síntesis de audio real en el navegador mediante **Web Audio API**.
* **Motor de simulación eléctrica y ejecución C++:**
  * Grafo de nodos basado en conjuntos disjuntos (*Union-Find*) con detección de cortocircuitos directos.
  * Transpilador asíncrono de código **Arduino C++** (`setup()`, `loop()`, `pinMode()`, `digitalWrite()`, `digitalRead()`, `analogRead()`, `analogWrite()`, `tone()`, `noTone()`, `millis()`, `delay()`, `Serial`).
  * Monitor Serie integrado y exportación/importación de prácticas en formato `.json`.

---

## 🏗️ Arquitectura del Proyecto

El sistema sigue un patrón **Event-Driven (Pub/Sub)** que desacopla por completo el cálculo eléctrico y la emulación del microcontrolador de la capa de renderizado visual:

```text
OpenCircuit/
├── index.html                  # Contenedor principal y estilos base de la interfaz
├── package.json                # Configuración de scripts y Vite
├── public/
│   └── assets/                 # Recursos estáticos
└── src/
    ├── main.js                 # Punto de entrada: orquesta Core, MCU, Canvas, UI y Presets
    ├── core/                   # Lógica eléctrica pura (sin dependencias del DOM)
    │   ├── EventBus.js         # Bus de eventos Pub/Sub desacoplado
    │   ├── CircuitGraph.js     # Topología de redes eléctricas (Union-Find)
    │   ├── ElectricalSolver.js # Resolución de voltajes, PWM y cortocircuitos
    │   └── SimulationClock.js  # Reloj virtual sincronizado (millis, micros)
    ├── mcu/                    # Emulación de microcontroladores
    │   ├── BoardInterface.js   # Interfaz abstracta para placas de desarrollo
    │   ├── ArduinoUno.js       # Mapa de pines y capacidades del Arduino UNO
    │   └── interpreter/        # Ejecución de código de usuario
    │       ├── CppTranspiler.js# Conversión de C++ Arduino a JS asíncrono seguro
    │       └── ArduinoAPI.js   # Implementación de funciones estándar de Arduino
    ├── components/             # Catálogo modular de componentes electrónicos
    │   ├── BaseComponent.js    # Clase base para todos los componentes
    │   ├── registry.js         # Registro centralizado del catálogo
    │   ├── basic/              # Led.js, Resistor.js, PushButton.js
    │   ├── sensors/            # Potentiometer.js, LdrSensor.js
    │   └── actuators/          # PiezoBuzzer.js
    ├── canvas/                 # Renderizado vectorial e interacción (SVG)
    │   ├── WorkspaceSVG.js     # Lienzo principal, zoom, paneo y capas
    │   ├── ArduinoUnoView.js   # Renderizado realista e interactivo de Arduino UNO
    │   ├── BreadboardView.js   # Renderizado y nodos de la protoboard
    │   ├── WireManager.js      # Gestión de cables curvos Bézier
    │   └── InteractionMgr.js   # Selección, arrastre, rotación y snapping
    ├── ui/                     # Componentes de interfaz de usuario
    │   ├── Toolbar.js          # Controles de simulación, presets y guardado
    │   ├── ComponentPalette.js # Paleta visual con miniaturas SVG e inspector
    │   ├── CodeEditor.js       # Editor de código Arduino C++
    │   └── SerialMonitor.js    # Consola Serial y alertas del circuito
    └── storage/                # Persistencia
        └── ProjectSerializer.js# Exportación e importación de circuitos en JSON
```

---

## 🚀 Instalación y Uso Local

### Requisitos previos
* [Node.js](https://nodejs.org/) (versión 18 o superior recomendada).

### Pasos para ejecutar en desarrollo
1. Clona o descarga este repositorio y entra en la carpeta del proyecto:
   ```bash
   cd OpenCircuit
   ```
2. Instala las dependencias de desarrollo (Vite):
   ```bash
   npm install
   ```
3. Inicia el servidor local:
   ```bash
   npm run dev
   ```
4. Abre en tu navegador la dirección indicada en la terminal (por defecto `http://localhost:5173/`).

### Compilar para uso offline en laboratorio
Para generar una versión estática lista para distribuirse o abrirse en equipos sin entorno de desarrollo:
```bash
npm run build
```
Los archivos optimizados se generarán dentro de la carpeta `dist/`.

---

## ⌨️ Controles y Atajos de Teclado

| Acción | Control |
| :--- | :--- |
| **Mover el plano (Paneo)** | Mantener **clic izquierdo** en el fondo vacío y arrastrar (o clic derecho/central) |
| **Acercar / Alejar (Zoom)** | Girar la **rueda del ratón** sobre el lienzo |
| **Conectar un cable** | **Clic izquierdo** en un pin/agujero de origen y luego en el de destino |
| **Borrar un cable** | **Clic derecho** sobre el cable (o seleccionarlo y pulsar `Supr` / `Backspace`) |
| **Mover componente** | Arrastrar con **clic izquierdo**; sus pines se alinearán al soltar sobre la protoboard |
| **Rotar componente** | Seleccionar componente y pulsar la tecla **`R`** |
| **Eliminar componente** | Seleccionar componente y pulsar **`Supr`** o **`Backspace`** |

---

## 🧩 Cómo agregar un nuevo componente

Gracias al patrón de registro (`registry.js`), añadir un nuevo componente no requiere modificar el motor eléctrico ni la interfaz:

1. Crea una nueva clase dentro de `src/components/` heredando de `BaseComponent`.
2. Define sus terminales (`this.pins`), su comportamiento eléctrico (`propagate` o `evaluate`) y su representación gráfica (`render`).
3. Regístralo en `src/components/registry.js` dentro de `ComponentCatalog`. Automáticamente aparecerá con su miniatura en la barra lateral y será compatible con el guardado en JSON.

---

## 📄 Licencia

Proyecto educativo de código abierto. Libre para usar, modificar y distribuir en entornos académicos y de aprendizaje.