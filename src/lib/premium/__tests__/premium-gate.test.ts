/**
 * Premium gate — système 2 tiers (Premium + Expert).
 *
 * Source de vérité = table `subscriptions`.
 * Hiérarchie : free (0) < premium (1) < expert (2).
 * Trialing compte comme actif (D2 validée).
 */

import {
  isPremiumUser,
  getUserTier,
  canAccessFeature,
  getFeatureLimit,
  PREMIUM_FEATURES,
  FEATURE_TIER,
  TIER_HIERARCHY,
  type PremiumFeatureKey,
} from '../premium-gate';
import { supabase } from '../../api/supabase';

jest.mock('../../api/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

/**
 * Mock simulant la query : .from('subscriptions').select('plan, status').eq('user_id', x).limit(1).maybeSingle()
 * Plus de filtre serveur sur plan/status — on fait le filtrage en JS via subscriptionRowToTier.
 */
function mockSubscriptionRow(row: { plan: string; status: string } | null) {
  const maybeSingle = jest.fn().mockResolvedValue({ data: row, error: null });
  const limit = jest.fn().mockReturnValue({ maybeSingle });
  const eqUser = jest.fn().mockReturnValue({ limit });
  const select = jest.fn().mockReturnValue({ eq: eqUser });
  (supabase.from as jest.Mock).mockReturnValue({ select });
  return { select, eqUser, limit, maybeSingle };
}

function mockSubscriptionError() {
  const maybeSingle = jest
    .fn()
    .mockResolvedValue({ data: null, error: { message: 'boom' } });
  const limit = jest.fn().mockReturnValue({ maybeSingle });
  const eqUser = jest.fn().mockReturnValue({ limit });
  const select = jest.fn().mockReturnValue({ eq: eqUser });
  (supabase.from as jest.Mock).mockReturnValue({ select });
}

describe('premium-gate', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isPremiumUser (backward compat)', () => {
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
      mockSubscriptionError();
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

    it('reste true pour tier=expert (backward compat)', async () => {
      mockSubscriptionRow({ plan: 'expert', status: 'active' });
      const res = await isPremiumUser('uid-expert');
      expect(res).toBe(true);
    });
  });

  describe('getUserTier', () => {
    it("retourne 'expert' pour plan='expert' AND status='active'", async () => {
      mockSubscriptionRow({ plan: 'expert', status: 'active' });
      const tier = await getUserTier('uid-1');
      expect(tier).toBe('expert');
    });

    it("retourne 'expert' pour plan='expert' AND status='trialing'", async () => {
      mockSubscriptionRow({ plan: 'expert', status: 'trialing' });
      const tier = await getUserTier('uid-2');
      expect(tier).toBe('expert');
    });

    it("retourne 'premium' pour plan='premium' AND status='active'", async () => {
      mockSubscriptionRow({ plan: 'premium', status: 'active' });
      const tier = await getUserTier('uid-3');
      expect(tier).toBe('premium');
    });

    it("retourne 'free' si pas de ligne, userId null, ou status='canceled'", async () => {
      // Cas 1 : pas de ligne
      mockSubscriptionRow(null);
      expect(await getUserTier('uid-no-row')).toBe('free');

      // Cas 2 : userId null (aucun appel Supabase attendu)
      jest.clearAllMocks();
      expect(await getUserTier(null)).toBe('free');
      expect(supabase.from).not.toHaveBeenCalled();

      // Cas 3 : status='canceled'
      mockSubscriptionRow({ plan: 'premium', status: 'canceled' });
      expect(await getUserTier('uid-canceled')).toBe('free');
    });

    it("retourne 'free' si erreur Supabase", async () => {
      mockSubscriptionError();
      const tier = await getUserTier('uid-err');
      expect(tier).toBe('free');
    });
  });

  describe('PREMIUM_FEATURES catalogue', () => {
    it('expose les 20 clés attendues (10 Premium + 10 Expert)', () => {
      const keys = Object.keys(PREMIUM_FEATURES) as PremiumFeatureKey[];
      expect(keys).toEqual(
        expect.arrayContaining([
          // Premium (10)
          'store_full_ranking',
          'store_comparison',
          'smart_alternatives',
          'unlimited_history',
          'food_journal',
          'advanced_stats',
          'export_data',
          'priority_support',
          'vivo_recap',
          'scan_choc',
          // Expert (10)
          'plant_database',
          'herbal_remedies',
          'plant_alternatives',
          'cosmetic_actives',
          'pregnancy_safety',
          'children_safety',
          'interaction_warnings',
          'expert_articles',
          'expert_consultation',
          'protocols_21days',
        ]),
      );
      expect(keys).toHaveLength(20);
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
    it('utilisateur premium accède aux features premium', () => {
      expect(canAccessFeature('premium', 'store_full_ranking')).toBe(true);
      expect(canAccessFeature('premium', 'store_comparison')).toBe(true);
      expect(canAccessFeature('premium', 'smart_alternatives')).toBe(true);
    });

    it("utilisateur free n'accède à aucune feature premium", () => {
      expect(canAccessFeature('free', 'store_full_ranking')).toBe(false);
      expect(canAccessFeature('free', 'store_comparison')).toBe(false);
      expect(canAccessFeature('free', 'smart_alternatives')).toBe(false);
    });

    it("canAccessFeature('expert', 'plant_database') → true", () => {
      expect(canAccessFeature('expert', 'plant_database')).toBe(true);
    });

    it("canAccessFeature('premium', 'plant_database') → false (Expert-only)", () => {
      expect(canAccessFeature('premium', 'plant_database')).toBe(false);
    });

    it("canAccessFeature('expert', 'smart_alternatives') → true (hierarchy)", () => {
      // Expert hérite de toutes les features Premium.
      expect(canAccessFeature('expert', 'smart_alternatives')).toBe(true);
      expect(canAccessFeature('expert', 'store_full_ranking')).toBe(true);
      expect(canAccessFeature('expert', 'store_comparison')).toBe(true);
    });
  });

  describe('FEATURE_TIER mapping', () => {
    it("FEATURE_TIER['smart_alternatives'] === 'premium' ET FEATURE_TIER['plant_database'] === 'expert'", () => {
      expect(FEATURE_TIER['smart_alternatives']).toBe('premium');
      expect(FEATURE_TIER['plant_database']).toBe('expert');
    });

    it('TIER_HIERARCHY définit free < premium < expert', () => {
      expect(TIER_HIERARCHY.free).toBe(0);
      expect(TIER_HIERARCHY.premium).toBe(1);
      expect(TIER_HIERARCHY.expert).toBe(2);
    });
  });

  describe('getFeatureLimit', () => {
    it('utilisateur free → store_full_ranking limité à 3', () => {
      expect(getFeatureLimit('free', 'store_full_ranking')).toBe(3);
    });

    it('utilisateur free → store_comparison limité à 3', () => {
      expect(getFeatureLimit('free', 'store_comparison')).toBe(3);
    });

    it('utilisateur free → smart_alternatives limité à 0 (gate complet)', () => {
      expect(getFeatureLimit('free', 'smart_alternatives')).toBe(0);
    });

    it('utilisateur premium → toutes features illimitées (Infinity)', () => {
      expect(getFeatureLimit('premium', 'store_full_ranking')).toBe(Infinity);
      expect(getFeatureLimit('premium', 'store_comparison')).toBe(Infinity);
      expect(getFeatureLimit('premium', 'smart_alternatives')).toBe(Infinity);
    });

    it('utilisateur expert → toutes features illimitées (Infinity)', () => {
      expect(getFeatureLimit('expert', 'store_full_ranking')).toBe(Infinity);
      expect(getFeatureLimit('expert', 'plant_database')).toBe(Infinity);
    });
  });
});
