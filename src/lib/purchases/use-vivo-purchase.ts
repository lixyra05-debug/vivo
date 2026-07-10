/**
 * use-vivo-purchase — hooks UI partagés pour les achats RevenueCat.
 *
 * Consommés par PremiumPaywall et app/settings/subscription.tsx :
 *   • useVivoPrices()       — prix localisés App Store via product.priceString,
 *                             fallback statique UNIQUEMENT si offerings
 *                             indisponibles (R5, Apple guideline 3.1.2)
 *   • useVivoPurchaseFlow() — achat + restauration avec états de chargement.
 *     L'annulation utilisateur n'affiche JAMAIS d'erreur (R6). Le refresh du
 *     tier passe par l'invalidation React Query du singleton (queryClient),
 *     donc aucun QueryClientProvider n'est requis côté composant.
 *
 * Ne touche jamais react-native-purchases directement (R4) — tout passe par
 * le wrapper ./revenuecat.
 */

import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { queryClient } from '../api/query-client';
import {
  getVivoPackages,
  isPurchasesAvailable,
  purchaseVivoTier,
  restoreVivoPurchases,
} from './revenuecat';

// ─── Prix ────────────────────────────────────────────────────────────────

export interface VivoPrice {
  /** ex. '29,99€/an' (fallback statique) ou '24,99 €/an' (App Store localisé). */
  label: string;
  /** ex. '~2,50€/mois' — chaîne vide si non calculable pour la devise localisée. */
  hint: string;
  /** Label d'accessibilité complet du CTA. */
  a11y: string;
}

export interface VivoPrices {
  premium: VivoPrice;
  expert: VivoPrice;
}

/** Fallback statique — affiché UNIQUEMENT si les offerings App Store sont indisponibles (R5). */
export const FALLBACK_PRICES: VivoPrices = {
  premium: {
    label: '29,99€/an',
    hint: '~2,50€/mois',
    a11y: 'Débloquer Premium — 29,99€ par an',
  },
  expert: {
    label: '49,99€/an',
    hint: '~4,17€/mois',
    a11y: 'Débloquer Expert — 49,99€ par an',
  },
};

function monthlyHint(pkg: PurchasesPackage): string {
  try {
    const price = pkg.product.price;
    const currencyCode = pkg.product.currencyCode;
    if (
      typeof price !== 'number' ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !currencyCode
    ) {
      return '';
    }
    const monthly = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currencyCode,
    }).format(price / 12);
    return `~${monthly}/mois`;
  } catch {
    return '';
  }
}

function localizedPrice(
  pkg: PurchasesPackage | null,
  tierName: 'Premium' | 'Expert',
  fallback: VivoPrice,
): VivoPrice {
  const priceString = pkg?.product?.priceString;
  if (!priceString) return fallback;
  return {
    label: `${priceString}/an`,
    hint: pkg ? monthlyHint(pkg) : '',
    a11y: `Débloquer ${tierName} — ${priceString} par an`,
  };
}

/**
 * Prix des deux tiers. Démarre sur le fallback statique, puis bascule sur les
 * prix localisés App Store dès que les offerings répondent. Sur web / Expo Go
 * / Jest (achats indisponibles), reste sur le fallback sans appel réseau.
 */
export function useVivoPrices(): VivoPrices {
  const [prices, setPrices] = useState<VivoPrices>(FALLBACK_PRICES);

  useEffect(() => {
    if (!isPurchasesAvailable()) return;
    let cancelled = false;
    void getVivoPackages().then((packages) => {
      if (cancelled || !packages) return;
      setPrices({
        premium: localizedPrice(
          packages.premium,
          'Premium',
          FALLBACK_PRICES.premium,
        ),
        expert: localizedPrice(packages.expert, 'Expert', FALLBACK_PRICES.expert),
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return prices;
}

// ─── Flow achat / restauration ───────────────────────────────────────────

const UNAVAILABLE_TITLE = 'Achats indisponibles';
const UNAVAILABLE_MESSAGE =
  "Les achats ne sont pas disponibles sur cet appareil. Utilise l'app Vivo installée depuis l'App Store.";

/** Invalide les caches tier des deux hooks usePremium (premium-gate + hooks). */
async function refreshTierQueries(): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['subscription'] }),
    queryClient.invalidateQueries({ queryKey: ['premium_status'] }),
  ]);
}

export interface VivoPurchaseFlow {
  /** Tier en cours d'achat — pilote le spinner du CTA correspondant. */
  purchasingTier: 'premium' | 'expert' | null;
  isRestoring: boolean;
  /** true pendant tout achat ou restauration — désactive les autres CTAs. */
  busy: boolean;
  purchase: (tier: 'premium' | 'expert') => Promise<void>;
  restore: () => Promise<void>;
}

export function useVivoPurchaseFlow(): VivoPurchaseFlow {
  const [purchasingTier, setPurchasingTier] = useState<
    'premium' | 'expert' | null
  >(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const busy = purchasingTier !== null || isRestoring;

  async function purchase(tier: 'premium' | 'expert'): Promise<void> {
    if (busy) return;
    if (!isPurchasesAvailable()) {
      Alert.alert(UNAVAILABLE_TITLE, UNAVAILABLE_MESSAGE);
      return;
    }
    setPurchasingTier(tier);
    try {
      const result = await purchaseVivoTier(tier);
      if (result.cancelled) return; // R6 — l'annulation n'est jamais une erreur
      if (result.success) {
        await refreshTierQueries();
        const tierName = result.newTier === 'expert' ? 'Expert' : 'Premium';
        Alert.alert(
          `Bienvenue dans Vivo ${tierName} 🌿`,
          'Toutes tes fonctionnalités sont maintenant débloquées.',
        );
      } else {
        Alert.alert(
          'Achat impossible',
          "L'achat n'a pas abouti. Réessaie dans un instant.",
        );
      }
    } finally {
      setPurchasingTier(null);
    }
  }

  async function restore(): Promise<void> {
    if (busy) return;
    if (!isPurchasesAvailable()) {
      Alert.alert(UNAVAILABLE_TITLE, UNAVAILABLE_MESSAGE);
      return;
    }
    setIsRestoring(true);
    try {
      const { restored, tier } = await restoreVivoPurchases();
      if (restored) {
        await refreshTierQueries();
        const tierName = tier === 'expert' ? 'Expert' : 'Premium';
        Alert.alert(
          'Abonnement restauré ✅',
          `Ton abonnement Vivo ${tierName} est de nouveau actif.`,
        );
      } else {
        Alert.alert('Restauration', 'Aucun abonnement à restaurer sur ce compte.');
      }
    } finally {
      setIsRestoring(false);
    }
  }

  return { purchasingTier, isRestoring, busy, purchase, restore };
}
