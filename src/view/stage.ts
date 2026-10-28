export class StageView {
  readonly element: HTMLElement;

  constructor(host: HTMLElement) {
    this.element = host.ownerDocument.createElement('main');
    this.element.id = 'stage';
    this.element.dataset.role = 'stage';
    this.element.setAttribute('aria-busy', 'true');
    this.element.innerHTML = `
      <div class="scene-backdrop" aria-hidden="true"></div>
      <div class="brand-lockup">
        <span class="brand-mark">ICE3</span>
        <span>虚拟市政污水处理厂</span>
      </div>
    `;
    host.append(this.element);
  }

  setReady(): void {
    this.element.setAttribute('aria-busy', 'false');
  }
}
