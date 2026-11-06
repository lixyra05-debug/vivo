// supabase/functions/cache-product/index.ts
// Deno runtime — Supabase Edge Function (lot C)
//
// Seul écrivain des caches `products` et `cosmetic_products`. Toute la décision
// vit dans `src/lib/api/cache-refresh-handler.ts` (testé par Jest) ; ce fichier
// ne fait que la brancher sur Supabase Auth, la base (PostgREST, clé de
// service) et la source (OFF, OBF). Le client ne transmet jamais de contenu de
// fiche. Aucune dépendance externe, aucune image stockée, aucun code-barres
// dans les journaux de la fonction.

import {
  handleRefresh,
  type CacheTable,
  type RefreshCountFilter,
  type RefreshDeps,
  type RefreshSource,
  type Upstream,
} from '../../../src/lib/api/cache-refresh-handler.ts';

// `x-region` : functions-js l'ajoute quand le client fixe la région ; refusé
// ici, le navigateur bloquerait chaque appel de la version web.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-region',
};

/** Exigé par OFF : `AppName/Version (ContactEmail)`, comme le client. */
const USER_AGENT = 'Vivo/1.0 (contact@lyxiria.com)';
/** Plus court que l'attente du client (10 s) : il ne relit pas OFF pendant que la fonction écrit. */
const UPSTREAM_TIMEOUT_MS = 5000;

const UPSTREAM_BASE: Record<RefreshSource, string> = {
  off: 'https://fr.openfoodfacts.org/api/v2',
  obf: 'https://world.openbeautyfacts.org/api/v2',
};

interface ServerEnv {
  url: string;
  /** Clé de service : ne quitte jamais le serveur. */
  serviceKey: string;
  /** Clé publique, pour interroger Supabase Auth. */
  publicKey: string;
}

/** Une clé du dictionnaire JSON des nouvelles clés (`{"default": "…"}`). */
function defaultKey(json: string | undefined): string | undefined {
  if (!json) return undefined;
  try {
    const keys = JSON.parse(json) as Record<string, unknown>;
    return typeof keys['default'] === 'string' ? keys['default'] : undefined;
  } catch {
    return undefined;
  }
}

