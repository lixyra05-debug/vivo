/**
 * Premium gate — détermine l'accès aux 3 fonctionnalités premium :
 *   • store_full_ranking   — classement complet des supermarchés
 *   • store_comparison     — top produits par enseigne sans coupure
 *   • smart_alternatives   — alternatives intelligentes au scan
 *
 * Source de vérité = table `subscriptions` (D1 validée).
 * Trialing compte comme premium (D2 validée).
 */

import {
  isPremiumUser,
  canAccessFeature,
  getFeatureLimit,
  PREMIUM_FEATURES,
  type PremiumFeatureKey,
} from '../premium-gate';
import { supabase } from '../../api/supabase';

jest.mock('../../api/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

function mockSubscriptionRow(row: { plan: string; status: string } | null) {
  const maybeSingle = jest.fn().mockResolvedValue({ data: row, error: null });
  const limit = jest.fn().mockReturnValue({ maybeSingle });
  const inFn = jest.fn().mockReturnValue({ limit });
  const eqStatus = jest.fn().mockReturnValue({ in: inFn });
  const eqPlan = jest.fn().mockReturnValue({ in: inFn });
  const eqUser = jest.fn().mockReturnValue({ eq: eqPlan, in: inFn });
  const select = jest.fn().mockReturnValue({ eq: eqUser });
  (supabase.from as jest.Mock).mockReturnValue({ select });
  return { select, eqUser, eqPlan, eqStatus, inFn, limit, maybeSingle };
}

describe('premium-gate', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isPremiumUser', () => {
    it('renvoie true pour plan=premium / status=active', async () => {
      mockSubscriptionRow({ plan: 'premium', status: 'active' });
      const res = await isPremiumUser('uid-1');
      expect(res).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
    });

    it('renvoie true pour status=trialing (D2)', async () => {
      mockSubscriptionRow({ plan: 'premium', status: 'trialing' });
      const res = await isPremiumUser('uid-2');
      expect(res).toBe(true);
    });

    it('renvoie false si aucune ligne (utilisateur free)', async () => {
      mockSubscriptionRow(null);
      const res = await isPremiumUser('uid-3');
      expect(res).toBe(false);
    });

    it('renvoie false si erreur Supabase, sans throw', async () => {
      const maybeSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'boom' } });
      const limit = jest.fn().mockReturnValue({ maybeSingle });
      const inFn = jest.fn().mockReturnValue({ limit });
      const eqPlan = jest.fn().mockReturnValue({ in: inFn });
      const eqUser = jest.fn().mockReturnValue({ eq: eqPlan });
      const select = jest.fn().mockReturnValue({ eq: eqUser });
      (supabase.from as jest.Mock).mockReturnValue({ select });

      const res = await isPremiumUser('uid-err');
      expect(res).toBe(false);
    });

    it('renvoie false pour userId null sans appeler Supabase', async () => {
      const res = await isPremiumUser(null);
      expect(res).toBe(false);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('renvoie false pour userId undefined sans appeler Supabase', async () => {
      const res = await isPremiumUser(undefined);
      expect(res).toBe(false);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('PREMIUM_FEATURES catalogue', () => {
    it('expose les 3 clés attendues', () => {
      const keys = Object.keys(PREMIUM_FEATURES) as PremiumFeatureKey[];
      expect(keys).toEqual(
        expect.arrayContaining([
          'store_full_ranking',
          'store_comparison',
          'smart_alternatives',
        ]),
      );
      expect(keys).toHaveLength(3);
    });

    it('chaque feature a un labelFr non vide', () => {
      for (const key of Object.keys(PREMIUM_FEATURES) as PremiumFeatureKey[]) {
        const def = PREMIUM_FEATURES[key];
        expect(typeof def.labelFr).toBe('string');
        expect(def.labelFr.length).toBeGreaterThan(0);
      }
    });
  });

  describe('canAccessFeature', () => {
    it('utilisateur premium accède à toutes les features', () => {
      expect(canAccessFeature(true, 'store_full_ranking')).toBe(true);
      expect(canAccessFeature(true, 'store_comparison')).toBe(true);
      expect(canAccessFeature(true, 'smart_alternatives')).toBe(true);
    });

    it('utilisateur free n\'accède à aucune feature premium', () => {
      expect(canAccessFeature(false, 'store_full_ranking')).toBe(false);
      expect(canAccessFeature(false, 'store_comparison')).toBe(false);
      expect(canAccessFeature(false, 'smart_alternatives')).toBe(false);
    });
  });

  describe('getFeatureLimit', () => {
    it('utilisateur free → store_full_ranking limité à 3', () => {
      expect(getFeatureLimit(false, 'store_full_ranking')).toBe(3);
    });

    it('utilisateur free → store_comparison limité à 3', () => {
      expect(getFeatureLimit(false, 'store_comparison')).toBe(3);
    });

    it('utilisateur free → smart_alternatives limité à 0 (gate complet)', () => {
      expect(getFeatureLimit(false, 'smart_alternatives')).toBe(0);
    });

    it('utilisateur premium → toutes features illimitées (Infinity)', () => {
      expect(getFeatureLimit(true, 'store_full_ranking')).toBe(Infinity);
      expect(getFeatureLimit(true, 'store_comparison')).toBe(Infinity);
      expect(getFeatureLimit(true, 'smart_alternatives')).toBe(Infinity);
    });
  });
});
