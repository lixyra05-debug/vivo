/**
 * Tests pour le wrapper Sentry de Vivo (R8 strict PII).
 *
 * Couvre :
 *  - graceful degradation quand DSN absent
 *  - captureError n'envoie qu'en prod (!__DEV__)
 *  - beforeSend strip email / ip_address / username
 *  - beforeBreadcrumb drop barcode + nav vers écrans sensibles
 */

import * as Sentry from '@sentry/react-native';

type SentryEvent = {
  user?: {
    id?: string;
    email?: string;
    ip_address?: string;
    username?: string;
  };
  message?: string;
  request?: { url?: string };
};

type SentryBreadcrumb = {
  message?: string;
  category?: string;
  data?: Record<string, unknown>;
};

type BeforeSend = (event: SentryEvent, hint?: unknown) => SentryEvent | null;
type BeforeBreadcrumb = (
  breadcrumb: SentryBreadcrumb,
  hint?: unknown,
) => SentryBreadcrumb | null;

const ORIGINAL_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

function loadSentryModule(): typeof import('../sentry') {
  let mod: typeof import('../sentry') | undefined;
  jest.isolateModules(() => {
    mod = require('../sentry') as typeof import('../sentry');
  });
  if (!mod) throw new Error('Failed to load sentry module');
  return mod;
}

describe('initSentry', () => {
  beforeEach(() => {
    (Sentry.init as jest.Mock).mockClear();
  });

  afterEach(() => {
    if (ORIGINAL_DSN === undefined) {
      delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    } else {
      process.env.EXPO_PUBLIC_SENTRY_DSN = ORIGINAL_DSN;
    }
  });

  it('bails silently when EXPO_PUBLIC_SENTRY_DSN is empty/undefined', () => {
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    const { initSentry } = loadSentryModule();
    initSentry();
    expect(Sentry.init).not.toHaveBeenCalled();

    process.env.EXPO_PUBLIC_SENTRY_DSN = '';
    const reloaded = loadSentryModule();
    reloaded.initSentry();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('beforeSend: strips email / ip_address / username from event.user, keeps id', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://fake@sentry.io/1';
    const { initSentry } = loadSentryModule();
    initSentry();
    expect(Sentry.init).toHaveBeenCalledTimes(1);

    const initOptions = (Sentry.init as jest.Mock).mock.calls[0][0] as {
      beforeSend: BeforeSend;
    };
    const beforeSend = initOptions.beforeSend;

    const cleaned = beforeSend({
      user: {
        id: 'uuid-anon-123',
        email: 'foo@example.com',
        ip_address: '1.2.3.4',
        username: 'foo',
      },
    });

    expect(cleaned).not.toBeNull();
    expect(cleaned?.user?.id).toBe('uuid-anon-123');
    expect(cleaned?.user?.email).toBeUndefined();
    expect(cleaned?.user?.ip_address).toBeUndefined();
    expect(cleaned?.user?.username).toBeUndefined();
  });

  it('beforeSend: drops events whose request.url or message contains "barcode"', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://fake@sentry.io/1';
    const { initSentry } = loadSentryModule();
    initSentry();

    const initOptions = (Sentry.init as jest.Mock).mock.calls[0][0] as {
      beforeSend: BeforeSend;
    };
    const beforeSend = initOptions.beforeSend;

    const droppedByUrl = beforeSend({
      request: { url: 'https://fr.openfoodfacts.org/api/v2/product/barcode/3017620422003' },
    });
    expect(droppedByUrl).toBeNull();

    const droppedByMessage = beforeSend({ message: 'failed to read barcode' });
    expect(droppedByMessage).toBeNull();

    const kept = beforeSend({ message: 'unrelated error' });
    expect(kept).not.toBeNull();
  });

  it('beforeBreadcrumb: drops navigation breadcrumbs to /health-profile, /auth, /onboarding AND any breadcrumb whose data.url or message contains "barcode"', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://fake@sentry.io/1';
    const { initSentry } = loadSentryModule();
    initSentry();

    const initOptions = (Sentry.init as jest.Mock).mock.calls[0][0] as {
      beforeBreadcrumb: BeforeBreadcrumb;
    };
    const beforeBreadcrumb = initOptions.beforeBreadcrumb;

    // Navigation sensible
    expect(
      beforeBreadcrumb({
        category: 'navigation',
        data: { from: '/(tabs)/scan', to: '/health-profile' },
      }),
    ).toBeNull();
    expect(
      beforeBreadcrumb({
        category: 'navigation',
        data: { from: '/landing', to: '/auth/login' },
      }),
    ).toBeNull();
    expect(
      beforeBreadcrumb({
        category: 'navigation',
        data: { from: '/auth/login', to: '/onboarding/step-1' },
      }),
    ).toBeNull();

    // Barcode (URL)
    expect(
      beforeBreadcrumb({
        category: 'http',
        data: { url: 'https://fr.openfoodfacts.org/api/v2/product/barcode/3017620422003' },
      }),
    ).toBeNull();

    // Barcode (message)
    expect(
      beforeBreadcrumb({
        message: 'reading barcode 3017620422003',
        category: 'console',
      }),
    ).toBeNull();

    // Navigation safe → conservée
    const kept = beforeBreadcrumb({
      category: 'navigation',
      data: { from: '/(tabs)/explore', to: '/(tabs)/profile' },
    });
    expect(kept).not.toBeNull();
  });
});

describe('captureError', () => {
  beforeEach(() => {
    (Sentry.captureException as jest.Mock).mockClear();
  });

  it('only forwards when __DEV__ is false', () => {
    const { captureError } = loadSentryModule();
    const err = new Error('boom');
    const ctx = { foo: 'bar' };

    // En dev → pas d'envoi
    (global as unknown as { __DEV__: boolean }).__DEV__ = true;
    captureError(err, ctx);
    expect(Sentry.captureException).not.toHaveBeenCalled();

    // En prod → forward avec extra
    (global as unknown as { __DEV__: boolean }).__DEV__ = false;
    captureError(err, ctx);
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(err, { extra: ctx });

    // Cleanup
    (global as unknown as { __DEV__: boolean }).__DEV__ = true;
  });
});
