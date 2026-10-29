import { expect } from '#test-expect';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { copyPublicFiles } from '../scripts/copy-public-files.mjs';

test('copies crawler and social preview files into the static build', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ice3-public-files-'));
  const source = join(root, 'public');
  const destination = join(root, 'dist');
  try {
    await mkdir(source, { recursive: true });
    await writeFile(join(source, 'robots.txt'), 'robots');
    await writeFile(join(source, 'sitemap.xml'), 'sitemap');
    await writeFile(join(source, 'og-cover.jpg'), 'image');

    await copyPublicFiles({ source, destination });

    expect(await readFile(join(destination, 'robots.txt'), 'utf8'))
      .toBe('robots');
    expect(await readFile(join(destination, 'sitemap.xml'), 'utf8'))
      .toBe('sitemap');
    expect(await readFile(join(destination, 'og-cover.jpg'), 'utf8'))
      .toBe('image');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
