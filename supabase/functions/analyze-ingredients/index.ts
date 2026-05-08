// supabase/functions/analyze-ingredients/index.ts
// Deno runtime — Supabase Edge Function

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_TOKENS = 2000;

const SYSTEM_PROMPT = `Tu es un expert en nutrition et toxicologie alimentaire pour Vivo, une app française d'analyse d'étiquettes.

L'utilisateur t'envoie une photo de la liste d'ingrédients d'un produit alimentaire OU cosmétique. Tu dois :
1. Lire la liste d'ingrédients sur la photo (français principalement, mais peut être multilingue).
2. Détecter le type de produit (food vs cosmetic) depuis le contexte.
3. Évaluer chaque ingrédient pertinent (max 15) selon ces critères :
   - additifs E-numbers (E102, E211, E250, E951…) → risque souvent caution/avoid selon EFSA/ANSES/IARC
   - huiles de graines (tournesol, colza, soja, maïs) → caution
   - sucres ajoutés multiples → caution
   - édulcorants artificiels (aspartame, sucralose) → avoid pour Vivo
   - additifs naturels reconnus EFSA → safe
   - ingrédients bruts (légumes, fruits, viandes simples) → safe
4. Calculer un score 0-100 (100 = idéal, 0 = à éviter absolument). Pénalise fortement les additifs blockers (E211, E951, E621, E407, parabènes E216-E217 interdits UE…).
5. Rédiger 2-4 "concerns" et 0-3 "positives" courts en français.
6. Rédiger 1 "summary" d'une phrase.

**Réponse OBLIGATOIRE** : JSON uniquement, sans markdown ni texte avant/après. Schema strict :

\`\`\`json
{
  "score": 65,
  "productType": "food",
  "ingredients": [
    { "name": "E211 (benzoate de sodium)", "riskLevel": "avoid", "reason": "Conservateur lié à l'hyperactivité chez l'enfant (étude Southampton 2007)" }
  ],
  "concerns": ["Présence d'un conservateur controversé", "Trois sucres ajoutés différents"],
  "positives": ["Sans huile de palme"],
  "summary": "Produit transformé avec additifs à éviter chez l'enfant."
}
\`\`\`

Si la photo est illisible/floue → réponds UNIQUEMENT \`{"error":"unreadable"}\`.
Si la photo n'est pas une liste d'ingrédients (ex: visage, paysage) → \`{"error":"not_ingredients"}\`.

Toutes les strings utilisateur-facing en français.`;

interface AnalyzeRequest {
  imageBase64: string;
  mimeType: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ code: 'invalid_request', message: 'Méthode non supportée.' }, 405);
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return jsonResponse({ code: 'server_error', message: 'Clé Anthropic absente côté serveur.' }, 500);
  }

  let body: AnalyzeRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ code: 'invalid_request', message: 'JSON invalide.' }, 400);
  }

  if (!body.imageBase64 || !body.mimeType) {
    return jsonResponse({ code: 'invalid_request', message: 'imageBase64 et mimeType requis.' }, 400);
  }

  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(body.mimeType)) {
    return jsonResponse({ code: 'invalid_request', message: 'Format image non supporté.' }, 400);
  }

  const claudePayload = {
    model: ANTHROPIC_MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: body.mimeType,
              data: body.imageBase64,
            },
          },
          {
            type: 'text',
            text: 'Analyse cette liste d\'ingrédients selon les règles fournies et renvoie le JSON strict.',
          },
        ],
      },
    ],
  };

  let claudeRes: Response;
  try {
    claudeRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(claudePayload),
    });
  } catch (err) {
    return jsonResponse({ code: 'server_error', message: 'Échec d\'appel à Anthropic.' }, 502);
  }

  if (claudeRes.status === 429) {
    const retryAfter = claudeRes.headers.get('retry-after') ?? '60';
    return jsonResponse(
      { code: 'rate_limited', message: 'Quota dépassé. Réessaie plus tard.' },
      429,
      { 'Retry-After': retryAfter },
    );
  }

  if (claudeRes.status === 400) {
    return jsonResponse({ code: 'invalid_request', message: 'Image refusée par le service.' }, 400);
  }

  if (!claudeRes.ok) {
    return jsonResponse({ code: 'server_error', message: 'Erreur serveur Anthropic.' }, 502);
  }

  let claudeJson: { content?: Array<{ type: string; text?: string }> };
  try {
    claudeJson = await claudeRes.json();
  } catch {
    return jsonResponse({ code: 'server_error', message: 'Réponse Anthropic invalide.' }, 502);
  }

  const textBlock = claudeJson.content?.find((c) => c.type === 'text');
  const rawText = textBlock?.text?.trim();
  if (!rawText) {
    return jsonResponse({ code: 'server_error', message: 'Réponse Anthropic vide.' }, 502);
  }

  // Nettoie un éventuel fence markdown ```json … ```
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return jsonResponse({ code: 'server_error', message: 'Réponse Anthropic non-JSON.' }, 502);
  }

  // Cas erreur métier renvoyé par Claude
  if (typeof parsed === 'object' && parsed !== null && 'error' in parsed) {
    const errVal = (parsed as { error: unknown }).error;
    if (errVal === 'unreadable') {
      return jsonResponse({ code: 'unreadable', message: 'Photo illisible. Réessaie en cadrant la liste d\'ingrédients.' }, 200);
    }
    if (errVal === 'not_ingredients') {
      return jsonResponse({ code: 'not_ingredients', message: 'Aucune liste d\'ingrédients détectée sur cette photo.' }, 200);
    }
  }

  return jsonResponse(parsed, 200);
});

function jsonResponse(body: unknown, status: number, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      ...extraHeaders,
      'Content-Type': 'application/json',
    },
  });
}
