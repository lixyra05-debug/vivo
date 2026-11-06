/**
 * Lot C — le client lit les caches, il ne les écrit plus.
 *
 * Avant le lot C, `getOrFetchProduct` et `getOrFetchCosmetic` écrivaient
 * eux-mêmes la fiche relue d'OFF (upsert de l'objet entier, `updated_at`
 * compris), et la base l'acceptait de tout compte connecté : n'importe qui
 * pouvait réécrire la fiche — et le verdict allergène — que lisent les autres.
 *
 * Désormais : fiche fraîche → servie ; sinon l'Edge Function `cache-product`
 * relit la source et écrit ; fonction injoignable → lecture directe de la
 * source, sans écriture. Une date venue du futur ne rend plus une fiche
 * « fraîche ».
 *
 * Couches traversées : `getOrFetchProduct` / `getOrFetchCosmetic` réels, règles
 * de fraîcheur réelles, normalisation réelle. Couches simulées : Supabase
 * (`from`, `functions.invoke`, `auth.getSession`) et le réseau OFF/OBF.
 */
import fs from 'fs';
import path from 'path';
import { createClient, type FunctionInvokeOptions } from '@supabase/supabase-js';

import { getOrFetchProduct, normalizeOFFProduct, type OFFProduct } from '../openfoodfacts';
import { getOrFetchCosmetic } from '../openbeautyfacts';

/**
 * Le budget local vit dans `cache-refresh.ts`, apparu avec ce commit : importé
 * sans exiger qu'il existe, pour que le RED sur le parent dise quels
 * comportements manquent au lieu d'échouer à l'import.
 */
function resetThrottle(): void {
  try {
    (require('../cache-refresh') as { __resetCacheRefreshThrottleForTests?: () => void }).__resetCacheRefreshThrottleForTests?.();
  } catch {
    // Module absent : rien à remettre à zéro.
  }
}

const mockReadRow = jest.fn();
const mockWrite = jest.fn();
const mockInvoke = jest.fn();
const mockGetSession = jest.fn();
const mockFetch = jest.fn();

jest.mock('../supabase', () => {
  // Chaîne PostgREST simulée : lecture d'une ligne, et toute écriture enregistrée.
  const chain = (table: string): Record<string, unknown> => {
    const c: Record<string, unknown> = {};
    c.select = () => c;
    c.eq = () => c;
    c.maybeSingle = () => Promise.resolve({ data: mockReadRow(table), error: null });
    for (const method of ['upsert', 'insert', 'update', 'delete']) {
      c[method] = (...args: unknown[]) => {
        mockWrite(table, method, ...args);
        return c;
      };
    }
    return c;
  };
  return {
    supabase: {
      from: (table: string) => chain(table),
      functions: { invoke: (...args: unknown[]) => mockInvoke(...args) },
      auth: { getSession: () => mockGetSession() },
    },
  };
});

