/**
 * fetchWithTimeout — wrapper réseau résilient (timeout, retry exponentiel,
 * gestion 429 Retry-After, AbortSignal externe). Sprint 2.
 */

import { fetchWithTimeout, FetchTimeoutError } from '../fetch-with-timeout';

describe('fetchWithTimeout', () => {
  let fetchMock: jest.Mock;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('1. timeout 100ms : si fetch ne resolve jamais → throw FetchTimeoutError', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }),
    );

    const promise = fetchWithTimeout('https://example.com', {
      timeoutMs: 100,
      retries: 0,
    });

    const assertion = expect(promise).rejects.toBeInstanceOf(FetchTimeoutError);

    await jest.advanceTimersByTimeAsync(150);
    await assertion;
  });

  it('2. retry 2x puis échoue : 3 tentatives au total, attempts=3', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(() => Promise.reject(new Error('network down')));

    const promise = fetchWithTimeout('https://example.com', {
      timeoutMs: 1000,
      retries: 2,
      backoffMs: 10,
    }).catch((err) => err);

    // Avancer assez pour couvrir les 2 backoffs (10ms + 20ms)
    await jest.advanceTimersByTimeAsync(100);
    const err = await promise;
    expect(err).toBeInstanceOf(FetchTimeoutError);
    expect((err as FetchTimeoutError).attempts).toBe(3);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('3. 429 + Retry-After : attend puis retry → succès au 2ème appel', async () => {
    jest.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce(
        new Response('rate limited', {
          status: 429,
          headers: { 'Retry-After': '1' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: 1 }), { status: 200 }),
      );

    const promise = fetchWithTimeout('https://example.com', {
      timeoutMs: 1000,
      retries: 2,
      backoffMs: 10,
    });

    // Le retry-after vaut 1s
    await jest.advanceTimersByTimeAsync(1500);
    const res = await promise;
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('4. réponse 200 : retourne directement, fetch appelé 1 fois', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: 1 }), { status: 200 }),
    );
    const res = await fetchWithTimeout('https://example.com', {
      timeoutMs: 1000,
      retries: 2,
    });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('5. réponse 500 puis 200 : retry sur 5xx, succès au 2ème appel', async () => {
    jest.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce(new Response('boom', { status: 500 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: 1 }), { status: 200 }),
      );

    const promise = fetchWithTimeout('https://example.com', {
      timeoutMs: 1000,
      retries: 2,
      backoffMs: 10,
    });
    await jest.advanceTimersByTimeAsync(50);
    const res = await promise;
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("6. AbortSignal externe : l'abort externe annule la requête en cours", async () => {
    const externalController = new AbortController();
    let internalSignal: AbortSignal | undefined;

    fetchMock.mockImplementation((_url: string, init?: RequestInit) => {
      internalSignal = init?.signal ?? undefined;
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    });

    const promise = fetchWithTimeout('https://example.com', {
      timeoutMs: 5000,
      retries: 0,
      signal: externalController.signal,
    }).catch((err) => err);

    // Abort externe immédiatement
    externalController.abort();

    const err = await promise;
    expect(err).toBeInstanceOf(FetchTimeoutError);
    expect(internalSignal?.aborted).toBe(true);
  });

  it('7. backoff exponentiel : 100ms puis 200ms entre les tentatives', async () => {
    jest.useFakeTimers();
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    fetchMock.mockImplementation(() => Promise.reject(new Error('fail')));

    const promise = fetchWithTimeout('https://example.com', {
      timeoutMs: 5000,
      retries: 2,
      backoffMs: 100,
    }).catch((err) => err);

    await jest.advanceTimersByTimeAsync(1000);
    await promise;

    // Récupérer les délais passés à setTimeout (hors timeoutMs et autres)
    // backoff calls : 100 puis 200
    const delays = setTimeoutSpy.mock.calls.map((c) => c[1]);
    expect(delays).toEqual(expect.arrayContaining([100, 200]));
    setTimeoutSpy.mockRestore();
  });
});
