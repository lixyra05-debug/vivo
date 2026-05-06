/**
 * usePremium() — hook React qui détermine si l'utilisateur courant est Premium.
 * Lit la session via useAuthStore + interroge la table `subscriptions`.
 * Le flag __DEV_UNLOCK_PREMIUM__ peut court-circuiter le check (QA local).
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mockMaybeSingle = jest.fn();

jest.mock('../../api/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: () => mockMaybeSingle(),
        }),
      }),
    }),
  },
}));

const mockSelector = jest.fn();
jest.mock('../../stores/useAuthStore', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) => selector(mockSelector()),
}));

import { usePremium, __DEV_UNLOCK_PREMIUM__ } from '../premium-gate';

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

function setSession(userId: string | null) {
  mockSelector.mockReturnValue({
    session: userId ? { user: { id: userId } } : null,
  });
}

describe('usePremium()', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Test 1 — __DEV_UNLOCK_PREMIUM__ exposé à false par défaut (jamais commit à true)', () => {
    expect(__DEV_UNLOCK_PREMIUM__).toBe(false);
  });

  it('Test 2 — pas de session : isPremium=false sans appel Supabase', async () => {
    setSession(null);
    const { result } = renderHook(() => usePremium(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isPremium).toBe(false);
    expect(mockMaybeSingle).not.toHaveBeenCalled();
  });

  it("Test 3 — session + plan='premium' status='active' : isPremium=true", async () => {
    setSession('uid-3');
    mockMaybeSingle.mockResolvedValue({
      data: { plan: 'premium', status: 'active' },
      error: null,
    });
    const { result } = renderHook(() => usePremium(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isPremium).toBe(true);
  });

  it("Test 4 — session + plan='premium' status='trialing' : isPremium=true", async () => {
    setSession('uid-4');
    mockMaybeSingle.mockResolvedValue({
      data: { plan: 'premium', status: 'trialing' },
      error: null,
    });
    const { result } = renderHook(() => usePremium(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isPremium).toBe(true);
  });

  it("Test 5 — session + plan='premium' status='expired' : isPremium=false", async () => {
    setSession('uid-5');
    mockMaybeSingle.mockResolvedValue({
      data: { plan: 'premium', status: 'expired' },
      error: null,
    });
    const { result } = renderHook(() => usePremium(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isPremium).toBe(false);
  });

  it("Test 6 — session + plan='free' status='active' : isPremium=false", async () => {
    setSession('uid-6');
    mockMaybeSingle.mockResolvedValue({
      data: { plan: 'free', status: 'active' },
      error: null,
    });
    const { result } = renderHook(() => usePremium(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isPremium).toBe(false);
  });

  it('Test 7 — session sans sub (null) : isPremium=false', async () => {
    setSession('uid-7');
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => usePremium(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isPremium).toBe(false);
    expect(result.current.tier).toBe('free');
    expect(result.current.isExpert).toBe(false);
  });

  it("Test 8 — session + plan='expert' status='active' : tier='expert', isExpert=true, canAccess('plant_database')=true", async () => {
    setSession('uid-8');
    mockMaybeSingle.mockResolvedValue({
      data: { plan: 'expert', status: 'active' },
      error: null,
    });
    const { result } = renderHook(() => usePremium(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tier).toBe('expert');
    expect(result.current.isPremium).toBe(true);
    expect(result.current.isExpert).toBe(true);
    expect(result.current.canAccess('plant_database')).toBe(true);
    expect(result.current.canAccess('store_full_ranking')).toBe(true);
  });
});