const mockLogError = jest.fn();
const mockLogWarn = jest.fn();
jest.mock('../../utils/logger', () => ({
  error: (...args: unknown[]) => mockLogError(...args),
  warn: (...args: unknown[]) => mockLogWarn(...args),
  info: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('../fetch-with-timeout', () => ({
  ...jest.requireActual('../fetch-with-timeout'),
  fetchWithTimeout: (...args: unknown[]) => mockFetch(...args),
}));

const BARCODE = '3017620422003';
const DAY = 24 * 3600_000;

const OFF_NUTELLA: OFFProduct = {
  code: BARCODE,
  product_name: 'Nutella',
  ingredients_text: 'sugar, palm oil, hazelnuts',
  ingredients_text_fr: 'sucre, huile de palme, NOISETTES',
  allergens_tags: ['en:milk', 'en:nuts'],
};

function row(updatedAt: string, name = 'Nutella (cache)') {
  return { ...normalizeOFFProduct({ ...OFF_NUTELLA, product_name: name }), updated_at: updatedAt };
}

function serverProduct() {
  return { ...normalizeOFFProduct({ ...OFF_NUTELLA, product_name: 'Nutella (serveur)' }) };
}

function sourceResponds(product: object | null) {
  mockFetch.mockResolvedValue({
    ok: product !== null,
    status: product ? 200 : 404,
    json: async () => (product ? { status: 1, product } : { status: 0 }),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  resetThrottle();
  mockGetSession.mockResolvedValue({ data: { session: { access_token: 'jwt' } } });
  mockReadRow.mockReturnValue(null);
  sourceResponds(OFF_NUTELLA);
});

describe('getOrFetchProduct — le serveur écrit, le client lit (lot C)', () => {
  it('fiche fraîche : servie telle quelle, ni fonction ni OFF', async () => {
    mockReadRow.mockReturnValue(row(new Date(Date.now() - DAY).toISOString()));
    const product = await getOrFetchProduct(BARCODE);
    expect(product?.name).toBe('Nutella (cache)');
    expect(mockInvoke).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it('fiche périmée : la fonction relit et écrit, le client n’écrit rien', async () => {
    mockReadRow.mockReturnValue(row(new Date(Date.now() - 8 * DAY).toISOString()));
    mockInvoke.mockResolvedValue({ data: { product: serverProduct(), cached: false }, error: null });
    const product = await getOrFetchProduct(BARCODE);
    expect(mockInvoke).toHaveBeenCalledWith(
      'cache-product',
      expect.objectContaining({ body: { barcode: BARCODE, type: 'food' }, region: 'eu-west-1' }),
    );
    expect(product?.name).toBe('Nutella (serveur)');
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it('fiche datée dans le futur : tenue pour périmée, jamais « fraîche pour toujours »', async () => {
    mockReadRow.mockReturnValue(row('2099-01-01T00:00:00.000Z', 'Nutella (empoisonné)'));
    mockInvoke.mockResolvedValue({ data: { product: serverProduct(), cached: false }, error: null });
    const product = await getOrFetchProduct(BARCODE);
    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(product?.name).toBe('Nutella (serveur)');
  });

  it('fonction injoignable : lecture directe d’OFF, aucune écriture', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('Relay'), response: { status: 503 } });
    const product = await getOrFetchProduct(BARCODE);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(product?.name).toBe('Nutella');
    expect(product?.allergens_tags).toEqual(['en:milk', 'en:nuts']);
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it('404 — fonction pas encore déployée, ou code inconnu : lecture directe d’OFF, jamais « introuvable » d’office', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('HTTP'), response: { status: 404 } });
    const product = await getOrFetchProduct(BARCODE);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(product?.name).toBe('Nutella');
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it('sans session : la fonction n’est pas appelée, OFF est lu directement', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const product = await getOrFetchProduct(BARCODE);
    expect(mockInvoke).not.toHaveBeenCalled();
    expect(product?.name).toBe('Nutella');
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it('code que la fonction refuserait (ni 8 à 14 chiffres) : aucun appel, lecture directe d’OFF, rien de signalé', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: new Error('HTTP'),
      response: { status: 400, json: async () => ({ code: 'invalid_request', message: 'Code-barres ou type invalide.' }) },
    });
    const product = await getOrFetchProduct('1234567');
    expect(mockInvoke).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(product?.name).toBe('Nutella');
    expect(mockWrite).not.toHaveBeenCalled();
    expect(mockLogError).not.toHaveBeenCalled();
  });

  it('une fiche rendue pour un autre code-barres est écartée', async () => {
    mockInvoke.mockResolvedValue({
      data: { product: { ...serverProduct(), barcode: '3274080005003' }, cached: false },
      error: null,
    });
    const product = await getOrFetchProduct(BARCODE);
    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(product?.barcode).toBe(BARCODE);
    expect(product?.name).toBe('Nutella');
    expect(mockWrite).not.toHaveBeenCalled();
  });
});

describe('listes, horloge du téléphone, signalements (lot C)', () => {
  it('une liste (refresh: false) ne demande jamais de relecture : cache ou OFF', async () => {
    mockReadRow.mockReturnValue(row(new Date(Date.now() - 8 * DAY).toISOString()));
    const product = await getOrFetchProduct(BARCODE, { refresh: false });
    expect(mockInvoke).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(product?.name).toBe('Nutella');
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it('téléphone en retard : une fiche datée d’une heure « dans le futur » reste servie', async () => {
    mockReadRow.mockReturnValue(row(new Date(Date.now() + 3600_000).toISOString()));
    expect((await getOrFetchProduct(BARCODE))?.name).toBe('Nutella (cache)');
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('401 pour un compte connecté : signalé une seule fois par session, sans code-barres', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('HTTP'), response: { status: 401, json: async () => ({}) } });
    await getOrFetchProduct(BARCODE);
    await getOrFetchProduct(BARCODE);
    expect(mockLogError).toHaveBeenCalledTimes(1);
    const [err, context] = mockLogError.mock.calls[0];
    expect((err as Error).message).toBe('Relecture du cache dégradée');
    expect(context).toEqual({ kind: 'http_error', status: 401 });
    expect(JSON.stringify([String(err), context])).not.toContain(BARCODE);
  });

  it('fiche relue mais pas écrite (migration manquante) : signalé une fois', async () => {
    mockInvoke.mockResolvedValue({ data: { product: serverProduct(), cached: false, written: false }, error: null });
    await getOrFetchProduct(BARCODE);
    expect(mockLogError).toHaveBeenCalledWith(expect.any(Error), { kind: 'not_written', status: 200 });
  });

  it('404 de la passerelle (fonction absente) signalé ; 404 « not_found » de la fonction, non', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: new Error('HTTP'),
      response: { status: 404, json: async () => ({ code: 'not_found', message: 'Produit introuvable.' }) },
    });
    await getOrFetchProduct(BARCODE);
    expect(mockLogError).not.toHaveBeenCalled();
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: new Error('HTTP'),
      response: { status: 404, json: async () => ({ message: 'Requested function was not found' }) },
    });
    await getOrFetchProduct(BARCODE);
    expect(mockLogError).toHaveBeenCalledWith(expect.any(Error), { kind: 'function_missing', status: 404 });
  });
});

