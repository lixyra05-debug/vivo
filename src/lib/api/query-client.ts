/**
 * QueryClient singleton de l'app.
 *
 * Extrait de app/_layout.tsx pour que la logique hors-arbre React (achats
 * RevenueCat) puisse invalider les caches tier (['subscription'],
 * ['premium_status']) sans dépendre du contexte QueryClientProvider —
 * PremiumPaywall est rendu dans des tests sans provider.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient();
