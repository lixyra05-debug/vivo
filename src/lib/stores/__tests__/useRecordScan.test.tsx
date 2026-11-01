/**
 * Lot H — un enregistrement de scan refusé n'est plus silencieux.
 *
 * L'insertion dans `scan_history` pouvait échouer (RLS, contrainte, réseau)
 * sans laisser aucune trace : `mutate` était appelé sans `onError`. Désormais
 * l'échec est journalisé (Sentry hors dev), sans le code-barres ni le message de
 * la base. Aucun nouvel essai : l'insertion n'est pas idempotente, un second
 * essai après une réponse perdue doublerait le scan.
 */
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { supabase } from '../../api/supabase';
import { error as logError } from '../../utils/logger';
import { useRecordScan } from '../useProductStore';

jest.mock('../../api/supabase', () => ({ supabase: { from: jest.fn() } }));
jest.mock('../../utils/logger', () => ({ error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() }));

const SCAN = { barcode: '3017620422003', score: 42, profile: 'standard', penalties: [] };

function mockInsert(...outcomes: Array<'ok' | 'network' | { code: string; message: string; details?: string }>) {
  const insert = jest.fn();
  for (const outcome of outcomes) {
    if (outcome === 'ok') insert.mockReturnValueOnce(Promise.resolve({ error: null }));
    // postgrest-js ne lève pas une panne réseau : il la rend en erreur à `code` vide.
    else if (outcome === 'network')
      insert.mockReturnValueOnce(Promise.resolve({ error: { code: '', message: 'TypeError: Failed to fetch' } }));
    else insert.mockReturnValueOnce(Promise.resolve({ error: outcome }));
  }
  (supabase.from as jest.Mock).mockReturnValue({ insert });
  return insert;
}

function wrapper({ children }: { children: ReactNode }) {
  // Un client qui retenterait toute mutation : l'option du hook doit primer.
  const client = new QueryClient({ defaultOptions: { mutations: { retry: 3, retryDelay: 0 } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useRecordScan — un refus laisse une trace (lot H)', () => {
  afterEach(() => jest.clearAllMocks());

  it('refus de la base : journalisé une fois, sans code-barres, sans nouvel essai', async () => {
    const insert = mockInsert({
      code: '23503',
      message: 'insert or update on table "scan_history" violates foreign key constraint "scan_history_barcode_fkey"',
      details: 'Key (barcode)=(3017620422003) is not present in table "products".',
    });
    const { result } = renderHook(() => useRecordScan('uid-1'), { wrapper });
    result.current.mutate(SCAN);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(insert).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledTimes(1);
    const [err, context] = (logError as jest.Mock).mock.calls[0];
    expect((err as Error).message).toBe('Enregistrement du scan refusé');
    expect(context).toEqual({ code: '23503', productType: 'food' });
    expect(JSON.stringify([String(err), context])).not.toMatch(/barcode|3017620422003/);
  });

  it('erreur sans code (panne réseau) : journalisée « sans_code », sans nouvel essai', async () => {
    const insert = mockInsert('network', 'ok');
    const { result } = renderHook(() => useRecordScan('uid-1'), { wrapper });
    result.current.mutate({ ...SCAN, productType: 'cosmetic' });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(insert).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledTimes(1);
    expect((logError as jest.Mock).mock.calls[0][1]).toEqual({ code: 'sans_code', productType: 'cosmetic' });
  });

  it('insertion réussie : rien n’est journalisé', async () => {
    const insert = mockInsert('ok');
    const { result } = renderHook(() => useRecordScan('uid-1'), { wrapper });
    result.current.mutate(SCAN);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(insert).toHaveBeenCalledTimes(1);
    expect(logError).not.toHaveBeenCalled();
  });
});
