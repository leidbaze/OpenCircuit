// Wrapper del editor de cÃ³digo o bloques
// src/ui/CodeEditor.js
export class CodeEditor {
  constructor(containerEl, initialCode = '') {
    this.container = containerEl;
    this.render(initialCode);
  }

  render(initialCode) {
    this.container.innerHTML = `
      <div class="editor-header">
        <span>Código Arduino (C++)</span>
      </div>
      <textarea id="code-textarea" spellcheck="false">${initialCode}</textarea>
    `;
    this.textarea = this.container.querySelector('#code-textarea');

    // Soporte de tabulación con 2 espacios dentro del editor
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        this.textarea.value =
          this.textarea.value.substring(0, start) + '  ' + this.textarea.value.substring(end);
        this.textarea.selectionStart = this.textarea.selectionEnd = start + 2;
      }
    });
  }

  getCode() {
    return this.textarea.value;
  }

  setCode(code) {
    this.textarea.value = code;
  }
}