/**
 * Audit du cache `products` (lot C) : confronte une ligne en cache à la fiche
 * relue sur Open Food Facts, normalisée par le même code que l'app. Ne lit et
 * n'écrit rien lui-même ; le script `audit/products-cache-audit.ts` lui fournit
 * les deux fiches. Importé par Deno, d'où les imports relatifs en `.ts`.
 */
import type { Product } from './types.ts';
import { normalizeOFFProduct, type OFFProduct } from './off-normalize.ts';
import { SERVER_CLOCK_SKEW_MS, isValidBarcode } from './cache-refresh-rules.ts';

/** La fiche OFF, avec sa date de dernière modification (secondes, champ `last_modified_t`). */
export type AuditOffProduct = OFFProduct & { last_modified_t?: number };

export type AuditVerdict =
  /** Mêmes valeurs qu'OFF aujourd'hui. */
  | 'conforme'
  /** `updated_at` dans le futur : datée par un client avant le lot C — téléphone en avance, ou date forgée. */
  | 'date_future'
  /** Ni 8 à 14 chiffres : `cache-product` le refuserait — signe d'une écriture hors de l'app, pas une preuve. OFF n'est pas interrogé. */
  | 'code_hors_format'
  /** OFF ne connaît pas ce code-barres : fiche inventée, ou retirée d'OFF. */
  | 'absente_off'
  /**
   * Écart sur ce que lit la compatibilité (allergènes, textes d'ingrédients,
   * additifs) : toujours suspect, qu'OFF ait changé depuis ou non — une
   * retouche d'OFF postérieure ne prouve pas que l'écart vient d'elle.
   */
  | 'ecart_sensible'
  /** Autre écart, mais OFF a été modifié après la mise en cache : attendu. */
  | 'off_a_change'
  /** Autre écart alors qu'OFF n'a pas changé depuis (ou sans date) : altération probable. */
  | 'ecart_inexplique';

/** Ce que lisent la note, la compatibilité et l'écran. */
export const AUDITED_FIELDS = [
  'name',
  'brand',
  'image_url',
  'ingredients_raw',
  'ingredients_text_fr',
  'allergens_tags',
  'additives_tags',
  'nova_group',
  'nutriscore_grade',
  'energy_kcal_100g',
  'sugars_100g',
  'saturated_fat_100g',
  'salt_100g',
  'proteins_100g',
  'fiber_100g',
  'oil_types',
  'portion_grams',
  'is_organic',
  'packaging_components',
] as const satisfies ReadonlyArray<keyof Product>;

/** Ce dont dépend le verdict allergène : un écart ici n'est jamais excusé. */
const SENSITIVE_FIELDS = new Set<string>(['ingredients_raw', 'ingredients_text_fr', 'allergens_tags', 'additives_tags']);

/**
 * Champs arrivés avec les migrations 016 et 017 : une ligne écrite avant eux
 * les a vides. Vides, ils ne sont pas comparés — limite connue : un compte qui
 * les aurait vidés exprès passe ici, mais pas s'il a touché aux textes.
 */
const LATE_FIELDS = new Set<string>(['ingredients_text_fr', 'allergens_tags', 'packaging_components']);

export interface AuditResult {
  barcode: string;
  verdict: AuditVerdict;
  /** Champs en écart, dans l'ordre de `AUDITED_FIELDS`. */
  fields: string[];
}

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || (Array.isArray(value) && value.length === 0);
}

/**
 * Forme canonique d'une valeur JSON : les clés de chaque objet triées, récursivement ; l'ordre
 * des éléments d'un tableau est gardé. PostgreSQL ne conserve pas l'ordre des clés d'un `jsonb` :
 * `packaging_components` revient en `shape, material, food_contact`, quand la normalisation
 * l'écrit en `material, shape, food_contact`. Comparé au texte près, tout emballage différait.
 */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(object)
        .sort()
        .map((key) => [key, canonical(object[key])]),
    );
  }
  return value;
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(canonical(a ?? null)) === JSON.stringify(canonical(b ?? null));
}

/** `off` : la fiche OFF, ou `null` si OFF ne connaît pas le code-barres. */
export function auditCachedRow(row: Product, off: AuditOffProduct | null, now: number): AuditResult {
  const barcode = row.barcode;
  const cachedAt = Date.parse(row.updated_at ?? '');
  if (Number.isFinite(cachedAt) && cachedAt > now + SERVER_CLOCK_SKEW_MS) {
    return { barcode, verdict: 'date_future', fields: [] };
  }
  if (!isValidBarcode(barcode)) return { barcode, verdict: 'code_hors_format', fields: [] };
  if (!off) return { barcode, verdict: 'absente_off', fields: [] };

  const expected = normalizeOFFProduct({ ...off, code: barcode });
  const fields: string[] = AUDITED_FIELDS.filter((field) => {
    if (LATE_FIELDS.has(field) && isEmpty(row[field])) return false;
    return !same(row[field], expected[field]);
  });
  if (fields.length === 0) return { barcode, verdict: 'conforme', fields };
  if (fields.some((field) => SENSITIVE_FIELDS.has(field))) return { barcode, verdict: 'ecart_sensible', fields };

  const offModifiedAt = typeof off.last_modified_t === 'number' ? off.last_modified_t * 1000 : null;
  if (offModifiedAt !== null && Number.isFinite(cachedAt) && offModifiedAt > cachedAt) {
    return { barcode, verdict: 'off_a_change', fields };
  }
  return { barcode, verdict: 'ecart_inexplique', fields };
}
