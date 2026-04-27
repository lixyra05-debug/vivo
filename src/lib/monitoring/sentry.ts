/**
 * Wrapper Sentry pour Vivo (item M-001 — Sprint 2).
 *
 * R8 — STRICT PII : aucune information personnelle ne doit jamais sortir.
 *  - On strip email / ip_address / username de event.user (on garde l'id anon)
 *  - On drop tout event/breadcrumb dont l'URL ou le message contient "barcode"
 *  - On drop les breadcrumbs nav vers /health-profile, /auth, /onboarding
 *
 * Graceful degradation (D6) : si EXPO_PUBLIC_SENTRY_DSN absent → on bail
 * silencieusement, sans throw, et toutes les fonctions deviennent no-op.
 */

import * as Sentry from '@sentry/react-native';
import type { Breadcrumb, ErrorEvent } from '@sentry/react-native';

const SENSITIVE_NAV_PREFIXES = ['/health-profile', '/auth', '/onboarding'];

function containsBarcode(value: unknown): boolean {
  return typeof value === 'string' && value.toLowerCase().includes('barcode');
}

function navTargetIsSensitive(target: unknown): boolean {
  if (typeof target !== 'string') return false;
  return SENSITIVE_NAV_PREFIXES.some((prefix) => target.startsWith(prefix));
}

/**
 * beforeSend — Sentry hook appelé avant envoi de chaque event.
 *  - Drop si message ou request.url contient "barcode"
 *  - Strip user.email / user.ip_address / user.username (on garde id anon)
 */
export function beforeSend(event: ErrorEvent): ErrorEvent | null {
  if (containsBarcode(event.message) || containsBarcode(event.request?.url)) {
    return null;
  }
  if (event.user) {
    // Ne conserve QUE l'id anonyme (Supabase UUID). Tout le reste est PII.
    event.user = { id: event.user.id };
  }
  return event;
}

/**
 * beforeBreadcrumb — Sentry hook appelé avant chaque breadcrumb.
 *  - Drop nav breadcrumbs vers écrans sensibles (/health-profile, /auth, /onboarding)
 *  - Drop tout breadcrumb dont data.url ou message contient "barcode"
 */
export function beforeBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  if (containsBarcode(breadcrumb.message)) return null;
  if (containsBarcode(breadcrumb.data?.url)) return null;

  if (breadcrumb.category === 'navigation') {
    const to = breadcrumb.data?.to;
    const from = breadcrumb.data?.from;
    if (navTargetIsSensitive(to) || navTargetIsSensitive(from)) {
      return null;
    }
  }
  return breadcrumb;
}

let initialized = false;

/**
 * Initialise Sentry. No-op si EXPO_PUBLIC_SENTRY_DSN absent (graceful degradation).
 * Idempotent : double appel ignoré.
 */
export function initSentry(): void {
  if (initialized) return;
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    return;
  }
  Sentry.init({
    dsn,
    tracesSampleRate: 0.2,
    enableNative: true,
    attachScreenshot: false,
    sendDefaultPii: false,
    beforeSend,
    beforeBreadcrumb,
  });
  initialized = true;
}

/**
 * Capture une erreur. En dev (`__DEV__ === true`) → no-op (le composant
 * appelant peut logger localement via console.error si pertinent, ex.
 * ErrorBoundary). En prod → forward à Sentry avec un contexte optionnel.
 *
 * Ne throw jamais, même si Sentry n'est pas initialisé.
 */
export function captureError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (__DEV__) return;
  try {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  } catch {
    // Silent — surveillance ne doit jamais casser l'app
  }
}

/**
 * Ajoute un breadcrumb (trace utilisateur) à Sentry.
 * Ne throw jamais, même si Sentry n'est pas initialisé.
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}): void {
  try {
    Sentry.addBreadcrumb(breadcrumb);
  } catch {
    // Silent
  }
}
