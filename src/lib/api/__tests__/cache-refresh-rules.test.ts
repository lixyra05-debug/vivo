/**
 * Lot C — règles du cache écrit par le serveur, partagées par l'app et l'Edge
 * Function `cache-product`.
 *
 * Avant le lot C, n'importe quel compte connecté pouvait écrire n'importe
 * quelle fiche du cache `products`, `updated_at` compris : une date mise dans
 * le futur rendait la fiche « fraîche » pour toujours. Ces règles ne laissent
 * passer vers Open Food Facts que des codes-barres bien formés, en nombre
 * borné, et ne tiennent pas pour fraîche une date venue du futur.
 */
import {
  CACHE_TTL_MS,
  CLIENT_CLOCK_SKEW_MS,
  REFRESH_QUOTAS,
  SERVER_CLOCK_SKEW_MS,
  decideQuota,
  isCacheFresh,
  isValidBarcode,
  parseRefreshRequest,
  toCacheRow,
} from '../cache-refresh-rules';

const NOW = Date.parse('2026-11-06T12:00:00.000Z');
const HOUR = 3600_000;
const iso = (ms: number) => new Date(ms).toISOString();

describe('isValidBarcode — 8 à 14 chiffres, rien d’autre', () => {
  it.each([
    ['3017620422003', 'EAN-13 (Nutella)'],
    ['96385074', 'EAN-8'],
    ['04252614', 'UPC-E, que la clé EAN-8 refuserait'],
    ['036000291452', 'UPC-A'],
    ['00012345600012', 'GTIN-14'],
    ['3017620422004', 'clé fausse : acceptée, elle n’arrête aucun abus'],
  ])('%s (%s) : accepté', (code, _cas) => {
    expect(isValidBarcode(code)).toBe(true);
  });

  it.each([
    ['1234567', '7 chiffres'],
    ['301762042200312', '15 chiffres'],
    ['30176204220O3', 'une lettre'],
    ['', 'vide'],
    [' 3017620422003', 'espace'],
    ['3017620422003\n', 'retour à la ligne'],
  ])('%j (%s) : refusé', (code, _cas) => {
    expect(isValidBarcode(code)).toBe(false);
  });
});

describe('isCacheFresh — une fiche ne sert que si sa date est plausible', () => {
  it('écrite il y a un jour : fraîche', () => {
    expect(isCacheFresh(iso(NOW - 24 * HOUR), NOW)).toBe(true);
  });

  it('borne du TTL : fraîche à 7 jours pile, périmée une milliseconde après', () => {
    expect(isCacheFresh(iso(NOW - CACHE_TTL_MS), NOW)).toBe(true);
    expect(isCacheFresh(iso(NOW - CACHE_TTL_MS - 1), NOW)).toBe(false);
  });

  it('horloge du serveur : au-delà de 5 minutes d’avance, périmée', () => {
    expect(isCacheFresh(iso(NOW + 60_000), NOW)).toBe(true);
    expect(isCacheFresh(iso(NOW + SERVER_CLOCK_SKEW_MS + 1000), NOW)).toBe(false);
  });

  it('horloge d’un téléphone en retard : une heure d’avance reste fraîche, deux jours non', () => {
    expect(isCacheFresh(iso(NOW + HOUR), NOW, CLIENT_CLOCK_SKEW_MS)).toBe(true);
    expect(isCacheFresh(iso(NOW + 2 * 24 * HOUR), NOW, CLIENT_CLOCK_SKEW_MS)).toBe(false);
  });

  it('date forgée « 2099 » : périmée à toutes les horloges, jamais « fraîche pour toujours »', () => {
    expect(isCacheFresh('2099-01-01T00:00:00.000Z', NOW)).toBe(false);
    expect(isCacheFresh('2099-01-01T00:00:00.000Z', NOW, CLIENT_CLOCK_SKEW_MS)).toBe(false);
  });

  it.each([[null], [undefined], [''], ['pas une date']])('date %j : périmée', (value) => {
    expect(isCacheFresh(value, NOW)).toBe(false);
  });
});

describe('parseRefreshRequest — la fonction ne reçoit qu’un code-barres et un type', () => {
  it('aliment et cosmétique valides', () => {
    expect(parseRefreshRequest({ barcode: '3017620422003', type: 'food' })).toEqual({
      barcode: '3017620422003',
      type: 'food',
    });
    expect(parseRefreshRequest({ barcode: '3274080005003', type: 'cosmetic' })).toEqual({
      barcode: '3274080005003',
      type: 'cosmetic',
    });
  });

  it('un contenu de fiche joint à la demande est ignoré : seuls le code et le type passent', () => {
    const parsed = parseRefreshRequest({
      barcode: '3017620422003',
      type: 'food',
      product: { ingredients_raw: 'eau', allergens_tags: [] },
      updated_at: '2099-01-01T00:00:00.000Z',
    });
    expect(parsed).toEqual({ barcode: '3017620422003', type: 'food' });
  });

  it.each([
    [{ barcode: '1234567', type: 'food' }, 'code trop court'],
    [{ barcode: '3017620422003', type: 'drink' }, 'type inconnu'],
    [{ barcode: '3017620422003' }, 'type absent'],
    [{ barcode: 3017620422003, type: 'food' }, 'code numérique'],
    ['3017620422003', 'pas un objet'],
    [null, 'null'],
  ])('%j (%s) : refusée', (body, _cas) => {
    expect(parseRefreshRequest(body)).toBeNull();
  });
});

describe('decideQuota — comptes demande en cours COMPRISE ; reste sous la limite d’OFF', () => {
  const atLimit = {
    userLastMinute: REFRESH_QUOTAS.perUserPerMinute,
    userLastDay: REFRESH_QUOTAS.perUserPerDay,
    sourceLastMinute: REFRESH_QUOTAS.globalPerMinutePerSource,
  };

  it('à chaque plafond tout juste : autorisée', () => {
    expect(decideQuota(atLimit)).toBe('ok');
  });

  it('une de plus que le plafond par minute du compte', () => {
    expect(decideQuota({ ...atLimit, userLastMinute: REFRESH_QUOTAS.perUserPerMinute + 1 })).toBe('user_minute');
  });

  it('une de plus que le plafond par jour du compte', () => {
    expect(decideQuota({ ...atLimit, userLastDay: REFRESH_QUOTAS.perUserPerDay + 1 })).toBe('user_day');
  });

  it('une de plus que le plafond global de la source, quel que soit le compte', () => {
    expect(decideQuota({ ...atLimit, sourceLastMinute: REFRESH_QUOTAS.globalPerMinutePerSource + 1 })).toBe('global');
  });

  it('le plafond global reste sous les 15 lectures par minute d’OFF', () => {
    expect(REFRESH_QUOTAS.globalPerMinutePerSource).toBeLessThan(15);
  });
});

describe('toCacheRow — la base fixe elle-même dates et compteurs', () => {
  it('retire created_at, updated_at, scan_count, our_score et our_score_computed_at', () => {
    const row = toCacheRow({
      barcode: '3017620422003',
      name: 'Nutella',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2099-01-01T00:00:00.000Z',
      scan_count: 42,
      our_score: 10,
      our_score_computed_at: '2026-01-01T00:00:00.000Z',
    });
    expect(row).toEqual({ barcode: '3017620422003', name: 'Nutella' });
  });
});
