/**
 * Tests conglomerate — résolution maison-mère via Wikidata REST + SPARQL.
 *
 * Mocke `global.fetch` per-call : 1er appel = wbsearchentities, 2e = SPARQL.
 * Cache vidé en beforeEach via __resetConglomerateCacheForTests.
 */

import {
  countryCodeToFlag,
  getConglomerateOwner,
  __resetConglomerateCacheForTests,
} from '../conglomerate';

function jsonResponse(payload: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    headers: new Headers(),
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as unknown as Response;
}

describe('countryCodeToFlag', () => {
  it('convertit ISO alpha-3 FRA → 🇫🇷', () => {
    expect(countryCodeToFlag('FRA')).toBe('🇫🇷');
  });

  it('convertit ISO alpha-3 USA → 🇺🇸', () => {
    expect(countryCodeToFlag('USA')).toBe('🇺🇸');
  });

  it('convertit ISO alpha-2 JP → 🇯🇵', () => {
    expect(countryCodeToFlag('JP')).toBe('🇯🇵');
  });

  it('renvoie chaîne vide pour code invalide ou null', () => {
    expect(countryCodeToFlag(null)).toBe('');
    expect(countryCodeToFlag(undefined)).toBe('');
    expect(countryCodeToFlag('')).toBe('');
    expect(countryCodeToFlag('XYZ')).toBe('');
    expect(countryCodeToFlag('1234')).toBe('');
  });
});

describe('getConglomerateOwner', () => {
  let fetchMock: jest.Mock;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    __resetConglomerateCacheForTests();
    originalFetch = global.fetch;
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('résout Nutella → Ferrero (Italie)', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          search: [{ id: 'Q212193', label: 'Nutella' }],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          results: {
            bindings: [
              {
                owner: { value: 'http://www.wikidata.org/entity/Q170480' },
                ownerLabel: { value: 'Ferrero' },
                country: { value: 'http://www.wikidata.org/entity/Q38' },
                countryLabel: { value: 'Italie' },
                iso3: { value: 'ITA' },
              },
            ],
          },
        }),
      );

    const result = await getConglomerateOwner('Nutella');

    expect(result).not.toBeNull();
    expect(result?.ownerName).toBe('Ferrero');
    expect(result?.ownerWikidataId).toBe('Q170480');
    expect(result?.countryCode).toBe('ITA');
    expect(result?.countryName).toBe('Italie');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('renvoie null quand wbsearchentities ne trouve aucun résultat', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ search: [] }));

    const result = await getConglomerateOwner('NonExistentBrand12345');

    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1); // pas de SPARQL
  });

  it('renvoie null quand SPARQL ne trouve aucun owner (P127/P749 absent)', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ search: [{ id: 'Q123456' }] }))
      .mockResolvedValueOnce(jsonResponse({ results: { bindings: [] } }));

    const result = await getConglomerateOwner('UnownedBrand');

    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('cache un résultat positif : 2e appel ne déclenche pas fetch', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ search: [{ id: 'Q212193' }] }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          results: {
            bindings: [
              {
                owner: { value: 'http://www.wikidata.org/entity/Q170480' },
                ownerLabel: { value: 'Ferrero' },
                iso3: { value: 'ITA' },
                countryLabel: { value: 'Italie' },
              },
            ],
          },
        }),
      );

    const first = await getConglomerateOwner('Nutella');
    const second = await getConglomerateOwner('Nutella');

    expect(first).toEqual(second);
    expect(fetchMock).toHaveBeenCalledTimes(2); // pas 4
  });

  it('cache un résultat négatif (brand introuvable)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ search: [] }));

    const first = await getConglomerateOwner('UnknownX');
    const second = await getConglomerateOwner('UnknownX');

    expect(first).toBeNull();
    expect(second).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("ne cache PAS les erreurs réseau (autorise un retry au prochain appel)", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce(jsonResponse({ search: [{ id: 'Q1' }] }))
      .mockResolvedValueOnce(
        jsonResponse({
          results: {
            bindings: [
              {
                owner: { value: 'http://www.wikidata.org/entity/Q42' },
                ownerLabel: { value: 'TestOwner' },
              },
            ],
          },
        }),
      );

    const first = await getConglomerateOwner('Brand');
    expect(first).toBeNull();

    const second = await getConglomerateOwner('Brand');
    expect(second).not.toBeNull();
    expect(second?.ownerName).toBe('TestOwner');
  });

  it('renvoie null pour un nom vide ou whitespace', async () => {
    expect(await getConglomerateOwner('')).toBeNull();
    expect(await getConglomerateOwner('   ')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('coerce countryCode invalide à null mais conserve ownerName', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ search: [{ id: 'Q1' }] }))
      .mockResolvedValueOnce(
        jsonResponse({
          results: {
            bindings: [
              {
                owner: { value: 'http://www.wikidata.org/entity/Q42' },
                ownerLabel: { value: 'TestOwner' },
                iso3: { value: 'INVALID_CODE' },
              },
            ],
          },
        }),
      );

    const result = await getConglomerateOwner('Brand');
    expect(result?.ownerName).toBe('TestOwner');
    expect(result?.countryCode).toBeNull();
  });

  it("renvoie null si HTTP non-ok sur le SPARQL", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ search: [{ id: 'Q1' }] }))
      .mockResolvedValueOnce(jsonResponse({}, false, 503));

    const result = await getConglomerateOwner('Brand');
    expect(result).toBeNull();
  });
});
