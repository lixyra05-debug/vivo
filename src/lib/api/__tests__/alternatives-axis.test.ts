/**
 * D14 — les alternatives se comparent sur la FORMULATION, jamais sur la note.
 *
 * `findAlternatives` note ses candidats via `nutriScoreToProxy`, qui ignore
 * l'emballage. Les opposer à une note qui, elle, l'intègre remonterait des
 * produits « meilleurs » uniquement parce que leur emballage n'a jamais été
 * évalué — une comparaison entre deux échelles différentes.
 *
 * Ce garde-fou est SOURCE-LEVEL, sur le modèle de `theme-guard.test.ts`, parce
 * que c'est exactement la régression qui s'est produite : l'axe avait été
 * corrigé dans `FoodProductView`, et un second appel — indépendant, dans
 * l'écran de partage — était passé au travers. Un test de rendu n'aurait
 * couvert qu'un seul des deux appelants ; celui-ci les attrape tous.
 */

import fs from 'fs';
import path from 'path';

// src/lib/api/__tests__ → racine du dépôt (4 niveaux).
const ROOT = path.resolve(__dirname, '../../../..');

/** Tout appelant d'une recherche d'alternatives doit passer l'axe formulation. */
const CALL_SITES = [
  {
    file: 'app/scan-choc/[barcode].tsx',
    fn: 'findAlternatives',
  },
  {
    file: 'src/components/product/FoodProductView.tsx',
    fn: 'useAlternatives',
  },
] as const;

/** Les arguments d'un appel `fn(...)`, parenthèses équilibrées. */
function argumentsOf(source: string, fn: string): string[] {
  const calls: string[] = [];
  const needle = `${fn}(`;
  let from = 0;

  for (;;) {
    const start = source.indexOf(needle, from);
    if (start === -1) break;

    let depth = 0;
    let end = start + needle.length - 1;
    for (let i = end; i < source.length; i += 1) {
      if (source[i] === '(') depth += 1;
      else if (source[i] === ')') {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    calls.push(source.slice(start + needle.length, end));
    from = end + 1;
  }
  return calls;
}

describe('D14 — axe de comparaison des alternatives', () => {
  it.each(CALL_SITES)(
    '$file passe la formulation à $fn, jamais la note composée',
    ({ file, fn }) => {
      const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
      const calls = argumentsOf(source, fn);

      // Si l'appel disparaît, ce test doit tomber plutôt que passer à vide.
      expect(calls.length).toBeGreaterThan(0);

      for (const args of calls) {
        expect(args).toContain('formulationScore');
      }
    },
  );

  it('ne laisse aucun appelant transmettre score_final tout court', () => {
    for (const { file, fn } of CALL_SITES) {
      const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
      for (const args of argumentsOf(source, fn)) {
        // `formulationScore ?? result.score_final` reste licite : le repli
        // n'est atteint que si la composition n'a pas eu lieu. Ce qui est
        // proscrit, c'est `score_final` SANS mention de la formulation.
        if (args.includes('score_final')) {
          expect(args).toContain('formulationScore');
        }
      }
    }
  });
});
