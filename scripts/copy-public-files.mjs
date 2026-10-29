import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const FILES = ['robots.txt', 'sitemap.xml', 'og-cover.jpg'];

/**
 * @param {{ source?: string, destination?: string }} [options]
 * @returns {Promise<void>}
 */
export async function copyPublicFiles(options = {}) {
  const source = resolve(options.source ?? 'public');
  const destination = resolve(options.destination ?? 'dist');
  await mkdir(destination, { recursive: true });
  for (const file of FILES) {
    await cp(
      resolve(source, file),
      resolve(destination, file),
    );
  }
}

const directEntry = process.argv[1]
  ? pathToFileURL(process.argv[1]).href === import.meta.url
  : false;
if (directEntry) {
  await copyPublicFiles();
}
