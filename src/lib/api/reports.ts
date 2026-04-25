import { supabase } from './supabase';
import type { ReportType } from './types';

const VALID_REPORT_TYPES: ReportType[] = [
  'wrong_name',
  'wrong_photo',
  'wrong_ingredients',
  'wrong_nutrition',
  'other',
];

function isValidReportType(value: string): value is ReportType {
  return (VALID_REPORT_TYPES as string[]).includes(value);
}

export interface SubmitReportInput {
  barcode: string;
  userId: string;
  reportType: ReportType;
  description?: string | null;
}

export interface SubmitReportResult {
  ok: boolean;
  error: string | null;
}

/**
 * Soumet un signalement utilisateur pour un produit. Validation FR :
 * code-barres requis, userId requis, type valide, et description
 * obligatoire si type === 'other'.
 */
export async function submitProductReport(
  input: SubmitReportInput
): Promise<SubmitReportResult> {
  const barcode = (input.barcode ?? '').trim();
  if (!barcode) {
    return { ok: false, error: 'Code-barres requis' };
  }

  const userId = (input.userId ?? '').trim();
  if (!userId) {
    return { ok: false, error: 'Utilisateur requis' };
  }

  if (!isValidReportType(input.reportType)) {
    return { ok: false, error: 'Type de signalement invalide' };
  }

  const description =
    typeof input.description === 'string' ? input.description.trim() : '';

  if (input.reportType === 'other' && description.length === 0) {
    return { ok: false, error: 'Description requise' };
  }

  const payload = {
    barcode,
    user_id: userId,
    report_type: input.reportType,
    description: description.length > 0 ? description : null,
    photo_url: null,
  };

  try {
    const { error } = await supabase.from('product_reports').insert(payload);
    if (error) {
      return { ok: false, error: error.message ?? 'Erreur lors du signalement' };
    }
    return { ok: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur réseau';
    return { ok: false, error: message };
  }
}

/**
 * Retourne le nombre total de signalements pour un code-barres donné.
 * Utilisé pour afficher le badge "X signalements" type Yuka.
 */
export async function getReportCount(barcode: string): Promise<number> {
  const code = (barcode ?? '').trim();
  if (!code) return 0;

  try {
    const { count, error } = await supabase
      .from('product_reports')
      .select('*', { count: 'exact', head: true })
      .eq('barcode', code);
    if (error) return 0;
    return typeof count === 'number' ? count : 0;
  } catch {
    return 0;
  }
}
