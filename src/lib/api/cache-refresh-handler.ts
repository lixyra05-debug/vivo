/**
 * Ce que fait l'Edge Function `cache-product` (lot C), sans Deno ni réseau :
 * chaque accès (Supabase Auth, base, source) passe par `RefreshDeps`, que
 * `supabase/functions/cache-product/index.ts` branche sur `fetch`. Jest peut
 * donc tester tout le parcours sans jamais exécuter la fonction. Importé par
 * Deno, d'où les imports relatifs en `.ts`.
 *
 * Ordre, et pourquoi :
 *  1. demande : un code-barres et un type, rien d'autre ;
 *  2. utilisateur connecté, vérifié par Supabase Auth ;
 *  3. fiche fraîche à l'horloge du serveur → servie, sans rien d'autre ;
 *  4. source en pause après un refus (429, 503) → pas d'appel ;
 *  5. inscription au journal PUIS comptage : une rafale simultanée se voit
 *     elle-même, et ne passe pas sous les quotas ; refus → l'inscription est
 *     retirée, pour ne pas épuiser le plafond des autres ;
 *  6. relecture de la source, normalisation par le code de l'app, écriture.
 * Le contenu écrit vient toujours de la source, jamais de la demande.
 */
import { normalizeOFFProduct, type OFFProduct } from './off-normalize.ts';
import { normalizeOBFProduct, type OBFProduct } from './obf-normalize.ts';
import {
  decideQuota,
  isCacheFresh,
  parseRefreshRequest,
  toCacheRow,
  type CacheProductType,
  type RefreshErrorCode,
} from './cache-refresh-rules.ts';

export type RefreshSource = 'off' | 'obf';
export type CacheTable = 'products' | 'cosmetic_products';

export const SOURCES: Record<CacheProductType, { table: CacheTable; source: RefreshSource }> = {
  food: { table: 'products', source: 'off' },
  cosmetic: { table: 'cosmetic_products', source: 'obf' },
};

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
/** Au-delà, le journal ne sert plus aux quotas : purgé (migration 018). */
export const LOG_RETENTION_MS = 2 * DAY_MS;

export type Upstream =
  | { status: 'found'; product: Record<string, unknown> }
  | { status: 'not_found' }
  | { status: 'busy'; retryAfterSeconds: number }
  | { status: 'error' };

/** Filtres de comptage du journal (`since` : instant en millisecondes). */
export type RefreshCountFilter =
  | { userId: string; since: number }
  | { source: RefreshSource; since: number };

export interface RefreshDeps {
  now(): number;
  /** L'identifiant de l'utilisateur connecté, ou `null` (clé publique seule, jeton invalide). */
  authenticate(authorization: string | null): Promise<string | null>;
  readCached(table: CacheTable, barcode: string): Promise<Record<string, unknown> | null>;
  /** Inscrit la demande au journal ; l'identifiant de la ligne, ou `null` si la base refuse. */
  insertRefresh(userId: string, source: RefreshSource): Promise<number | null>;
  countRefreshes(filter: RefreshCountFilter): Promise<number | null>;
  deleteRefresh(id: number): Promise<void>;
  /** Purge, pour cette source, les lignes antérieures à `before`. Best effort. */
  purgeRefreshes(source: RefreshSource, before: number): Promise<void>;
  fetchUpstream(source: RefreshSource, barcode: string): Promise<Upstream>;
  upsert(table: CacheTable, row: object): Promise<Record<string, unknown> | null>;
  /** Pause de la source après un refus, partagée par les demandes d'une même instance. */
  upstreamPause: Record<RefreshSource, number>;
}

export interface RefreshResponse {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}

function failure(code: RefreshErrorCode, message: string, status: number, headers?: Record<string, string>): RefreshResponse {
  return { status, body: { code, message }, headers };
}

export async function handleRefresh(
  method: string,
  authorization: string | null,
  body: unknown,
  deps: RefreshDeps,
): Promise<RefreshResponse> {
  if (method !== 'POST') return failure('invalid_request', 'Méthode non supportée.', 405);

  const request = parseRefreshRequest(body);
  if (!request) return failure('invalid_request', 'Code-barres ou type invalide.', 400);

  const userId = await deps.authenticate(authorization);
  if (!userId) return failure('unauthorized', 'Connexion requise.', 401);

  const { table, source } = SOURCES[request.type];

  const cached = await deps.readCached(table, request.barcode);
  if (cached && isCacheFresh(typeof cached.updated_at === 'string' ? cached.updated_at : null, deps.now())) {
    return { status: 200, body: { product: cached, cached: true, written: false } };
  }

  const pausedFor = deps.upstreamPause[source] - deps.now();
  if (pausedFor > 0) {
    return failure('upstream_busy', 'Source saturée. Réessaie plus tard.', 503, {
      'Retry-After': String(Math.ceil(pausedFor / 1000)),
    });
  }

  const logId = await deps.insertRefresh(userId, source);
  if (logId === null) return failure('server_error', 'Journal illisible.', 503);

  const now = deps.now();
  const [userLastMinute, userLastDay, sourceLastMinute] = await Promise.all([
    deps.countRefreshes({ userId, since: now - MINUTE_MS }),
    deps.countRefreshes({ userId, since: now - DAY_MS }),
    deps.countRefreshes({ source, since: now - MINUTE_MS }),
  ]);
  if (userLastMinute === null || userLastDay === null || sourceLastMinute === null) {
    await deps.deleteRefresh(logId);
    return failure('server_error', 'Journal illisible.', 503);
  }
  const verdict = decideQuota({ userLastMinute, userLastDay, sourceLastMinute });
  if (verdict !== 'ok') {
    await deps.deleteRefresh(logId);
    return failure('rate_limited', 'Trop de relectures. Réessaie plus tard.', 429, {
      'Retry-After': verdict === 'user_day' ? '3600' : '60',
    });
  }
  await deps.purgeRefreshes(source, now - LOG_RETENTION_MS);

  const upstream = await deps.fetchUpstream(source, request.barcode);
  if (upstream.status === 'not_found') return failure('not_found', 'Produit introuvable.', 404);
  if (upstream.status === 'busy') {
    deps.upstreamPause[source] = deps.now() + upstream.retryAfterSeconds * 1000;
    return failure('upstream_busy', 'Source saturée. Réessaie plus tard.', 503, {
      'Retry-After': String(upstream.retryAfterSeconds),
    });
  }
  if (upstream.status === 'error') return failure('upstream_busy', 'Source injoignable.', 503);

  // La clé du cache est le code demandé, celui que relisent les clients.
  const normalized =
    request.type === 'food'
      ? normalizeOFFProduct({ ...(upstream.product as unknown as OFFProduct), code: request.barcode })
      : normalizeOBFProduct({ ...(upstream.product as unknown as OBFProduct), code: request.barcode });
  const written = await deps.upsert(table, toCacheRow(normalized));
  // Écriture refusée (migration absente…) : la fiche relue de la source reste sûre à servir.
  return { status: 200, body: { product: written ?? normalized, cached: false, written: written !== null } };
}
