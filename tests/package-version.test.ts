import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { expect } from '#test-expect';

test('uses the published Engine package version', async () => {
  const manifest = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8'),
  ) as {
    readonly dependencies: Readonly<Record<string, string>>;
  };

  expect(manifest.dependencies.ice3).toBe('0.2.0');
  expect(Object.keys(manifest.dependencies).filter(
    (name) => name.startsWith('@ice3/'),
  )).toEqual([]);
});

test('locks the Engine package to the npm registry', async () => {
  const lockfile = JSON.parse(
    await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'),
  ) as {
    readonly packages: Readonly<Record<string, {
      readonly version?: string;
      readonly resolved?: string;
      readonly integrity?: string;
      readonly link?: boolean;
    }>>;
  };
  const installed = lockfile.packages['node_modules/ice3'];

  expect(installed?.version).toBe('0.2.0');
  expect(installed?.resolved).toBe(
    'https://registry.npmjs.org/ice3/-/ice3-0.2.0.tgz',
  );
  expect(installed?.integrity?.startsWith('sha512-')).toBe(true);
  expect(installed?.link).toBeUndefined();
  expect(lockfile.packages['../ice3-engine/packages/ice3']).toBeUndefined();
});
