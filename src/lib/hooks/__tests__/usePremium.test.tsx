/**
 * usePremium — hook React Query qui wrappe isPremiumUser()
 * et expose { isPremium, isLoading } pour les composants UI.
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePremium } from '../usePremium';

jest.mock('../../premium/premium-gate', () => ({
  isPremiumUser: jest.fn(),
}));

import { isPremiumUser } from '../../premium/premium-gate';

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

  it('renvoie isPremium=true quand isPremiumUser résout true', async () => {
    (isPremiumUser as jest.Mock).mockResolvedValue(true);
    const { result } = renderHook(() => usePremium('uid-1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isPremium).toBe(true);
    expect(isPremiumUser).toHaveBeenCalledWith('uid-1');
  });

  it('renvoie isPremium=false sans appel quand userId est null', async () => {
    (isPremiumUser as jest.Mock).mockResolvedValue(true);
    const { result } = renderHook(() => usePremium(null), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isPremium).toBe(false);
    expect(isPremiumUser).not.toHaveBeenCalled();
  });
});
