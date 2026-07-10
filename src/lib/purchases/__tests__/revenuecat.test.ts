/**
 * revenuecat wrapper — mock complet de react-native-purchases via factory inline.
 *
 * Le guard Jest (JEST_WORKER_ID) rend les achats indisponibles par défaut :
 * chaque test force la disponibilité via le seam __setPurchasesAvailableForTests.
 * Le cas "module indisponible" simule un require qui throw via un getter.
 */

import {
  __setPurchasesAvailableForTests,
  getTierFromPurchases,
  purchaseVivoTier,
  restoreVivoPurchases,
} from '../revenuecat';

const mockConfigure = jest.fn();
const mockLogIn = jest.fn();
const mockLogOut = jest.fn();
const mockGetCustomerInfo = jest.fn();
const mockGetOfferings = jest.fn();
const mockPurchasePackage = jest.fn();
const mockRestorePurchases = jest.fn();
let mockModuleUnavailable = false;

jest.mock('react-native-purchases', () => ({
  get default() {
    if (mockModuleUnavailable) {
      throw new Error('Native module RNPurchases not found');
    }
    return {
      configure: mockConfigure,
      logIn: mockLogIn,
      logOut: mockLogOut,
      getCustomerInfo: mockGetCustomerInfo,
      getOfferings: mockGetOfferings,
      purchasePackage: mockPurchasePackage,
      restorePurchases: mockRestorePurchases,
    };
  },
}));

const mockGetSession = jest.fn();
const mockMaybeSingle = jest.fn();
const mockUpsert = jest.fn();
const mockFrom = jest.fn();

jest.mock('../../api/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

function customerInfoWith(activeKeys: string[]) {
  const active: Record<string, { identifier: string; isActive: boolean }> = {};
  for (const key of activeKeys) {
    active[key] = { identifier: key, isActive: true };
  }
  return { entitlements: { active, all: active } };
}

function setupSupabase(row: { plan: string; status: string } | null) {
  mockGetSession.mockResolvedValue({
    data: { session: { user: { id: 'uid-test' } } },
  });
  mockMaybeSingle.mockResolvedValue({ data: row, error: null });
  mockUpsert.mockResolvedValue({ data: null, error: null });
  mockFrom.mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          maybeSingle: () => mockMaybeSingle(),
        }),
      }),
    }),
    upsert: (...args: unknown[]) => mockUpsert(...args),
  });
}

const premiumPackage = {
  identifier: 'premium_yearly',
  product: { identifier: 'vivo_premium_yearly', priceString: '29,99 €' },
};
const expertPackage = {
  identifier: 'expert_yearly',
  product: { identifier: 'vivo_expert_yearly', priceString: '49,99 €' },
};

function setupOfferings() {
  mockGetOfferings.mockResolvedValue({
    current: { availablePackages: [premiumPackage, expertPackage] },
  });
}

describe('revenuecat wrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockModuleUnavailable = false;
    __setPurchasesAvailableForTests(true);
  });

  afterAll(() => {
    __setPurchasesAvailableForTests(null);
  });

  it("Test 1 — getTierFromPurchases → 'expert' si entitlement expert actif", async () => {
    mockGetCustomerInfo.mockResolvedValue(
      customerInfoWith(['expert', 'premium']),
    );
    await expect(getTierFromPurchases()).resolves.toBe('expert');
  });

  it("Test 2 — getTierFromPurchases → 'premium' si seul premium est actif", async () => {
    mockGetCustomerInfo.mockResolvedValue(customerInfoWith(['premium']));
    await expect(getTierFromPurchases()).resolves.toBe('premium');
  });

  it("Test 3 — getTierFromPurchases → 'free' si aucun entitlement actif", async () => {
    mockGetCustomerInfo.mockResolvedValue(customerInfoWith([]));
    await expect(getTierFromPurchases()).resolves.toBe('free');
  });

  it('Test 4 — getTierFromPurchases → null si le module est indisponible (require throw)', async () => {
    mockModuleUnavailable = true;
    await expect(getTierFromPurchases()).resolves.toBeNull();
    expect(mockGetCustomerInfo).not.toHaveBeenCalled();
  });

  it("Test 5 — purchaseVivoTier annulé par l'utilisateur → cancelled:true, aucune erreur, pas de sync (R6/R7)", async () => {
    setupSupabase(null);
    setupOfferings();
    mockPurchasePackage.mockRejectedValue(
      Object.assign(new Error('Purchase was cancelled.'), {
        userCancelled: true,
      }),
    );

    const result = await purchaseVivoTier('premium');

    expect(result).toEqual({ success: false, newTier: null, cancelled: true });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("Test 6 — restoreVivoPurchases avec entitlement actif → { restored: true, tier: 'premium' }", async () => {
    setupSupabase(null);
    mockRestorePurchases.mockResolvedValue(customerInfoWith(['premium']));

    const result = await restoreVivoPurchases();

    expect(result).toEqual({ restored: true, tier: 'premium' });
  });

  it('Test 7 — syncTierToSupabase (upsert miroir) appelé après un achat réussi', async () => {
    setupSupabase(null);
    setupOfferings();
    mockPurchasePackage.mockResolvedValue({
      productIdentifier: 'vivo_premium_yearly',
      customerInfo: customerInfoWith(['premium']),
    });

    const result = await purchaseVivoTier('premium');

    expect(result).toEqual({
      success: true,
      newTier: 'premium',
      cancelled: false,
    });
    expect(mockPurchasePackage).toHaveBeenCalledWith(premiumPackage);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'uid-test',
        plan: 'premium',
        status: 'active',
      }),
      { onConflict: 'user_id' },
    );
  });
});
