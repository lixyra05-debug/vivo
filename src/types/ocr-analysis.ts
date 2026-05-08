export type OcrRiskLevel = 'safe' | 'caution' | 'avoid';

export type OcrErrorCode =
  | 'unreadable'           // photo floue / illisible (Claude renvoie cette erreur)
  | 'not_ingredients'      // photo sans liste d'ingrédients
  | 'rate_limited'         // quota Anthropic dépassé
  | 'network'              // erreur réseau côté client
  | 'timeout'              // timeout 30s côté client
  | 'server_error'         // 5xx côté Edge Function ou Anthropic
  | 'invalid_request';     // 400 (image trop grosse, format invalide…)

export interface OcrIngredient {
  name: string;            // nom de l'ingrédient en français (ou tel que sur l'étiquette)
  riskLevel: OcrRiskLevel; // safe (vert) / caution (orange) / avoid (rouge)
  reason: string;          // explication courte FR ("conservateur controversé", "huile de graine inflammatoire"…)
}

export interface OcrAnalysisResult {
  score: number;                    // 0-100
  productType: 'food' | 'cosmetic'; // détecté par Claude depuis le contexte de la liste
  ingredients: OcrIngredient[];     // ordre tel que Claude renvoie (pertinence)
  concerns: string[];               // 2-4 phrases courtes FR sur les points négatifs majeurs
  positives: string[];              // 0-3 phrases courtes FR sur les points positifs (peut être [])
  summary: string;                  // 1 phrase de synthèse FR
}

export interface OcrAnalysisError {
  code: OcrErrorCode;
  message: string;                  // message FR utilisateur-facing
}
