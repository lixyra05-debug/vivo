import { supabase } from './supabase';
import type {
  OcrAnalysisResult,
  OcrAnalysisError,
  OcrErrorCode,
} from '@/src/types/ocr-analysis';

const TIMEOUT_MS = 30000;

interface AnalyzeArgs {
  imageBase64: string;
  mimeType: string;
}

export type OcrScanResponse =
  | { ok: true; data: OcrAnalysisResult }
  | { ok: false; error: OcrAnalysisError };

export async function analyzeIngredientImage(
  args: AnalyzeArgs,
): Promise<OcrScanResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const { data, error } = await supabase.functions.invoke<unknown>(
      'analyze-ingredients',
      {
        body: { imageBase64: args.imageBase64, mimeType: args.mimeType },
      },
    );

    clearTimeout(timeoutId);

    if (error) {
      const status = (error as { status?: number }).status;
      if (status === 429) return errResp('rate_limited', 'Trop de scans. Réessaie dans une minute.');
      if (status === 400) return errResp('invalid_request', 'Image refusée.');
      if (status && status >= 500) return errResp('server_error', 'Service indisponible. Réessaie plus tard.');
      return errResp('network', 'Connexion impossible.');
    }

    if (!data || typeof data !== 'object') {
      return errResp('server_error', 'Réponse invalide.');
    }

    const obj = data as Record<string, unknown>;

    // Cas erreur métier renvoyée par l'Edge Function (status 200 + body { code, message })
    if (typeof obj.code === 'string' && typeof obj.message === 'string') {
      return errResp(obj.code as OcrErrorCode, obj.message);
    }

    if (
      typeof obj.score === 'number' &&
      Array.isArray(obj.ingredients) &&
      typeof obj.summary === 'string'
    ) {
      return { ok: true, data: obj as unknown as OcrAnalysisResult };
    }

    return errResp('server_error', 'Réponse invalide.');
  } catch (err) {
    clearTimeout(timeoutId);
    if (controller.signal.aborted) {
      return errResp('timeout', 'L\'analyse a pris trop de temps.');
    }
    return errResp('network', 'Connexion impossible.');
  }
}

function errResp(code: OcrErrorCode, message: string): OcrScanResponse {
  return { ok: false, error: { code, message } };
}
