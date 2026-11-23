// Transpilador de cÃ³digo Arduino C++ a JS asÃ­ncrono
// src/mcu/interpreter/CppTranspiler.js
export class CppTranspiler {
  transpile(cppCode) {
    let code = cppCode;

    // 1. Eliminar comentarios de línea y bloque
    code = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

    // 2. Eliminar directivas #include y #define simples -> const
    code = code.replace(/^\s*#include\s+.*$/gm, '');
    code = code.replace(/^\s*#define\s+(\w+)\s+(.+)$/gm, 'const $1 = $2;');

    // 3. Convertir funciones void setup() y void loop() a async function
    code = code.replace(/\bvoid\s+setup\s*\(\s*\)/g, 'async function setup()');
    code = code.replace(/\bvoid\s+loop\s*\(\s*\)/g, 'async function loop()');

    // 4. Convertir otras funciones tipadas (int foo(...), void bar(...))
    code = code.replace(
      /\b(?:void|int|long|float|double|bool|boolean|String|char|byte|unsigned\s+int|unsigned\s+long)\s+(\w+)\s*\(([^)]*)\)\s*\{/g,
      (_, fnName, args) => {
        const cleanArgs = args
          .split(',')
          .map((arg) => arg.trim().split(/\s+/).pop())
          .filter(Boolean)
          .join(', ');
        return `async function ${fnName}(${cleanArgs}) {`;
      }
    );

    // 5. Convertir declaraciones de variables tipadas en 'let'
    code = code.replace(
      /\b(?:const\s+)?(?:int|long|float|double|bool|boolean|String|char|byte|unsigned\s+int|unsigned\s+long)\s+/g,
      'let '
    );

    // 6. Añadir 'await' antes de delay y llamadas a funciones definidas por el usuario
    code = code.replace(/\b(delay|delayMicroseconds)\s*\(/g, 'await $1(');

    // 7. Inyectar __yield() al inicio de bucles while y for para evitar congelamientos
    code = code.replace(/\b(while|for)\s*\(([^)]*)\)\s*\{/g, '$1 ($2) { await __yield(); ');

    // 8. Envolver con el ciclo principal de ejecución
    return `
      ${code}
      if (typeof setup === 'function') {
        await setup();
      }
      while (typeof loop === 'function') {
        await loop();
        await __yield();
      }
    `;
  }

  async run(cppCode, api) {
    const jsBody = this.transpile(cppCode);
    const bindings = api.getBindings();
    const argNames = Object.keys(bindings);
    const argValues = Object.values(bindings);

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const runner = new AsyncFunction(...argNames, jsBody);

    api.resetSignal();
    try {
      await runner(...argValues);
    } catch (err) {
      if (err.message !== 'SIM_ABORTED') {
        throw err;
      }
    }
  }
}