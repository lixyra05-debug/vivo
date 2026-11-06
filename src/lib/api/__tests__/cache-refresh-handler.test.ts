/**
 * Lot C — le parcours de l'Edge Function `cache-product`, testé sans Deno ni
 * réseau : `handleRefresh` reçoit des dépendances simulées, que la fonction
 * branche sur `fetch` en production. La fonction elle-même n'est jamais
 * exécutée par ces tests.
 *
 * Ce qui est gardé : utilisateur connecté exigé ; fiche fraîche servie sans
 * rien d'autre ; inscription au journal AVANT le comptage, et retrait en cas
 * de refus ; aucune lecture de la source avant les quotas ; contenu écrit
 * toujours relu à la source, jamais pris dans la demande ; pause de la source
 * après un refus.
 */
import { handleRefresh, LOG_RETENTION_MS, type RefreshDeps, type Upstream } from '../cache-refresh-handler';
import { REFRESH_QUOTAS } from '../cache-refresh-rules';

const NOW = Date.parse('2026-11-06T12:00:00.000Z');
const DAY = 24 * 3600_000;
const BARCODE = '3017620422003';

const OFF_PRODUCT = {
  code: BARCODE,
  product_name: 'Nutella',
  ingredients_text: 'sugar, palm oil, hazelnuts, skimmed milk powder',
  allergens_tags: ['en:milk', 'en:nuts'],
};

interface Harness {
  deps: RefreshDeps;
  calls: string[];
  upserts: Array<{ table: string; row: Record<string, unknown> }>;
  deleted: number[];
  counts: { userLastMinute: number; userLastDay: number; sourceLastMinute: number };
}

function harness(options: {
  userId?: string | null;
  cached?: Record<string, unknown> | null;
  upstream?: Upstream;
  insertId?: number | null;
  countsReadable?: boolean;
  upsertOk?: boolean;
} = {}): Harness {
  const calls: string[] = [];
  const upserts: Harness['upserts'] = [];
  const deleted: number[] = [];
  const counts = { userLastMinute: 1, userLastDay: 1, sourceLastMinute: 1 };
  const deps: RefreshDeps = {
    now: () => NOW,
    authenticate: async (authorization) => {
      calls.push('authenticate');
      if (options.userId === null) return null;
      return authorization ? (options.userId ?? 'user-1') : null;
    },
    readCached: async (table) => {
      calls.push(`readCached:${table}`);
      return options.cached ?? null;
    },
    insertRefresh: async (_userId, source) => {
      calls.push(`insert:${source}`);
      return options.insertId === undefined ? 77 : options.insertId;
    },
    countRefreshes: async (filter) => {
      calls.push('count');
      if (options.countsReadable === false) return null;
      if ('source' in filter) return counts.sourceLastMinute;
      return filter.since <= NOW - DAY ? counts.userLastDay : counts.userLastMinute;
    },
    deleteRefresh: async (id) => {
      calls.push('delete');
      deleted.push(id);
    },
    purgeRefreshes: async (source, before) => {
      calls.push(`purge:${source}:${before}`);
    },
    fetchUpstream: async (source) => {
      calls.push(`upstream:${source}`);
      return options.upstream ?? { status: 'found', product: OFF_PRODUCT };
    },
    upsert: async (table, row) => {
      calls.push(`upsert:${table}`);
      upserts.push({ table, row: row as Record<string, unknown> });
      return options.upsertOk === false ? null : { ...(row as Record<string, unknown>), updated_at: new Date(NOW).toISOString() };
    },
    upstreamPause: { off: 0, obf: 0 },
  };
  return { deps, calls, upserts, deleted, counts };
}

const POST = (body: unknown, h: Harness, authorization: string | null = 'Bearer jwt') =>
  handleRefresh('POST', authorization, body, h.deps);

describe('handleRefresh — la demande et l’utilisateur', () => {
  it('autre méthode que POST : 405, rien d’autre', async () => {
    const h = harness();
    expect((await handleRefresh('GET', 'Bearer jwt', null, h.deps)).status).toBe(405);
    expect(h.calls).toEqual([]);
  });

  it('demande invalide : 400, sans même vérifier l’utilisateur', async () => {
    const h = harness();
    expect((await POST({ barcode: 'abc', type: 'food' }, h)).status).toBe(400);
    expect(h.calls).toEqual([]);
  });

  it('pas d’utilisateur connecté : 401, ni journal, ni source', async () => {
    const h = harness({ userId: null });
    expect((await POST({ barcode: BARCODE, type: 'food' }, h)).status).toBe(401);
    expect(h.calls).toEqual(['authenticate']);
  });
});

