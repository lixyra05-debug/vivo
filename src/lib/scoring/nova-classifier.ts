import { findAdditive, normalizeAdditiveTag } from './additives-db';

const NOVA4_MARKERS: RegExp[] = [
  /prot[ée]ines?\s+hydrolys[ée]es?/i,
  /prot[ée]ine\s+v[ée]g[ée]tale\s+hydrolys[ée]e/i,
  /isolat\s+de\s+prot[ée]ines?/i,
  /amidon\s+modifi[ée]/i,
  /maltodextrine/i,
  /sirop\s+de\s+glucose(-fructose)?/i,
  /sirop\s+de\s+fructose/i,
  /dextrose/i,
  /huile\s+(v[ée]g[ée]tale|de\s+palme|hydrog[ée]n[ée]e)/i,
  /ar[ôo]me\s+artificiel/i,
  /extrait\s+de\s+levure/i,
  /trait[ée]\s+par\s+rayonnements\s+ionisants/i,
  /\b(e471|e472|e473|e475|e476)\b/i,
];

const NOVA3_MARKERS: RegExp[] = [
  /conserv[ée]\s+au\s+vinaigre/i,
  /fromage/i,
  /\bjambon\b/i,
  /saumur[ée]/i,
  /\bsirop\b/i,
  /pain(?!\s+complet)/i,
];

const NOVA2_MARKERS: RegExp[] = [
  /huile\s+d[''`]olive/i,
  /beurre/i,
  /\bsucre\b/i,
  /\bsel\b/i,
  /\bmiel\b/i,
  /\bvinaigre\b/i,
];

const EMULSIFIER_RE = /\b(e4\d{2}|e3\d{2})\b/i;

export function classifyNova(ingredientsRaw: string, additivesTags: string[] = []): 1 | 2 | 3 | 4 {
  const hay = (ingredientsRaw ?? '').toLowerCase();

  const additiveHits = (additivesTags ?? [])
    .map(normalizeAdditiveTag)
    .filter((t) => t.length > 0);

  const hasBlockerOrHigh = additiveHits.some((tag) => {
    const entry = findAdditive(tag);
    return entry?.isBlocker || entry?.riskLevel === 'high';
  });

  if (hasBlockerOrHigh) return 4;
  if (additiveHits.length >= 3) return 4;
  if (NOVA4_MARKERS.some((p) => p.test(hay))) return 4;
  if (additiveHits.some((tag) => EMULSIFIER_RE.test(tag))) return 4;
  if (NOVA3_MARKERS.some((p) => p.test(hay)) || additiveHits.length >= 1) return 3;
  if (NOVA2_MARKERS.some((p) => p.test(hay))) return 2;

  if (!hay.trim()) return 1;
  const tokenCount = hay.split(/[,;()]/).map((s) => s.trim()).filter(Boolean).length;
  if (tokenCount <= 2) return 1;
  return 2;
}
