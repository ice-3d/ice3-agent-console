export interface QuickAction {
  readonly id: string;
  readonly label: string;
  readonly prompt: string;
}

export const DEFAULT_QUICK_ACTIONS: readonly QuickAction[] = Object.freeze([
  { id: 'overview', label: '查看全厂', prompt: '带我看一下整个污水处理厂' },
  { id: 'secondary', label: '定位二沉池', prompt: '带我看一下二沉池' },
  { id: 'aeration', label: '讲解好氧池', prompt: '介绍一下好氧池' },
  { id: 'clear', label: '清除聚焦', prompt: '清除当前聚焦并回到全厂' },
]);

export function createQuickActions(
  host: HTMLElement,
  onSelect: (prompt: string) => void,
): HTMLElement {
  const document = host.ownerDocument;
  const navigation = document.createElement('nav');
  navigation.className = 'quick-actions';
  navigation.setAttribute('aria-label', '快捷指令');
  for (const action of DEFAULT_QUICK_ACTIONS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = action.label;
    button.addEventListener('click', () => onSelect(action.prompt));
    navigation.append(button);
  }
  host.append(navigation);
  return navigation;
}
