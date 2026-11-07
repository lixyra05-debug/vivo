/**
 * Budgets communs des tests asynchrones (lot A/B).
 *
 * Un écran complet rendu sous un budget en temps réel tombe dès que la machine est sursouscrite :
 * ExploreScreen › debounce, StoreRankingScreen › Free, la catégorie cosmétique et, sous deux suites
 * simultanées, le scan alimentaire (CLAUDE.md, « Tests d'écran instables sous charge »). Les budgets
 * sont fixés une fois : Jest coupe un test à 30 s (`testTimeout`, package.json), `findBy*` et
 * `waitFor` attendent 15 s (jest.setup-after-env.js), et aucun test n'en fixe un plus court.
 */
import fs from 'fs';
import path from 'path';
import { waitFor } from '@testing-library/react-native';

const ROOT = path.resolve(__dirname, '../..');
const TEST_TIMEOUT_MS = 30_000;
const ASYNC_UTIL_TIMEOUT_MS = 15_000;

function testFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...testFiles(full));
    else if (/\.test\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

describe('budgets communs des tests asynchrones', () => {
  it('Jest coupe un test à 30 s, pas à 5 s (`testTimeout`, package.json)', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')) as {
      jest?: { testTimeout?: number };
    };
    expect(pkg.jest?.testTimeout ?? 5_000).toBeGreaterThanOrEqual(TEST_TIMEOUT_MS);
  });

  it('findBy* et waitFor attendent 15 s par défaut, pas 1 s (mesuré en temps simulé)', async () => {
    jest.useFakeTimers();
    try {
      let ready = false;
      setTimeout(() => {
        ready = true;
      }, 10_000);
      await waitFor(() => expect(ready).toBe(true));
    } finally {
      jest.useRealTimers();
    }
  });

  it('aucun test ne fixe à la main un budget plus court', () => {
    const offenders: string[] = [];
    for (const file of [...testFiles(path.join(ROOT, 'app')), ...testFiles(path.join(ROOT, 'src'))]) {
      const source = fs.readFileSync(file, 'utf8');
      const where = (index: number) => `${path.relative(ROOT, file)}:${source.slice(0, index).split('\n').length}`;
      for (const call of source.matchAll(/\b(?:find(?:All)?By\w+|waitFor)\s*\(/g)) {
        const start = call.index ?? 0;
        const end = source.indexOf(';', start);
        const budget = /\btimeout:\s*([\d_]+)/.exec(source.slice(start, end === -1 ? undefined : end));
        if (budget && Number(budget[1].replace(/_/g, '')) < ASYNC_UTIL_TIMEOUT_MS) offenders.push(`${where(start)} · ${budget[0]}`);
      }
      for (const call of source.matchAll(/jest\.setTimeout\(\s*([\d_]+)\s*\)/g)) {
        if (Number(call[1].replace(/_/g, '')) < TEST_TIMEOUT_MS) offenders.push(`${where(call.index ?? 0)} · ${call[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
