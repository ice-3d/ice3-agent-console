import type { EquipmentSummary } from '../../shared/scene.js';

export class EquipmentCard {
  readonly element: HTMLElement;
  private readonly name: HTMLElement;
  private readonly tag: HTMLElement;
  private readonly stage: HTMLElement;
  private readonly area: HTMLElement;
  private readonly connections: HTMLElement;

  constructor(host: HTMLElement) {
    const document = host.ownerDocument;
    this.element = document.createElement('section');
    this.element.className = 'equipment-card';
    this.element.dataset.role = 'equipment-card';
    this.element.hidden = true;
    this.element.innerHTML = `
      <span class="eyebrow">EQUIPMENT FOCUS</span>
      <h2 data-role="selection-name"></h2>
      <dl>
        <div><dt>设备编号</dt><dd data-role="selection-tag"></dd></div>
        <div><dt>工艺段</dt><dd data-role="selection-stage"></dd></div>
        <div><dt>所属区域</dt><dd data-role="selection-area"></dd></div>
        <div><dt>流程连接</dt><dd data-role="selection-connections"></dd></div>
      </dl>
    `;
    host.append(this.element);
    this.name = this.element.querySelector('[data-role="selection-name"]')!;
    this.tag = this.element.querySelector('[data-role="selection-tag"]')!;
    this.stage = this.element.querySelector('[data-role="selection-stage"]')!;
    this.area = this.element.querySelector('[data-role="selection-area"]')!;
    this.connections = this.element.querySelector(
      '[data-role="selection-connections"]',
    )!;
  }

  show(equipment: EquipmentSummary | null): void {
    this.element.hidden = equipment === null;
    if (!equipment) return;
    this.name.textContent = equipment.name;
    this.tag.textContent = equipment.tag ?? '—';
    this.stage.textContent = equipment.stage ?? '工业设备';
    this.area.textContent = equipment.area ?? '厂区';
    this.connections.textContent = `${equipment.connectionCount ?? 0} 条连接`;
  }
}
