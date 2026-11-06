/**
 * Lot C — le code que l'Edge Function `cache-product` (Deno) importe doit se
 * charger dans Deno tel qu'il est écrit.
 *
 * Deno ne résout ni l'alias `@/` (propre au tsconfig de l'app) ni les chemins
 * sans extension, et il ne doit rien charger du client Supabase de l'app ni de
 * React Native (polyfills, AsyncStorage). Ce garde-fou parcourt le graphe
 * d'imports depuis chaque point d'entrée Deno et exige des imports relatifs
 * qui finissent par `.ts`.
 */
import fs from 'fs';
import path from 'path';
import { normalizeOFFProduct as fromOpenFoodFacts } from '../openfoodfacts';
import { normalizeOFFProduct } from '../off-normalize';
import { normalizeOBFProduct as fromOpenBeautyFacts } from '../openbeautyfacts';
import { normalizeOBFProduct } from '../obf-normalize';

const ROOT = path.resolve(__dirname, '../../../..');

/** Points d'entrée chargés par Deno (chemins depuis la racine du dépôt). */
const DENO_ENTRIES: ReadonlyArray<string> = [
  'src/lib/api/off-normalize.ts',
  'src/lib/api/obf-normalize.ts',
  'src/lib/api/cache-refresh-rules.ts',
  'src/lib/api/cache-refresh-handler.ts',
  'supabase/functions/cache-product/index.ts',
];

/** Ce qu'aucun module chargé par Deno ne doit atteindre. */
const FORBIDDEN_FILES = new Set(['src/lib/api/supabase.ts']);

const SPECIFIER = /(?:^|\n)\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g;

/** Les spécificateurs d'un module, commentaires retirés. */
function specifiersOf(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  return [...code.matchAll(SPECIFIER)].map((m) => m[1] ?? m[2] ?? m[3]);
}

interface GraphProblem {
  file: string;
  specifier: string;
  reason: string;
}

function walk(entries: ReadonlyArray<string>): { files: string[]; problems: GraphProblem[] } {
  const seen = new Set<string>();
  const problems: GraphProblem[] = [];
  const queue = [...entries];
  while (queue.length > 0) {
    const file = queue.shift() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    if (FORBIDDEN_FILES.has(file)) problems.push({ file, specifier: '', reason: 'module interdit dans Deno' });
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const specifier of specifiersOf(source)) {
      if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
        problems.push({ file, specifier, reason: 'import non relatif (alias ou paquet)' });
        continue;
      }
      if (!specifier.endsWith('.ts')) {
        problems.push({ file, specifier, reason: 'import sans extension .ts' });
        continue;
      }
      queue.push(path.relative(ROOT, path.resolve(path.dirname(path.join(ROOT, file)), specifier)));
    }
  }
  return { files: [...seen].sort(), problems };
}

describe('Deno charge le code partagé tel qu’il est écrit (lot C)', () => {
  it('le relevé lit import, export … from et import(), hors commentaires', () => {
    const fixture = [
      "import type { A } from './a.ts';",
      "import { b } from '../b.ts';",
      "export { c } from './c.ts';",
      "// import { d } from '@/d';",
      "const e = await import('./e.ts');",
      "import './f.ts';",
    ].join('\n');
    expect(specifiersOf(fixture)).toEqual(['./a.ts', '../b.ts', './c.ts', './e.ts', './f.ts']);
  });

  it('chaque module atteint depuis un point d’entrée Deno n’importe qu’en relatif, avec .ts', () => {
    const { files, problems } = walk(DENO_ENTRIES);
    expect(problems).toEqual([]);
    // Le graphe est bien parcouru : il atteint les types et l'emballage.
    expect(files).toEqual(expect.arrayContaining(['src/lib/api/types.ts', 'src/data/packaging-risks.ts']));
  });

  it('la fonction cache-product normalise et décide avec le code de l’app', () => {
    const { files } = walk(['supabase/functions/cache-product/index.ts']);
    expect(files).toEqual(
      expect.arrayContaining([
        'src/lib/api/cache-refresh-handler.ts',
        'src/lib/api/off-normalize.ts',
        'src/lib/api/obf-normalize.ts',
        'src/lib/api/cache-refresh-rules.ts',
      ]),
    );
  });

  it('l’app et la fonction partagent la même normalisation (aucune copie)', () => {
    expect(fromOpenFoodFacts).toBe(normalizeOFFProduct);
    expect(fromOpenBeautyFacts).toBe(normalizeOBFProduct);
  });
});
