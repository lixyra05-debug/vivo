/**
 * fetchWithTimeout — wrapper réseau résilient pour Vivo.
 *
 * Fournit :
 *  - timeout par tentative (AbortController + setTimeout)
 *  - retry exponentiel sur erreur réseau et HTTP 5xx
 *  - gestion HTTP 429 avec Retry-After (cap MAX_429_WAIT_MS)
 *  - support d'un AbortSignal externe via listener manuel
 *    (AbortSignal.any non garanti dispo en Hermes/Expo SDK 54)
 *
 * En cas d'épuisement des retries → throw FetchTimeoutError (attempts = nb total).
 * Ne dépend d'aucune lib externe.
 */

import { addBreadcrumb } from '@/src/lib/monitoring/sentry';

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRIES = 2;
const DEFAULT_BACKOFF_MS = 500;
const MAX_429_WAIT_MS = 5000;

export class FetchTimeoutError extends Error {
  public readonly attempts: number;

  constructor(message: string, attempts: number) {
    super(message);
    this.name = 'FetchTimeoutError';
    this.attempts = attempts;
  }
}

export interface FetchOptions extends Omit<RequestInit, 'signal'> {
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
  on429?: 'wait' | 'skip';
  signal?: AbortSignal;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    backoffMs = DEFAULT_BACKOFF_MS,
    on429 = 'wait',
    signal: externalSignal,
    ...fetchInit
  } = options;

  let lastError: Error | null = null;
  const totalAttempts = retries + 1;

  for (let attempt = 0; attempt < totalAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const onExternalAbort = (): void => controller.abort();

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener('abort', onExternalAbort, { once: true });
      }
    }

    try {
      const res = await fetch(url, { ...fetchInit, signal: controller.signal });

      // 429 — Too Many Requests
      if (res.status === 429) {
        if (on429 === 'skip') return res;
        const retryAfterHeader = res.headers.get('Retry-After');
        const retryAfterSec = retryAfterHeader
          ? parseInt(retryAfterHeader, 10)
          : NaN;
        const waitMs =
          Number.isFinite(retryAfterSec) && retryAfterSec > 0
            ? Math.min(retryAfterSec * 1000, MAX_429_WAIT_MS)
            : Math.min(backoffMs * Math.pow(2, attempt), MAX_429_WAIT_MS);
        if (attempt < totalAttempts - 1) {
          clearTimeout(timeoutId);
          externalSignal?.removeEventListener('abort', onExternalAbort);
          await wait(waitMs);
          continue;
        }
        return res;
      }

      // 5xx — retry
      if (res.status >= 500 && attempt < totalAttempts - 1) {
        clearTimeout(timeoutId);
        externalSignal?.removeEventListener('abort', onExternalAbort);
        await wait(backoffMs * Math.pow(2, attempt));
        continue;
      }

      return res;
    } catch (err) {
      lastError = err as Error;
      if (attempt < totalAttempts - 1) {
        clearTimeout(timeoutId);
        externalSignal?.removeEventListener('abort', onExternalAbort);
        await wait(backoffMs * Math.pow(2, attempt));
        continue;
      }
    } finally {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    }
  }

  // Breadcrumb Sentry — R8 : on n'inclut PAS l'URL (peut contenir un barcode).
  addBreadcrumb({
    message: 'fetch timeout',
    category: 'http',
    level: 'warning',
    data: { attempts: totalAttempts },
  });

  throw new FetchTimeoutError(
    `Réseau indisponible : ${lastError?.message ?? 'timeout'}`,
    totalAttempts,
  );
}
