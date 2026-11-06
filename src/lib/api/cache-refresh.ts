/**
 * Demande à l'Edge Function `cache-product` de relire une fiche à la source et
 * de l'écrire dans le cache (lot C).
 *
 * Le client n'écrit plus jamais `products` ni `cosmetic_products` : il lit le
 * cache et, quand la fiche manque ou a vieilli, laisse le serveur relire Open
 * Food Facts (ou Open Beauty Facts) lui-même. Sans session, ou pour un code
 * qu'elle refuserait, la fonction n'est pas appelée. Toute erreur — 404 compris,
 * que la passerelle renvoie aussi quand la fonction n'est pas déployée — vaut
 * `unavailable`, et l'appelant lit la source directement, sans rien écrire.
 */
import { FunctionRegion } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { REFRESH_QUOTAS, isValidBarcode, type CacheProductType } from './cache-refresh-rules';
import { error as logError, warn as logWarn } from '../utils/logger';

/** Plus long que l'appel à la source côté fonction (5 s) et ses accès à la base. */
const REFRESH_TIMEOUT_MS = 10 * 1000;

export interface CacheReadOptions {
  /**
   * `false` : ne pas demander de relecture au serveur. Les listes (accueil,
   * catégories, enseignes) lisent jusqu'à 50 fiches à la fois : elles laissent
   * le budget de relecture aux fiches ouvertes, dont dépend l'historique.
   */
  refresh?: boolean;
}

export type CacheRefreshResult<T> =
  | { kind: 'product'; product: T }
  /** Code hors format, pas de session, fonction absente ou injoignable, quota atteint, réponse inattendue. */
  | { kind: 'unavailable' };

/**
 * Budget local d'appels, calqué sur le quota par compte de la fonction : au-delà,
 * la fiche se lit directement à la source, sans appel.
 */
const BUDGET_WINDOW_MS = 60 * 1000;
/** Pause après un refus (429, 5xx), à défaut de `Retry-After`. */
const DEFAULT_PAUSE_MS = 60 * 1000;

let recentCalls: number[] = [];
let pausedUntil = 0;
/** Anomalies déjà signalées dans cette session : une seule remontée chacune. */
const reported = new Set<string>();

/** Réservé aux tests : remet le budget, la pause et les signalements à zéro. */
export function __resetCacheRefreshThrottleForTests(): void {
  recentCalls = [];
  pausedUntil = 0;
  reported.clear();
}

function takeBudget(now: number): boolean {
  if (now < pausedUntil) return false;
  recentCalls = recentCalls.filter((t) => now - t < BUDGET_WINDOW_MS);
  if (recentCalls.length >= REFRESH_QUOTAS.perUserPerMinute) return false;
  recentCalls.push(now);
  return true;
}

function pauseAfter(response: Response | undefined, now: number): void {
  const seconds = Number(response?.headers?.get('Retry-After'));
  pausedUntil = now + (Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : DEFAULT_PAUSE_MS);
}

/**
 * Une panne qui empêche le cache de se remplir (fonction absente, clés ou
 * `verify_jwt` mal réglés, migration manquante) remonte une fois par session.
 * Ni code-barres ni message de la réponse : un type et un statut (R8).
 */
function reportOnce(kind: string, status: number | null): void {
  if (reported.has(kind)) return;
  reported.add(kind);
  logError(new Error('Relecture du cache dégradée'), { kind, status });
}

/** Le code d'erreur propre à `cache-product` (`{ code }`), s'il y en a un. */
async function functionErrorCode(response: Response | undefined): Promise<string | null> {
  try {
    const body = (await response?.json()) as { code?: unknown } | undefined;
    return typeof body?.code === 'string' ? body.code : null;
  } catch {
    return null;
  }
}

async function noteFailure(response: Response | undefined): Promise<void> {
  const status = response?.status ?? null;
  if (status === null) {
    logWarn('cache-product injoignable');
    return;
  }
  if (status === 429) {
    pauseAfter(response, Date.now());
    logWarn('cache-product : quota atteint', { status });
    return;
  }
  const code = await functionErrorCode(response);
  if (status >= 500) {
    pauseAfter(response, Date.now());
    if (code === 'upstream_busy') logWarn('cache-product : source saturée', { status });
    else reportOnce(code ?? 'server_error', status);
    return;
  }
  // 404 « not_found » : la source ne connaît pas le code — rien d'anormal.
  if (status === 404 && code === 'not_found') return;
  reportOnce(status === 404 ? 'function_missing' : (code ?? 'http_error'), status);
}

export async function requestCacheRefresh<T extends { barcode: string }>(
  barcode: string,
  type: CacheProductType,
): Promise<CacheRefreshResult<T>> {
  try {
    // Refusé par la fonction (400) : ni un appel facturé, ni un signalement.
    if (!isValidBarcode(barcode)) return { kind: 'unavailable' };
    const { data: auth } = await supabase.auth.getSession();
    if (!auth.session) return { kind: 'unavailable' };
    if (!takeBudget(Date.now())) return { kind: 'unavailable' };
    const { data, error, response } = await supabase.functions.invoke<{ product?: T; cached?: boolean; written?: boolean }>(
      'cache-product',
      {
        body: { barcode, type },
        // Traitement en Irlande, comme l'annonce la politique de confidentialité.
        region: FunctionRegion.EuWest1,
        timeout: REFRESH_TIMEOUT_MS,
      },
    );
    if (error) {
      await noteFailure(response);
      return { kind: 'unavailable' };
    }
    const product = data?.product;
    // Une fiche rendue pour un autre code-barres n'est pas celle demandée.
    if (!product || product.barcode !== barcode) return { kind: 'unavailable' };
    // Relue mais pas écrite : une migration manque (016, 017) ou la base refuse.
    if (data?.cached === false && data.written === false) reportOnce('not_written', 200);
    return { kind: 'product', product };
  } catch {
    return { kind: 'unavailable' };
  }
}
