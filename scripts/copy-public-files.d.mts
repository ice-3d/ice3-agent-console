export interface CopyPublicFilesOptions {
  source?: string;
  destination?: string;
}

export function copyPublicFiles(
  options?: CopyPublicFilesOptions,
): Promise<void>;
