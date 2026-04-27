/**
 * logger — façade unifiée au-dessus du wrapper Sentry de Vivo.
 *
 * R5 : ne JAMAIS appeler console.*. Tous les niveaux passent par
 * `addBreadcrumb` (info / warning / error). `error()` ajoute en plus un
 * envoi via `captureError` pour que la stack remonte sur Sentry en prod.
 *
 * Niveaux Sentry :
 *  - debug → 'info'
 *  - info  → 'info'
 *  - warn  → 'warning'
 *  - error → 'error' + capture exception
 */

import { addBreadcrumb, captureError } from '@/src/lib/monitoring/sentry';

export function debug(message: string, data?: Record<string, unknown>): void {
  addBreadcrumb({ message, level: 'info', data });
}

export function info(message: string, data?: Record<string, unknown>): void {
  addBreadcrumb({ message, level: 'info', data });
}

export function warn(message: string, data?: Record<string, unknown>): void {
  addBreadcrumb({ message, level: 'warning', data });
}

export function error(err: Error, context?: Record<string, unknown>): void {
  captureError(err, context);
  addBreadcrumb({
    message: err.message,
    level: 'error',
    data: context,
  });
}