describe('handleRefresh — fiche fraîche et relecture', () => {
  it('fiche fraîche à l’horloge du serveur : servie, ni journal ni source', async () => {
    const h = harness({ cached: { barcode: BARCODE, name: 'Nutella (cache)', updated_at: new Date(NOW - DAY).toISOString() } });
    const res = await POST({ barcode: BARCODE, type: 'food' }, h);
    expect(res).toMatchObject({ status: 200, body: { cached: true, written: false } });
    expect(h.calls).toEqual(['authenticate', 'readCached:products']);
  });

  it('fiche périmée : inscription, comptage, purge, PUIS source, puis écriture', async () => {
    const h = harness({ cached: { barcode: BARCODE, updated_at: new Date(NOW - 8 * DAY).toISOString() } });
    const res = await POST({ barcode: BARCODE, type: 'food' }, h);
    expect(res).toMatchObject({ status: 200, body: { cached: false, written: true } });
    expect(h.calls).toEqual([
      'authenticate',
      'readCached:products',
      'insert:off',
      'count',
      'count',
      'count',
      `purge:off:${NOW - LOG_RETENTION_MS}`,
      'upstream:off',
      'upsert:products',
    ]);
  });

  it('le contenu écrit vient de la source, jamais de la demande', async () => {
    const h = harness();
    await POST(
      {
        barcode: BARCODE,
        type: 'food',
        product: { ingredients_raw: 'eau', allergens_tags: [] },
        updated_at: '2099-01-01T00:00:00.000Z',
      },
      h,
    );
    const [{ row }] = h.upserts;
    expect(row.ingredients_raw).toBe(OFF_PRODUCT.ingredients_text);
    expect(row.allergens_tags).toEqual(['en:milk', 'en:nuts']);
    // Ni dates ni compteurs : la base les fixe (trigger de 018).
    expect(row).not.toHaveProperty('updated_at');
    expect(row).not.toHaveProperty('created_at');
  });

  it('la fiche est écrite sous le code demandé, même si la source en renvoie un autre', async () => {
    const h = harness({ upstream: { status: 'found', product: { ...OFF_PRODUCT, code: '0003017620422003' } } });
    await POST({ barcode: BARCODE, type: 'food' }, h);
    expect(h.upserts[0].row.barcode).toBe(BARCODE);
  });

  it('cosmétique : Open Beauty Facts et cosmetic_products', async () => {
    const h = harness({ upstream: { status: 'found', product: { code: BARCODE, product_name: 'Crème', ingredients_text: 'Aqua, Glycerin' } } });
    await POST({ barcode: BARCODE, type: 'cosmetic' }, h);
    expect(h.calls).toEqual(expect.arrayContaining(['readCached:cosmetic_products', 'insert:obf', 'upstream:obf', 'upsert:cosmetic_products']));
    expect(h.upserts[0].row.ingredients_list).toEqual(['aqua', 'glycerin']);
  });

  it('écriture refusée (migration absente) : la fiche relue est servie, written=false', async () => {
    const h = harness({ upsertOk: false });
    const res = await POST({ barcode: BARCODE, type: 'food' }, h);
    expect(res).toMatchObject({ status: 200, body: { cached: false, written: false, product: { name: 'Nutella' } } });
  });
});

describe('handleRefresh — quotas, comptés après inscription', () => {
  it.each([
    ['userLastMinute', REFRESH_QUOTAS.perUserPerMinute + 1, '60'],
    ['userLastDay', REFRESH_QUOTAS.perUserPerDay + 1, '3600'],
    ['sourceLastMinute', REFRESH_QUOTAS.globalPerMinutePerSource + 1, '60'],
  ] as const)('%s au-delà du plafond : 429, inscription retirée, source jamais lue', async (key, value, retry) => {
    const h = harness();
    h.counts[key] = value;
    const res = await POST({ barcode: BARCODE, type: 'food' }, h);
    expect(res).toMatchObject({ status: 429, headers: { 'Retry-After': retry } });
    expect(h.deleted).toEqual([77]);
    expect(h.calls.some((c) => c.startsWith('upstream'))).toBe(false);
  });

  it('journal sans inscription possible : 503, source jamais lue', async () => {
    const h = harness({ insertId: null });
    expect((await POST({ barcode: BARCODE, type: 'food' }, h)).status).toBe(503);
    expect(h.calls.some((c) => c.startsWith('upstream'))).toBe(false);
  });

  it('comptage illisible : 503, inscription retirée, source jamais lue', async () => {
    const h = harness({ countsReadable: false });
    expect((await POST({ barcode: BARCODE, type: 'food' }, h)).status).toBe(503);
    expect(h.deleted).toEqual([77]);
    expect(h.calls.some((c) => c.startsWith('upstream'))).toBe(false);
  });
});

describe('handleRefresh — la source', () => {
  it('code inconnu de la source : 404', async () => {
    const h = harness({ upstream: { status: 'not_found' } });
    expect((await POST({ barcode: BARCODE, type: 'food' }, h)).status).toBe(404);
    expect(h.upserts).toEqual([]);
  });

  it('source saturée : 503 et pause ; pendant la pause, ni journal ni source', async () => {
    const h = harness({ upstream: { status: 'busy', retryAfterSeconds: 120 } });
    const first = await POST({ barcode: BARCODE, type: 'food' }, h);
    expect(first).toMatchObject({ status: 503, headers: { 'Retry-After': '120' } });
    expect(h.deps.upstreamPause.off).toBe(NOW + 120_000);
    h.calls.length = 0;
    const second = await POST({ barcode: BARCODE, type: 'food' }, h);
    expect(second.status).toBe(503);
    expect(h.calls).toEqual(['authenticate', 'readCached:products']);
  });

  it('source injoignable : 503, rien d’écrit', async () => {
    const h = harness({ upstream: { status: 'error' } });
    expect((await POST({ barcode: BARCODE, type: 'food' }, h)).status).toBe(503);
    expect(h.upserts).toEqual([]);
  });
});
