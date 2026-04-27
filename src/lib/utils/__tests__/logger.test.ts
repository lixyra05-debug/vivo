/**
 * Tests pour logger.ts (M-001 Sprint 2).
 *
 * Le logger n'appelle JAMAIS console.* (R5). Toutes les sorties passent par
 * le wrapper Sentry (`addBreadcrumb` / `captureError`), qui est mocké ici
 * pour isoler le comportement du logger.
 */

jest.mock('@/src/lib/monitoring/sentry', () => ({
  initSentry: jest.fn(),
  captureError: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

import { addBreadcrumb, captureError } from '@/src/lib/monitoring/sentry';
import { debug, info, warn, error as logError } from '../logger';

const mockedAddBreadcrumb = addBreadcrumb as jest.Mock;
const mockedCaptureError = captureError as jest.Mock;

describe('logger', () => {
  beforeEach(() => {
    mockedAddBreadcrumb.mockClear();
    mockedCaptureError.mockClear();
  });

  it("logger.warn: ajoute un breadcrumb avec level 'warning'", () => {
    warn('something is off', { foo: 'bar' });
    expect(mockedAddBreadcrumb).toHaveBeenCalledTimes(1);
    expect(mockedAddBreadcrumb).toHaveBeenCalledWith({
      message: 'something is off',
      level: 'warning',
      data: { foo: 'bar' },
    });
  });

  it("logger.error: appelle à la fois captureError et addBreadcrumb", () => {
    const err = new Error('boom');
    const ctx = { route: '/(tabs)/scan' };
    logError(err, ctx);

    expect(mockedCaptureError).toHaveBeenCalledTimes(1);
    expect(mockedCaptureError).toHaveBeenCalledWith(err, ctx);

    expect(mockedAddBreadcrumb).toHaveBeenCalledTimes(1);
    expect(mockedAddBreadcrumb).toHaveBeenCalledWith({
      message: 'boom',
      level: 'error',
      data: ctx,
    });
  });

  it("logger.debug et logger.info: addBreadcrumb avec level 'info'", () => {
    debug('debug msg');
    info('info msg', { k: 'v' });
    expect(mockedAddBreadcrumb).toHaveBeenCalledTimes(2);
    expect(mockedAddBreadcrumb).toHaveBeenNthCalledWith(1, {
      message: 'debug msg',
      level: 'info',
      data: undefined,
    });
    expect(mockedAddBreadcrumb).toHaveBeenNthCalledWith(2, {
      message: 'info msg',
      level: 'info',
      data: { k: 'v' },
    });
  });
});
