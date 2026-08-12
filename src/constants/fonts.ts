/**
 * Façade de compatibilité — préférer `Type` / `FontFamily` de `./theme`.
 *
 * `display` pointait sur `'BricolageGrotesque'`, qui est bien chargée mais
 * correspond au Medium 500. La v2 réserve le display aux titres, donc au Bold.
 * Sans conséquence : cette constante n'a aucun consommateur dans l'app, tous
 * les styles déclarant leur `fontFamily` en littéral.
 */

import { FontFamily } from './theme';

export const Fonts = {
  body: FontFamily.body,
  display: FontFamily.displayBold,
} as const;
