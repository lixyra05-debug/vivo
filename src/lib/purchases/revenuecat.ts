/**
 * revenuecat — wrapper UNIQUE autour de react-native-purchases (R4).
 *
 * react-native-purchases est une lib NATIVE : elle ne fonctionne ni sur web,
 * ni dans Jest, et en Expo Go elle passe en "Preview API Mode" (les achats
 * RÉUSSISSENT EN MOCK — jamais s'y fier). Tout accès passe donc par un lazy
 * require + guard plateforme (pattern `getNotifications` de reminder-store.ts).
 *
 * Source de vérité des achats : les entitlements RevenueCat.
 * La table Supabase `subscriptions` est un MIROIR synchronisé (fallback
 * d'affichage pour web/Expo Go) — le sync ne bloque jamais l'UX (R7).
 */

import { Platform } from 'react-native';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { supabase } from '../api/supabase';
import type { SubscriptionTier } from '../premium/premium-gate';
import {
  ENTITLEMENT_EXPERT,
  ENTITLEMENT_PREMIUM,
  PRODUCT_EXPERT_YEARLY,
  PRODUCT_PREMIUM_YEARLY,
  REVENUECAT_APPLE_API_KEY,
} from './config';

type PurchasesModule = typeof import('react-native-purchases').default;

// ─── Disponibilité ──────────────────────────────────────────────────────

let availabilityOverride: boolean | null = null;

/**
 * Seam de test UNIQUEMENT : force le résultat d'isPurchasesAvailable().
 * `null` restaure la détection réelle. Ne jamais appeler hors Jest.
 */
export function __setPurchasesAvailableForTests(value: boolean | null): void {
  availabilityOverride = value;
}

function isRunningInExpoGo(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = (
      require('expo-constants') as { default?: Record<string, unknown> }
    ).default;
    return (
      Constants?.executionEnvironment === 'storeClient' ||
      Constants?.appOwnership === 'expo'
    );
  } catch {
    return false;
  }
}

/**
 * Les achats natifs sont utilisables uniquement sur iOS/Android dans un
 * build natif (dev client / TestFlight / prod). Exclusions :
 *   • web — pas de StoreKit
 *   • Expo Go — Preview API Mode : les achats mock-réussissent (dangereux)
 *   • Jest — jamais de module natif en environnement de test
 */
export function isPurchasesAvailable(): boolean {
  if (availabilityOverride !== null) return availabilityOverride;
  if (Platform.OS === 'web') return false;
  if (typeof process !== 'undefined' && process.env?.JEST_WORKER_ID !== undefined) {
    return false;
  }
  if (isRunningInExpoGo()) return false;
  return true;
}

// ─── Lazy require react-native-purchases ────────────────────────────────

function getPurchases(): PurchasesModule | null {
  if (!isPurchasesAvailable()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-purchases') as
      | { default?: PurchasesModule }
      | PurchasesModule;
    const candidate =
      mod && 'default' in mod && mod.default
        ? mod.default
        : (mod as PurchasesModule);
    if (!candidate || typeof candidate.configure !== 'function') return null;
    return candidate;
  } catch {
    return null;
  }
}

// ─── Configuration / identité ───────────────────────────────────────────

let configured = false;

/**
 * Configure le SDK une seule fois (flag module-level), puis logIn si un
 * userId est fourni. Ne throw JAMAIS — les achats ne bloquent pas le boot.
 */
export async function initPurchases(userId?: string): Promise<void> {
  try {
    const Purchases = getPurchases();
    if (!Purchases) return;
    if (!configured) {
      Purchases.configure({ apiKey: REVENUECAT_APPLE_API_KEY });
      configured = true;
    }
    if (userId) {
      await Purchases.logIn(userId);
    }
  } catch {
    // fail silencieux — jamais bloquant
  }
}

/** SIGNED_IN Supabase → aligne l'app user ID RevenueCat. */
export async function identifyPurchasesUser(userId: string): Promise<void> {
  try {
    if (!configured) {
      await initPurchases(userId);
      return;
    }
    const Purchases = getPurchases();
    if (!Purchases) return;
    await Purchases.logIn(userId);
  } catch {
    // fail silencieux
  }
}

/** SIGNED_OUT Supabase → repasse RevenueCat en utilisateur anonyme. */
export async function logOutPurchasesUser(): Promise<void> {
  try {
    const Purchases = getPurchases();
    if (!Purchases || !configured) return;
    await Purchases.logOut();
  } catch {
    // ignore — déjà anonyme ou module indisponible
  }
}

// ─── Entitlements → tier ────────────────────────────────────────────────

function tierFromCustomerInfo(customerInfo: CustomerInfo): SubscriptionTier {
  const active = customerInfo?.entitlements?.active ?? {};
  if (active[ENTITLEMENT_EXPERT]) return 'expert';
  if (active[ENTITLEMENT_PREMIUM]) return 'premium';
  return 'free';
}

