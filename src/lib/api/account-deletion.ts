/**
 * account-deletion — RGPD art. 17 + Apple Guideline 5.1.1(v).
 *
 * Crée une ligne dans `deletion_requests` puis signOut. La suppression
 * effective des données utilisateur est traitée manuellement côté équipe
 * sous 30 jours (cf. Politique de Confidentialité).
 */

import { supabase } from './supabase';
import { signOut } from './auth';

export async function requestAccountDeletion(userId: string): Promise<void> {
  const { error } = await supabase
    .from('deletion_requests')
    .insert({ user_id: userId });

  if (error) {
    throw new Error(error.message);
  }

  await signOut();
}
