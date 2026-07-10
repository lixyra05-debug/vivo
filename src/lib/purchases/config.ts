/**
 * Configuration RevenueCat — identifiants contractuels.
 *
 * ⚠️ Ces identifiants doivent matcher App Store Connect / RevenueCat À LA LETTRE :
 *   • Products App Store Connect : vivo_premium_yearly (29,99€/an), vivo_expert_yearly (49,99€/an)
 *   • Entitlements RevenueCat : 'premium', 'expert' — le produit Expert active LES DEUX
 *   • Offering : 'default' avec les 2 packages
 */

export const REVENUECAT_APPLE_API_KEY = 'appl_REMPLACER_APRES_CONFIG_REVENUECAT';
// ⚠️ Hector : remplacer par la clé publique Apple depuis app.revenuecat.com → Project → API Keys

export const ENTITLEMENT_PREMIUM = 'premium';
export const ENTITLEMENT_EXPERT = 'expert';
export const PRODUCT_PREMIUM_YEARLY = 'vivo_premium_yearly';
export const PRODUCT_EXPERT_YEARLY = 'vivo_expert_yearly';
