/**
 * Règles du cache produits écrit par le serveur (lot C).
 *
 * Partagées par l'app et l'Edge Function `cache-product` (Deno), qui les
 * importe telles quelles : d'où l'absence d'import. Le client ne fait plus que
 * lire les caches `products` et `cosmetic_products` ; seule la fonction les
 * écrit, après avoir relu Open Food Facts (ou Open Beauty Facts) elle-même.
 * Ces règles décident quand une fiche en cache peut servir, quelle demande
 * mérite une relecture, et combien de relectures la fonction s'autorise.
 */

/** Une fiche en cache sert 7 jours, comme avant le lot C. */
export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Avance tolérée d'une date `updated_at` sur l'horloge du serveur. Au-delà, la
 * date est fausse : avant le lot C, le client fixait lui-même `updated_at`, et
 * une date mise dans le futur rendait une fiche « fraîche » pour toujours.
 */
export const SERVER_CLOCK_SKEW_MS = 5 * 60 * 1000;

/**
 * Même tolérance, lue à l'horloge d'un téléphone, qui peut retarder : avec
 * 5 minutes, un appareil en retard verrait chaque date du serveur « dans le
 * futur » et relirait tout. Un jour suffit à écarter les dates forgées
 * (« 2099-01-01 »).
 */
export const CLIENT_CLOCK_SKEW_MS = 24 * 60 * 60 * 1000;

/**
 * Vrai si une fiche datée `updatedAt` peut servir telle quelle à l'instant
 * `now` ; `skewMs` est l'avance tolérée de l'horloge qui a daté la fiche.
 */
export function isCacheFresh(
  updatedAt: string | null | undefined,
  now: number,
  skewMs: number = SERVER_CLOCK_SKEW_MS,
): boolean {
  if (!updatedAt) return false;
  const written = Date.parse(updatedAt);
  if (!Number.isFinite(written)) return false;
  if (written > now + skewMs) return false;
  return now - written <= CACHE_TTL_MS;
}

/**
 * Vrai pour un code-barres de 8 à 14 chiffres. Pas de contrôle de la clé : elle
 * se calcule, elle n'arrête aucun abus (les quotas s'en chargent), et elle
 * écarterait des codes réels — un UPC-E à 8 chiffres porte la clé de son UPC-A,
 * pas celle d'un EAN-8, et le scanner lit les UPC-E (`app/(tabs)/scan.tsx`).
 * Un code refusé n'est pas perdu : le client lit alors OFF lui-même.
 */
export function isValidBarcode(code: string): boolean {
  return /^\d{8,14}$/.test(code);
}

export type CacheProductType = 'food' | 'cosmetic';

/** Ce que la fonction accepte : un code-barres et un type, rien d'autre. */
export interface RefreshRequest {
  barcode: string;
  type: CacheProductType;
}

/**
 * La demande lue dans le corps de la requête, ou `null`. Tout autre champ est
 * ignoré : un contenu de fiche fourni par le client n'est jamais écrit.
 */
export function parseRefreshRequest(body: unknown): RefreshRequest | null {
  if (!body || typeof body !== 'object') return null;
  const { barcode, type } = body as Record<string, unknown>;
  if (type !== 'food' && type !== 'cosmetic') return null;
  if (typeof barcode !== 'string' || !isValidBarcode(barcode)) return null;
  return { barcode, type };
}

/**
 * Relectures autorisées. OFF limite la lecture de fiches à 15 requêtes par
 * minute et par adresse IP, sous peine de bannissement de l'adresse ; les Edge
 * Functions sortent par des adresses partagées. La fonction reste donc sous ce
 * seuil pour l'ensemble des comptes, source par source.
 */
export const REFRESH_QUOTAS = {
  perUserPerMinute: 10,
  perUserPerDay: 200,
  globalPerMinutePerSource: 12,
} as const;

/**
 * Relectures comptées dans le journal, la demande en cours COMPRISE : la
 * fonction l'inscrit avant de compter, pour qu'aucune rafale simultanée ne
 * passe sous un compte qui ne la voit pas encore.
 */
export interface QuotaCounts {
  /** Relectures de ce compte dans la dernière minute. */
  userLastMinute: number;
  /** Relectures de ce compte dans les dernières 24 heures. */
  userLastDay: number;
  /** Relectures de tous les comptes, pour cette source, dans la dernière minute. */
  sourceLastMinute: number;
}

export type QuotaVerdict = 'ok' | 'user_minute' | 'user_day' | 'global';

export function decideQuota(counts: QuotaCounts): QuotaVerdict {
  if (counts.userLastMinute > REFRESH_QUOTAS.perUserPerMinute) return 'user_minute';
  if (counts.userLastDay > REFRESH_QUOTAS.perUserPerDay) return 'user_day';
  if (counts.sourceLastMinute > REFRESH_QUOTAS.globalPerMinutePerSource) return 'global';
  return 'ok';
}

/**
 * Champs que la base fixe elle-même : les dates (trigger de la migration 018)
 * et les compteurs, qu'aucune relecture ne doit remettre à zéro.
 */
const SERVER_OWNED_FIELDS = ['created_at', 'updated_at', 'scan_count', 'our_score', 'our_score_computed_at'] as const;

type ServerOwnedField = (typeof SERVER_OWNED_FIELDS)[number];

/** La ligne que la fonction écrit : la fiche normalisée, sans les champs de la base. */
export function toCacheRow<T extends object>(product: T): Omit<T, ServerOwnedField> {
  const row = { ...product } as Record<string, unknown>;
  for (const field of SERVER_OWNED_FIELDS) delete row[field];
  return row as Omit<T, ServerOwnedField>;
}

/** Codes d'erreur de `cache-product`, avec leur statut HTTP. */
export type RefreshErrorCode =
  | 'invalid_request' // 400 (ou 405)
  | 'unauthorized' // 401 : pas d'utilisateur connecté
  | 'not_found' // 404 : la source ne connaît pas ce code-barres
  | 'rate_limited' // 429 : quota du compte ou plafond global
  | 'upstream_busy' // 503 : source saturée ou injoignable
  | 'server_error'; // 500 ou 503 : configuration, journal illisible
