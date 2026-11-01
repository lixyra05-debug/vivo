/**
 * Lot H — `fetchCachedProducts` : la fiche des produits du cache, lue par
 * code-barres, sans jointure PostgREST.
 */
import { supabase } from '../supabase';
import { fetchCachedProducts, PRODUCT_LOOKUP_CHUNK } from '../openfoodfacts';

jest.mock('../supabase', () => ({ supabase: { from: jest.fn() } }));

type Response = { data: Array<{ barcode: string; name: string }> | null; error: { message: string } | null };

/** Chaîne `from('products').select(cols).in('barcode', lot)` ; une réponse par lot. */
function mockProducts(respond: (lot: string[]) => Response) {
  const select = jest.fn();
  const inFilter = jest.fn((_column: string, lot: string[]) => Promise.resolve(respond(lot)));
  select.mockReturnValue({ in: inFilter });
  (supabase.from as jest.Mock).mockReturnValue({ select });
  return { select, inFilter };
}

describe('fetchCachedProducts (lot H)', () => {
  afterEach(() => jest.clearAllMocks());

  it('indexe les fiches du cache par code-barres', async () => {
    mockProducts((lot) => ({ data: lot.map((b) => ({ barcode: b, name: `P${b}` })), error: null }));
    const map = await fetchCachedProducts<{ barcode: string; name: string }>(['111', '222'], 'barcode, name');
    expect(supabase.from).toHaveBeenCalledWith('products');
    expect([...map.entries()]).toEqual([
      ['111', { barcode: '111', name: 'P111' }],
      ['222', { barcode: '222', name: 'P222' }],
    ]);
  });

  it('lit par lots de 100 codes, sans doublon', async () => {
    const { select, inFilter } = mockProducts(() => ({ data: [], error: null }));
    const codes = Array.from({ length: 250 }, (_, i) => String(1000 + i));
    await fetchCachedProducts([...codes, ...codes.slice(0, 40)], '*');
    expect(PRODUCT_LOOKUP_CHUNK).toBe(100);
    expect(inFilter.mock.calls.map(([column, lot]) => [column, lot.length])).toEqual([
      ['barcode', 100],
      ['barcode', 100],
      ['barcode', 50],
    ]);
    expect(select).toHaveBeenCalledWith('*');
  });

  it('aucun code : aucune requête', async () => {
    mockProducts(() => ({ data: [], error: null }));
    const map = await fetchCachedProducts([], '*');
    expect(map.size).toBe(0);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('un lot en erreur fait échouer la lecture : jamais un résultat partiel muet', async () => {
    mockProducts((lot) =>
      lot[0] === '1100'
        ? { data: null, error: { message: 'boom' } }
        : { data: lot.map((b) => ({ barcode: b, name: b })), error: null },
    );
    const codes = Array.from({ length: 150 }, (_, i) => String(1000 + i));
    await expect(fetchCachedProducts(codes, '*')).rejects.toEqual({ message: 'boom' });
  });
});
