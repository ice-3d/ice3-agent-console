export class ConsoleStatus {
  readonly element: HTMLOutputElement;

  constructor(host: HTMLElement) {
    const document = host.ownerDocument;
    this.element = document.createElement('output');
    this.element.className = 'scene-status';
    this.element.dataset.role = 'scene-status';
    this.element.setAttribute('aria-live', 'polite');
    this.element.textContent = '正在加载场景';
    host.append(this.element);
  }

  set(text: string, kind: 'loading' | 'ready' | 'error' = 'ready'): void {
    this.element.textContent = text;
    this.element.dataset.state = kind;
  }
}
