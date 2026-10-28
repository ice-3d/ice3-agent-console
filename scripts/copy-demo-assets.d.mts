export interface CopyDemoAssetsOptions {
  source?: string;
  manifest?: string;
  destination?: string;
}

export function copyDemoAssets(
  options?: CopyDemoAssetsOptions,
): Promise<void>;