/** Clés du projet, nouvelles (`SUPABASE_SECRET_KEYS`) ou héritées (`SUPABASE_SERVICE_ROLE_KEY`). */
function readEnv(): ServerEnv | null {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey =
    defaultKey(Deno.env.get('SUPABASE_SECRET_KEYS')) ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const publicKey =
    defaultKey(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')) ?? Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !serviceKey || !publicKey) return null;
  return { url, serviceKey, publicKey };
}

/** Une clé héritée est un JWT et voyage aussi en `Bearer` ; une nouvelle clé, jamais. */
function keyHeaders(key: string): Record<string, string> {
  return key.startsWith('eyJ') ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
}

const iso = (ms: number) => encodeURIComponent(new Date(ms).toISOString());

/** Pause de chaque source, propre à cette instance de la fonction. */
const upstreamPause: Record<RefreshSource, number> = { off: 0, obf: 0 };

function liveDeps(env: ServerEnv): RefreshDeps {
  const rest = `${env.url}/rest/v1`;
  const service = { ...keyHeaders(env.serviceKey), 'Content-Type': 'application/json' };
  return {
    now: () => Date.now(),

    async authenticate(authorization) {
      if (!authorization?.startsWith('Bearer ')) return null;
      try {
        const res = await fetch(`${env.url}/auth/v1/user`, {
          headers: { apikey: env.publicKey, Authorization: authorization },
        });
        if (!res.ok) return null;
        const user = (await res.json()) as { id?: unknown };
        return typeof user.id === 'string' ? user.id : null;
      } catch {
        return null;
      }
    },

    async readCached(table: CacheTable, barcode) {
      try {
        const res = await fetch(`${rest}/${table}?barcode=eq.${barcode}&select=*`, { headers: service });
        if (!res.ok) return null;
        const rows = (await res.json()) as Array<Record<string, unknown>>;
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },

    async insertRefresh(userId, source) {
      try {
        const res = await fetch(`${rest}/cache_refresh_log?select=id`, {
          method: 'POST',
          headers: { ...service, Prefer: 'return=representation' },
          body: JSON.stringify({ user_id: userId, source }),
        });
        if (!res.ok) return null;
        const rows = (await res.json()) as Array<{ id?: unknown }>;
        return typeof rows[0]?.id === 'number' ? rows[0].id : null;
      } catch {
        return null;
      }
    },

    async countRefreshes(filter: RefreshCountFilter) {
      const where = 'userId' in filter ? `user_id=eq.${filter.userId}` : `source=eq.${filter.source}`;
      try {
        const res = await fetch(`${rest}/cache_refresh_log?select=id&${where}&requested_at=gte.${iso(filter.since)}`, {
          method: 'HEAD',
          headers: { ...service, Prefer: 'count=exact' },
        });
        if (!res.ok) return null;
        const total = Number(res.headers.get('Content-Range')?.split('/')[1]);
        return Number.isFinite(total) ? total : null;
      } catch {
        return null;
      }
    },

    async deleteRefresh(id) {
      try {
        await fetch(`${rest}/cache_refresh_log?id=eq.${id}`, {
          method: 'DELETE',
          headers: { ...service, Prefer: 'return=minimal' },
        });
      } catch {
        // Restée en trop, la ligne compte comme une relecture de plus : elle ne
        // peut que faire refuser plus tôt, jamais faire appeler la source.
      }
    },

    async purgeRefreshes(source, before) {
      try {
        await fetch(`${rest}/cache_refresh_log?source=eq.${source}&requested_at=lt.${iso(before)}`, {
          method: 'DELETE',
          headers: { ...service, Prefer: 'return=minimal' },
        });
      } catch {
        // Une purge manquée sera rattrapée à la relecture suivante.
      }
    },

    async fetchUpstream(source, barcode): Promise<Upstream> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
      try {
        const res = await fetch(`${UPSTREAM_BASE[source]}/product/${barcode}.json`, {
          headers: { 'User-Agent': USER_AGENT },
          signal: controller.signal,
        });
        if (res.status === 404) return { status: 'not_found' };
        if (res.status === 429 || res.status === 503) {
          const seconds = Number(res.headers.get('Retry-After'));
          return { status: 'busy', retryAfterSeconds: Number.isFinite(seconds) && seconds > 0 ? seconds : 60 };
        }
        if (!res.ok) return { status: 'error' };
        const data = (await res.json()) as { status?: unknown; product?: unknown };
        if (data.status !== 1 || !data.product || typeof data.product !== 'object') return { status: 'not_found' };
        return { status: 'found', product: data.product as Record<string, unknown> };
      } catch {
        return { status: 'error' };
      } finally {
        clearTimeout(timer);
      }
    },

    async upsert(table, row) {
      try {
        const res = await fetch(`${rest}/${table}?on_conflict=barcode`, {
          method: 'POST',
          headers: { ...service, Prefer: 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify(row),
        });
        if (!res.ok) return null;
        const rows = (await res.json()) as Array<Record<string, unknown>>;
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },

    upstreamPause,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

  const env = readEnv();
  if (!env) return json({ code: 'server_error', message: 'Configuration serveur incomplète.' }, 500);

  let body: unknown = null;
  if (req.method === 'POST') {
    try {
      body = await req.json();
    } catch {
      return json({ code: 'invalid_request', message: 'JSON invalide.' }, 400);
    }
  }

  const result = await handleRefresh(req.method, req.headers.get('Authorization'), body, liveDeps(env));
  return json(result.body, result.status, result.headers);
});

function json(body: unknown, status: number, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, ...extraHeaders, 'Content-Type': 'application/json' },
  });
}
