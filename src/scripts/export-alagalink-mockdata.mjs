import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const projectRoot = path.resolve(process.cwd());
const entry = path.join(projectRoot, 'resources/js/Providers/AlagaLink/mockData/index.ts');
const outDir = path.join(projectRoot, 'database/seeders/data/alagalink');

const tmpOut = path.join(tmpdir(), `alagalink-mockdata-${Date.now()}.mjs`);

await mkdir(outDir, { recursive: true });

await build({
  entryPoints: [entry],
  outfile: tmpOut,
  bundle: true,
  platform: 'node',
  format: 'esm',
  sourcemap: false,
  logLevel: 'silent',
});

const mod = await import(pathToFileURL(tmpOut).href);

const datasets = {
  users: mod.MOCK_USERS,
  reports: mod.MOCK_REPORTS,
  program_records: mod.MOCK_PROGRAM_RECORDS,
  notification_history: mod.MOCK_NOTIFICATION_HISTORY,
  devices: mod.MOCK_DEVICES,
  medical: mod.MOCK_MEDICAL,
  livelihoods: mod.MOCK_LIVELIHOODS,
  updates: mod.MOCK_UPDATES,
  about: mod.ABOUT_INFO,
};

for (const [name, value] of Object.entries(datasets)) {
  if (typeof value === 'undefined') {
    throw new Error(`Missing export for dataset: ${name}`);
  }

  const filePath = path.join(outDir, `${name}.json`);
  await writeFile(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

console.log(`Wrote AlagaLink seed JSON to ${outDir}`);