/**
 * Tier courant selon RevenueCat, ou `null` si le module est indisponible
 * (web, Expo Go, Jest, SDK non configuré, erreur réseau) → le caller
 * retombe alors sur le miroir Supabase.
 */
export async function getTierFromPurchases(): Promise<SubscriptionTier | null> {
  try {
    const Purchases = getPurchases();
    if (!Purchases) return null;
    const customerInfo = await Purchases.getCustomerInfo();
    return tierFromCustomerInfo(customerInfo);
  } catch {
    return null;
  }
}

// ─── Offerings / packages ───────────────────────────────────────────────

export interface VivoPackages {
  premium: PurchasesPackage | null;
  expert: PurchasesPackage | null;
}

/**
 * Packages de l'offering courant, matchés par product identifier
 * (vivo_premium_yearly / vivo_expert_yearly). `null` si offerings
 * indisponibles → l'UI garde les prix statiques de fallback (R5).
 */
export async function getVivoPackages(): Promise<VivoPackages | null> {
  try {
    const Purchases = getPurchases();
    if (!Purchases) return null;
    const offerings = await Purchases.getOfferings();
    const packages = offerings?.current?.availablePackages ?? [];
    const premium =
      packages.find((p) => p.product.identifier === PRODUCT_PREMIUM_YEARLY) ??
      null;
    const expert =
      packages.find((p) => p.product.identifier === PRODUCT_EXPERT_YEARLY) ??
      null;
    if (!premium && !expert) return null;
    return { premium, expert };
  } catch {
    return null;
  }
}

// ─── Achat / restauration ───────────────────────────────────────────────

export interface PurchaseTierResult {
  success: boolean;
  newTier: SubscriptionTier | null;
  cancelled: boolean;
}

/**
 * Achète le package du tier demandé, relit les entitlements retournés par
 * l'achat, synchronise le miroir Supabase, et renvoie le tier effectif.
 * L'annulation utilisateur n'est PAS une erreur (R6) : `cancelled: true`.
 */
export async function purchaseVivoTier(
  tier: 'premium' | 'expert',
): Promise<PurchaseTierResult> {
  try {
    const Purchases = getPurchases();
    if (!Purchases) return { success: false, newTier: null, cancelled: false };

    const packages = await getVivoPackages();
    const pkg = tier === 'expert' ? packages?.expert : packages?.premium;
    if (!pkg) return { success: false, newTier: null, cancelled: false };

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const newTier = tierFromCustomerInfo(customerInfo);
    await syncTierToSupabase(newTier);
    return { success: true, newTier, cancelled: false };
  } catch (error) {
    if ((error as { userCancelled?: boolean } | null)?.userCancelled === true) {
      return { success: false, newTier: null, cancelled: true };
    }
    return { success: false, newTier: null, cancelled: false };
  }
}

export interface RestoreResult {
  restored: boolean;
  tier: SubscriptionTier | null;
}

/**
 * Restaure les achats App Store, relit les entitlements et synchronise
 * le miroir. `restored` = un tier payant a été retrouvé.
 */
export async function restoreVivoPurchases(): Promise<RestoreResult> {
  try {
    const Purchases = getPurchases();
    if (!Purchases) return { restored: false, tier: null };
    const customerInfo = await Purchases.restorePurchases();
    const tier = tierFromCustomerInfo(customerInfo);
    await syncTierToSupabase(tier);
    return { restored: tier !== 'free', tier };
  } catch {
    return { restored: false, tier: null };
  }
}

// ─── Sync miroir Supabase ───────────────────────────────────────────────

const ACTIVE_STATUSES = new Set(['active', 'trialing']);

function rowToTier(
  row: { plan: string; status: string } | null | undefined,
): SubscriptionTier {
  if (!row || !ACTIVE_STATUSES.has(row.status)) return 'free';
  if (row.plan === 'expert') return 'expert';
  if (row.plan === 'premium') return 'premium';
  return 'free';
}

/**
 * Aligne `subscriptions.plan` sur le tier RevenueCat pour l'utilisateur
 * courant, uniquement si différent de la valeur actuelle. Fail silencieux
 * intégral (R7) : ni l'achat ni l'affichage du tier ne dépendent du sync.
 * Requiert la migration 015 (UNIQUE(user_id) + policies INSERT/UPDATE).
 */
export async function syncTierToSupabase(tier: SubscriptionTier): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) return;

    const { data: row } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (rowToTier(row as { plan: string; status: string } | null) === tier) {
      return;
    }

    await supabase.from('subscriptions').upsert(
      {
        user_id: userId,
        plan: tier,
        status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
  } catch {
    // fail silencieux — le sync ne doit jamais bloquer l'UX (R7)
  }
}
