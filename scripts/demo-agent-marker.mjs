import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

await writeFile(
  resolve('dist/demo-agent.json'),
  `${JSON.stringify({ mode: 'local', agent: 'scripted' })}\n`,
);
