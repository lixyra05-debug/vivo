/**
 * Lot H — `useMonthlyRecap` lit ses scans sans jointure : les noms et marques
 * viennent d'une seconde lecture de `products`, par code-barres.
 */
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { supabase } from '@/src/lib/api/supabase';
import { useMonthlyRecap } from '../use-monthly-recap';

jest.mock('@/src/lib/api/supabase', () => ({ supabase: { from: jest.fn() } }));

const ROWS = [
  { barcode: '111', score_at_scan: 80, scanned_at: '2026-09-10T10:00:00Z', product_type: 'food', is_favorite: false },
  { barcode: '222', score_at_scan: 20, scanned_at: '2026-09-12T10:00:00Z', product_type: 'food', is_favorite: false },
  { barcode: '333', score_at_scan: 60, scanned_at: '2026-09-14T10:00:00Z', product_type: 'cosmetic', is_favorite: false },
];

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useMonthlyRecap — lecture en deux temps (lot H)', () => {
  it('lit les scans sans jointure, puis les noms des aliments par code-barres', async () => {
    const historySelect = jest.fn();
    const chain: Record<string, unknown> = {};
    chain.eq = jest.fn(() => chain);
    chain.gte = jest.fn(() => chain);
    chain.lt = jest.fn(() => Promise.resolve({ data: ROWS, error: null }));
    historySelect.mockReturnValue(chain);
    const productsIn = jest.fn(() =>
      Promise.resolve({
        data: [
          { barcode: '111', name: 'Pain complet', brand: 'Fournil' },
          { barcode: '222', name: 'Soda', brand: 'Bulles' },
        ],
        error: null,
      }),
    );
    const productsSelect = jest.fn(() => ({ in: productsIn }));
    (supabase.from as jest.Mock).mockImplementation((table: string) =>
      table === 'scan_history' ? { select: historySelect } : { select: productsSelect },
    );

    const { result } = renderHook(() => useMonthlyRecap('uid-1', 2026, 8), { wrapper });
    await waitFor(() => expect(result.current.recap).not.toBeNull());

    expect(String(historySelect.mock.calls[0][0])).not.toContain('(');
    expect(productsSelect).toHaveBeenCalledWith('barcode, name, brand');
    expect(productsIn).toHaveBeenCalledWith('barcode', ['111', '222']);
    expect(result.current.recap?.totalScans).toBe(3);
    expect(result.current.recap?.worstProduct?.name).toBe('Soda');
    expect(result.current.recap?.bestProduct?.name).toBe('Pain complet');
  });
});
