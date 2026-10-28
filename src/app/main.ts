import type { EquipmentSummary } from '../../shared/scene.js';
import { createSceneController } from '../scene/browser.js';
import { ChatPanel } from '../view/chat-panel.js';
import { EquipmentCard } from '../view/equipment-card.js';
import { createQuickActions } from '../view/quick-actions.js';
import { StageView } from '../view/stage.js';
import { ConsoleStatus } from '../view/status.js';
import { runAgentServer } from '../protocol/client.js';
import { runAgentLocally } from '../protocol/local-agent.js';
import type { ThreadState } from '../protocol/reducer.js';
import { resolveAutoplay, resolveDemoMode } from './mode.js';
import { createSession, type SessionView } from './session.js';

class ConsoleView implements SessionView {
  constructor(
    readonly chat: ChatPanel,
    readonly equipment: EquipmentCard,
    readonly status: ConsoleStatus,
  ) {}

  appendUserMessage(text: string, id?: string): void {
    this.chat.appendUserMessage(text, id);
  }

  render(state: ThreadState): void {
    this.chat.render(state);
  }

  renderEquipment(equipment: EquipmentSummary | null): void {
    this.equipment.show(equipment);
  }

  setBusy(busy: boolean): void {
    this.chat.setBusy(busy);
  }

  setError(message: string | null): void {
    this.chat.setError(message);
    if (message) this.status.set(message, 'error');
  }
}

export async function startConsole(host: HTMLElement): Promise<void> {
  host.replaceChildren();
  const stage = new StageView(host);
  const chat = new ChatPanel(host);
  const equipment = new EquipmentCard(host);
  const status = new ConsoleStatus(host);
  const view = new ConsoleView(chat, equipment, status);
  const demo = resolveDemoMode(window.location.search, __ICE_DEMO__);
  const autoplay = resolveAutoplay(window.location.search, __ICE_DEMO__);
  chat.setMode('scripted', demo ? 'local' : 'server');

  try {
    const scene = await createSceneController({
      stage: stage.element,
      onUserCameraIntent: () => session.notifyUserSceneIntent(),
    });
    const session = createSession({
      transport: demo ? runAgentLocally : runAgentServer,
      scene,
      view,
      threadId: `ice3-agent-${Date.now()}`,
      autoplay: { enabled: autoplay, delayMs: 700 },
    });
    scene.onSelection((ids) => {
      session.setSelectedEquipment(ids[0] ?? null);
      session.notifyUserSceneIntent();
    });
    createQuickActions(host, (prompt) => {
      void session.send(prompt);
    });
    window.__ICE3_AGENT_CONSOLE__ = {
      send: (text) => session.send(text),
      selectedIds: () => scene.snapshot().selectedIds,
      assistantMode: () => 'scripted',
      transportMode: () => demo ? 'local' : 'server',
      state: () => session.state,
    };
    await scene.whenReady();
    stage.setReady();
    status.set('场景已就绪');
    session.start();
  } catch (error) {
    const message = `场景加载失败：${
      error instanceof Error ? error.message : String(error)
    }`;
    status.set(message, 'error');
    view.setError(message);
    stage.element.setAttribute('aria-busy', 'false');
  }
}
