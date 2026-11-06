/**
 * Lot C — audit des fiches déjà en cache, sans rien écrire.
 *
 * Avant le lot C, tout compte connecté pouvait réécrire une fiche du cache
 * `products`. L'audit compare chaque ligne à la fiche relue sur Open Food
 * Facts, normalisée par le même code que l'app, et classe l'écart. Un écart
 * sur ce que lit la compatibilité (allergènes, ingrédients, additifs) reste
 * suspect même si OFF a été retouché depuis : la retouche ne prouve rien.
 */
import { auditCachedRow, AUDITED_FIELDS, type AuditOffProduct } from '../cache-audit';
import { normalizeOFFProduct } from '../off-normalize';
import type { Product } from '../types';

const NOW = Date.parse('2026-11-06T12:00:00.000Z');
const CACHED_AT = '2026-11-03T12:00:00.000Z';
const BEFORE_CACHE = Date.parse('2026-10-01T00:00:00.000Z') / 1000;
const AFTER_CACHE = Date.parse('2026-11-05T00:00:00.000Z') / 1000;

const OFF: AuditOffProduct = {
  code: '3017620422003',
  product_name: 'Nutella',
  ingredients_text: 'sugar, palm oil, hazelnuts, skimmed milk powder',
  ingredients_text_fr: 'sucre, huile de palme, NOISETTES, LAIT écrémé en poudre',
  allergens_tags: ['en:milk', 'en:nuts'],
  additives_tags: ['en:e322'],
  nova_group: 4,
  packagings: [{ material: 'en:glass', shape: 'en:jar', food_contact: 1 }],
  last_modified_t: BEFORE_CACHE,
};

/** La ligne qu'aurait écrite l'app à la date `CACHED_AT`. */
function cachedRow(overrides: Partial<Product> = {}): Product {
  return { ...normalizeOFFProduct(OFF), updated_at: CACHED_AT, ...overrides };
}

describe('auditCachedRow — chaque fiche en cache confrontée à OFF (lot C)', () => {
  it('ligne identique à la fiche OFF normalisée : conforme', () => {
    expect(auditCachedRow(cachedRow(), OFF, NOW)).toEqual({ barcode: OFF.code, verdict: 'conforme', fields: [] });
  });

  it('date dans le futur (téléphone en avance ou date forgée) : signalée, quel que soit le contenu', () => {
    expect(auditCachedRow(cachedRow({ updated_at: '2099-01-01T00:00:00.000Z' }), OFF, NOW).verdict).toBe('date_future');
  });

  it('code qui n’est pas de 8 à 14 chiffres : hors format, OFF non interrogé', () => {
    expect(auditCachedRow(cachedRow({ barcode: 'abc' }), null, NOW).verdict).toBe('code_hors_format');
  });

  it('code inconnu d’OFF : absente', () => {
    expect(auditCachedRow(cachedRow(), null, NOW).verdict).toBe('absente_off');
  });

  it('lait retiré des textes : écart sensible, même si OFF a été retouché depuis', () => {
    const row = cachedRow({ ingredients_raw: 'sugar, palm oil, hazelnuts', ingredients_text_fr: 'sucre, huile de palme, NOISETTES' });
    const expected = { barcode: OFF.code, verdict: 'ecart_sensible', fields: ['ingredients_raw', 'ingredients_text_fr'] };
    expect(auditCachedRow(row, OFF, NOW)).toEqual(expected);
    expect(auditCachedRow(row, { ...OFF, last_modified_t: AFTER_CACHE }, NOW)).toEqual(expected);
  });

  it('allergène déclaré retiré : écart sensible', () => {
    expect(auditCachedRow(cachedRow({ allergens_tags: ['en:nuts'] }), OFF, NOW)).toMatchObject({
      verdict: 'ecart_sensible',
      fields: ['allergens_tags'],
    });
  });

  it('nom changé, OFF modifié après la mise en cache : OFF a changé', () => {
    const row = cachedRow({ name: 'Nutella 400 g' });
    expect(auditCachedRow(row, { ...OFF, last_modified_t: AFTER_CACHE }, NOW).verdict).toBe('off_a_change');
  });

  it('nom changé, OFF inchangé depuis la mise en cache : écart inexpliqué', () => {
    expect(auditCachedRow(cachedRow({ name: 'Nutella 400 g' }), OFF, NOW)).toMatchObject({
      verdict: 'ecart_inexplique',
      fields: ['name'],
    });
  });

  it('champs arrivés avec 016 et 017, vides dans une ligne ancienne : non comparés (limite connue)', () => {
    const row = cachedRow({ ingredients_text_fr: null, allergens_tags: [], packaging_components: [] });
    expect(auditCachedRow(row, OFF, NOW).verdict).toBe('conforme');
  });

  it('compare ce que lisent la note, la compatibilité et l’écran', () => {
    expect(AUDITED_FIELDS).toEqual(
      expect.arrayContaining(['ingredients_raw', 'ingredients_text_fr', 'allergens_tags', 'additives_tags', 'nova_group', 'name', 'image_url']),
    );
  });
});
