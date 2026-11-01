/**
 * Lot H — `useScanHistory` lit l'historique en deux temps.
 *
 * La jointure `product:products(*)` exigeait une clé étrangère que la
 * migration 012 a supprimée (PGRST200). L'historique se lit désormais seul,
 * puis la fiche des aliments par code-barres ; un cosmétique n'a pas de ligne
 * dans `products` et garde `product: null`.
 */
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { supabase } from '../../api/supabase';
import { useScanHistory } from '../useProductStore';

jest.mock('../../api/supabase', () => ({ supabase: { from: jest.fn() } }));

const ROWS = [
  { id: 'r1', barcode: '111', product_type: 'food', score_at_scan: 70, scanned_at: '2026-10-30T10:00:00Z' },
  { id: 'r2', barcode: '222', product_type: 'food', score_at_scan: 40, scanned_at: '2026-10-29T10:00:00Z' },
  { id: 'r3', barcode: '333', product_type: 'cosmetic', score_at_scan: 90, scanned_at: '2026-10-28T10:00:00Z' },
];

function mockTables(products: { data: unknown[] | null; error: { message: string } | null }) {
  const historySelect = jest.fn();
  // Chaîne PostgREST simulée : chaque filtre rend la chaîne, `await` la résout.
  const historyChain: Record<string, unknown> = {};
  for (const method of ['eq', 'order', 'limit']) historyChain[method] = jest.fn(() => historyChain);
  historyChain.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve({ data: ROWS, error: null }).then(resolve);
  historySelect.mockReturnValue(historyChain);
  const productsIn = jest.fn(() => Promise.resolve(products));
  const productsSelect = jest.fn(() => ({ in: productsIn }));
  (supabase.from as jest.Mock).mockImplementation((table: string) =>
    table === 'scan_history' ? { select: historySelect } : { select: productsSelect },
  );
  return { historySelect, productsSelect, productsIn };
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useScanHistory — lecture en deux temps (lot H)', () => {
  afterEach(() => jest.clearAllMocks());

  it('lit scan_history sans jointure, puis la fiche des seuls aliments par code-barres', async () => {
    const { historySelect, productsSelect, productsIn } = mockTables({
      data: [{ barcode: '111', name: 'Yaourt nature' }],
      error: null,
    });
    const { result } = renderHook(() => useScanHistory({ userId: 'uid-1', limit: 30 }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Aucune jointure PostgREST : pas de parenthèse dans la sélection.
    expect(historySelect).toHaveBeenCalledWith('*');
    // La fiche complète : l'historique en affiche le nom, la marque et l'image,
    // et son filtre « Incompatibles » en lit les ingrédients.
    expect(productsSelect).toHaveBeenCalledWith('*');
    // Le cosmétique (333) n'a pas de ligne dans products : il n'y est pas cherché.
    expect(productsIn).toHaveBeenCalledWith('barcode', ['111', '222']);
    expect(result.current.data?.map((r) => [r.barcode, r.product?.name ?? null])).toEqual([
      ['111', 'Yaourt nature'],
      ['222', null],
      ['333', null],
    ]);
  });

  it('une lecture de products en erreur fait échouer l’historique, au lieu de le vider en silence', async () => {
    mockTables({ data: null, error: { message: 'boom' } });
    const { result } = renderHook(() => useScanHistory({ userId: 'uid-1' }), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