describe('budget local d’appels : les listes ne déclenchent pas une invocation par fiche (lot C)', () => {
  const NOW = Date.parse('2026-11-06T12:00:00.000Z');
  let now = NOW;

  beforeEach(() => {
    now = NOW;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    mockReadRow.mockReturnValue(row(new Date(NOW - 8 * DAY).toISOString()));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('11 fiches périmées dans la minute : 10 appels, la 11e lit OFF directement', async () => {
    mockInvoke.mockResolvedValue({ data: { product: serverProduct(), cached: false }, error: null });
    for (let i = 0; i < 11; i += 1) await getOrFetchProduct(BARCODE);
    expect(mockInvoke).toHaveBeenCalledTimes(10);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it('refus de la fonction (429, Retry-After 60) : plus aucun appel pendant 60 s', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: new Error('HTTP'),
      response: { status: 429, headers: { get: (name: string) => (name === 'Retry-After' ? '60' : null) } },
    });
    await getOrFetchProduct(BARCODE);
    await getOrFetchProduct(BARCODE);
    expect(mockInvoke).toHaveBeenCalledTimes(1);
    now = NOW + 61_000;
    await getOrFetchProduct(BARCODE);
    expect(mockInvoke).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});

describe('getOrFetchCosmetic — même règle pour le cache cosmétique (lot C)', () => {
  const OBF = { code: '3274080005003', product_name: 'Crème', ingredients_text: 'Aqua, Glycerin' };

  it('fiche absente : la fonction est appelée en « cosmetic », le client n’écrit rien', async () => {
    mockInvoke.mockResolvedValue({
      data: { product: { barcode: OBF.code, name: 'Crème (serveur)' }, cached: false },
      error: null,
    });
    const product = await getOrFetchCosmetic(OBF.code);
    expect(mockInvoke).toHaveBeenCalledWith('cache-product', expect.objectContaining({ body: { barcode: OBF.code, type: 'cosmetic' } }));
    expect(product?.name).toBe('Crème (serveur)');
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it('fonction injoignable : lecture directe d’OBF, aucune écriture', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('Fetch'), response: undefined });
    sourceResponds(OBF);
    const product = await getOrFetchCosmetic(OBF.code);
    expect(product?.ingredients_list).toEqual(['aqua', 'glycerin']);
    expect(mockWrite).not.toHaveBeenCalled();
  });
});

describe('appel réel de cache-product, vu d’un navigateur (lot C)', () => {
  /**
   * Sur le web, le navigateur n'envoie la requête que si la réponse au
   * « preflight » admet chacun de ses en-têtes. Fixer la région fait ajouter
   * `x-region` par functions-js : refusé par le CORS de la fonction, il ferait
   * échouer chaque appel en silence, et le cache ne se remplirait jamais depuis
   * le web. L'appel passe ici par le vrai client Supabase, avec les options
   * qu'emploie l'app.
   */
  it('le CORS de la fonction admet chaque en-tête de l’appel, x-region compris', async () => {
    const sent: string[][] = [];
    const capture: typeof fetch = async (_input, init) => {
      const names: string[] = [];
      new Headers(init?.headers).forEach((_value, name) => names.push(name));
      sent.push(names);
      return new Response(JSON.stringify({ product: serverProduct(), cached: false, written: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };
    const real = createClient('https://projet.supabase.co', 'cle-publique', {
      global: { fetch: capture },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    mockInvoke.mockImplementation((name: string, options: FunctionInvokeOptions) => real.functions.invoke(name, options));

    expect((await getOrFetchProduct(BARCODE))?.name).toBe('Nutella (serveur)');

    const index = fs.readFileSync(path.resolve(__dirname, '../../../../supabase/functions/cache-product/index.ts'), 'utf8');
    const allowed = (/'Access-Control-Allow-Headers':\s*'([^']*)'/.exec(index)?.[1] ?? '')
      .split(',')
      .map((name) => name.trim().toLowerCase());
    expect(sent).toHaveLength(1);
    expect(sent[0]).toContain('x-region');
    expect(sent[0].filter((name) => !allowed.includes(name))).toEqual([]);
  });
});

describe('contrat — aucun code de l’app n’écrit products ni cosmetic_products (lot C)', () => {
  const ROOT = path.resolve(__dirname, '../../../..');

  function sourceFiles(dir: string): string[] {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '__tests__' || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) out.push(...sourceFiles(full));
      else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out.push(full);
    }
    return out;
  }

  /** Chaque `.from('products' | 'cosmetic_products')` suivi, dans la même expression, d'une écriture. */
  function cacheWrites(source: string, file: string): string[] {
    const found: string[] = [];
    for (const m of source.matchAll(/\.from\(\s*['"`](products|cosmetic_products)['"`]\s*\)/g)) {
      const at = m.index ?? 0;
      const expression = source.slice(at, source.indexOf(';', at) === -1 ? undefined : source.indexOf(';', at));
      const write = /\.(upsert|insert|update|delete)\s*\(/.exec(expression);
      if (write) found.push(`${file}:${source.slice(0, at).split('\n').length} · ${m[1]}.${write[1]}`);
    }
    return found;
  }

  it('le relevé voit une écriture chaînée, et pas une lecture', () => {
    const fixture = [
      "await supabase.from('products').upsert(p, { onConflict: 'barcode' }).select();",
      "await supabase.from('products').select('*').eq('barcode', b);",
      "await supabase\n  .from('cosmetic_products')\n  .insert(c);",
    ].join('\n');
    expect(cacheWrites(fixture, 'fixture.ts')).toEqual(['fixture.ts:1 · products.upsert', 'fixture.ts:4 · cosmetic_products.insert']);
  });

  it('les listes (accueil, catégories, enseignes) passent toutes refresh: false', () => {
    const LIST_CALLERS = ['app/category/[slug].tsx', 'app/store/[slug].tsx', 'src/lib/api/top-by-category.ts'];
    for (const file of LIST_CALLERS) {
      const code = fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
      const calls = [...code.matchAll(/getOrFetch(?:Product|Cosmetic)\(([^)]*)\)/g)].map((m) => `${file} · ${m[1]}`);
      expect(calls.length).toBeGreaterThan(0);
      expect(calls.filter((call) => !/refresh:\s*false/.test(call))).toEqual([]);
    }
  });

  it('aucun accès à la base hors du client Supabase : ni « /rest/v1/ », ni .rpc()', () => {
    const direct = ['app', 'src'].flatMap((dir) =>
      sourceFiles(path.join(ROOT, dir)).flatMap((full) => {
        const source = fs.readFileSync(full, 'utf8');
        return /\/rest\/v1\/|\.rpc\s*\(/.test(source) ? [path.relative(ROOT, full)] : [];
      }),
    );
    expect(direct).toEqual([]);
  });

  it('app/ et src/ ne contiennent aucune écriture des deux caches', () => {
    const writes = ['app', 'src'].flatMap((dir) =>
      sourceFiles(path.join(ROOT, dir)).flatMap((full) => cacheWrites(fs.readFileSync(full, 'utf8'), path.relative(ROOT, full))),
    );
    expect(writes).toEqual([]);
  });
});
