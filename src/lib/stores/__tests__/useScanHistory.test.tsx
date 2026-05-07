/**
 * useScanHistory — gating Premium-vs-Free.
 *
 * Le rôle de ce test est de garde-fou le contrat de la fonction `useScanHistory`
 * (extrait de `useProductStore.ts`) :
 *  - quand `limit` est défini → le mock Supabase reçoit `.limit(limit)`
 *  - quand `limit` est `undefined` → `.limit(...)` n'est PAS appelé
 *
 * La gate Free vs Premium se trouve dans l'écran (history.tsx). Ici on valide
 * uniquement que la fonction sait passer (ou pas) le paramètre côté DB.
 */
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { supabase } from '../../api/supabase';
import { useScanHistory } from '../useProductStore';

jest.mock('../../api/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

interface MockChain {
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  eqFavorite: jest.Mock;
}

function buildMockChain(): MockChain {
  // Le terminal de la chaîne (sans .limit) renvoie une thenable resolve.
  const resolved = Promise.resolve({ data: [], error: null });
  const limit = jest.fn().mockReturnValue(resolved);
  const eqFavorite = jest.fn().mockReturnValue({ limit });
  const order = jest.fn().mockReturnValue({ limit, eq: eqFavorite });
  // Faire en sorte que le retour du `.order()` soit également thenable
  // pour le chemin sans `.limit()`.
  Object.assign(order(), {
    then: resolved.then.bind(resolved),
    catch: resolved.catch.bind(resolved),
  });
  // On rebuilde la chaîne pour forcer le retour de `.order()` à être
  // soit un thenable, soit suivi par `.limit()`/`.eq()`.
  const orderThenable = jest.fn().mockReturnValue({
    limit,
    eq: eqFavorite,
    then: resolved.then.bind(resolved),
    catch: resolved.catch.bind(resolved),
  });
  const eq = jest.fn().mockReturnValue({ order: orderThenable });
  const select = jest.fn().mockReturnValue({ eq });

  (supabase.from as jest.Mock).mockReturnValue({ select });

  return { select, eq, order: orderThenable, limit, eqFavorite };
}

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useScanHistory limit gating', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('appelle .limit(30) si limit=30, et NE l\'appelle PAS si limit=undefined', async () => {
    // Cas 1 : limit=30 → .limit(30) doit être appelé
    const chain1 = buildMockChain();
    const { result: r1 } = renderHook(
      () => useScanHistory({ userId: 'uid-1', limit: 30 }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(r1.current.isLoading).toBe(false));

    expect(chain1.select).toHaveBeenCalled();
    expect(chain1.eq).toHaveBeenCalledWith('user_id', 'uid-1');
    expect(chain1.order).toHaveBeenCalledWith('scanned_at', { ascending: false });
    expect(chain1.limit).toHaveBeenCalledWith(30);

    // Cas 2 : limit=undefined → .limit(…) NE doit PAS être appelé
    jest.clearAllMocks();
    const chain2 = buildMockChain();
    const { result: r2 } = renderHook(
      () => useScanHistory({ userId: 'uid-2' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(r2.current.isLoading).toBe(false));

    expect(chain2.select).toHaveBeenCalled();
    expect(chain2.eq).toHaveBeenCalledWith('user_id', 'uid-2');
    expect(chain2.limit).not.toHaveBeenCalled();
  });
});
