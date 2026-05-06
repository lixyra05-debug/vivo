/**
 * usePremium — hook React Query qui wrappe getUserTier()
 * et expose { tier, isPremium, isExpert, isLoading, canAccess } pour les composants UI.
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePremium } from '../usePremium';

jest.mock('../../premium/premium-gate', () => {
  const actual = jest.requireActual('../../premium/premium-gate');
  return {
    ...actual,
    getUserTier: jest.fn(),
  };
});

import { getUserTier } from '../../premium/premium-gate';

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('usePremium', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renvoie tier='premium' / isPremium=true / isExpert=false quand getUserTier résout 'premium'", async () => {
    (getUserTier as jest.Mock).mockResolvedValue('premium');
    const { result } = renderHook(() => usePremium('uid-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tier).toBe('premium');
    expect(result.current.isPremium).toBe(true);
    expect(result.current.isExpert).toBe(false);
    expect(result.current.canAccess('store_full_ranking')).toBe(true);
    expect(result.current.canAccess('plant_database')).toBe(false);
    expect(getUserTier).toHaveBeenCalledWith('uid-1');
  });

  it("renvoie tier='free' sans appel quand userId est null", async () => {
    (getUserTier as jest.Mock).mockResolvedValue('expert');
    const { result } = renderHook(() => usePremium(null), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tier).toBe('free');
    expect(result.current.isPremium).toBe(false);
    expect(result.current.isExpert).toBe(false);
    expect(result.current.canAccess('store_full_ranking')).toBe(false);
    expect(getUserTier).not.toHaveBeenCalled();
  });

  it("renvoie tier='expert' / isExpert=true et canAccess passe sur plant_database", async () => {
    (getUserTier as jest.Mock).mockResolvedValue('expert');
    const { result } = renderHook(() => usePremium('uid-expert'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tier).toBe('expert');
    expect(result.current.isPremium).toBe(true);
    expect(result.current.isExpert).toBe(true);
    expect(result.current.canAccess('plant_database')).toBe(true);
    expect(result.current.canAccess('store_full_ranking')).toBe(true);
  });
});
