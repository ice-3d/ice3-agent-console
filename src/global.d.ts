declare module '*.css' {
  const css: string;
  export default css;
}

declare const __ICE_DEMO__: boolean;

interface Window {
  __ICE3_AGENT_CONSOLE__?: {
    send(text: string): Promise<void>;
    selectedIds(): readonly string[];
    assistantMode(): 'scripted' | 'model';
    transportMode(): 'server' | 'local';
    state(): unknown;
  };
}
