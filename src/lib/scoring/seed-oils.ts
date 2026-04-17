export interface SeedOilDetection {
  oil: string;
  nameFr: string;
  refined: boolean;
  deodorized: boolean;
}

const SEED_OIL_MATCHERS: Array<{ key: string; nameFr: string; patterns: RegExp[] }> = [
  {
    key: 'sunflower',
    nameFr: 'Huile de tournesol',
    patterns: [/huile\s+de\s+tournesol/i, /sunflower\s+oil/i, /\btournesol\b/i],
  },
  {
    key: 'rapeseed',
    nameFr: 'Huile de colza',
    patterns: [/huile\s+de\s+colza/i, /rapeseed\s+oil/i, /canola\s+oil/i],
  },
  {
    key: 'soy',
    nameFr: 'Huile de soja',
    patterns: [/huile\s+de\s+soja/i, /soy(bean)?\s+oil/i],
  },
  {
    key: 'corn',
    nameFr: 'Huile de maïs',
    patterns: [/huile\s+de\s+ma[ïi]s/i, /corn\s+oil/i],
  },
  {
    key: 'palm',
    nameFr: 'Huile de palme',
    patterns: [/huile\s+de\s+palme/i, /palm\s+oil/i, /\bpalmiste\b/i],
  },
  {
    key: 'cottonseed',
    nameFr: 'Huile de coton',
    patterns: [/huile\s+de\s+coton/i, /cottonseed\s+oil/i],
  },
  {
    key: 'grapeseed',
    nameFr: 'Huile de pépins de raisin',
    patterns: [/huile\s+de\s+p[ée]pins?\s+de\s+raisin/i, /grapeseed\s+oil/i],
  },
  {
    key: 'safflower',
    nameFr: 'Huile de carthame',
    patterns: [/huile\s+de\s+carthame/i, /safflower\s+oil/i],
  },
  {
    key: 'rice_bran',
    nameFr: 'Huile de son de riz',
    patterns: [/huile\s+de\s+son\s+de\s+riz/i, /rice\s+bran\s+oil/i],
  },
  {
    key: 'vegetable_generic',
    nameFr: 'Huile végétale non spécifiée',
    patterns: [/huile\s+v[ée]g[ée]tale/i, /vegetable\s+oil/i],
  },
];

const REFINED_RE =
  /(raffin[ée]e?|refined|hydrog[ée]n[ée]e?|hydrogenated|interest[ée]rifi[ée]e?|interesterified)/i;

const UNREFINED_RE =
  /(vierge|virgin|extra[\s-]vierge|first[\s-]cold[\s-]press|press[ée]e?\s+[àa]\s+froid|cold[\s-]pressed|non\s+raffin[ée]e?)/i;

const DEODORIZED_RE = /(d[ée]sodoris[ée]e?|deodori[sz]ed)/i;

export function detectSeedOils(
  ingredientsRaw: string,
  oilTypes: string[] = []
): SeedOilDetection[] {
  const hay = (ingredientsRaw ?? '').toLowerCase();
  const seen = new Set<string>();
  const out: SeedOilDetection[] = [];

  for (const tag of oilTypes ?? []) {
    const raw = String(tag).toLowerCase();
    const match = SEED_OIL_MATCHERS.find(
      (m) => raw === m.key || raw.includes(m.key.replace('_', ' ')) || raw.includes(m.key)
    );
    if (match && !seen.has(match.key)) {
      seen.add(match.key);
      const refined = !UNREFINED_RE.test(hay);
      const deodorized = DEODORIZED_RE.test(hay) || raw.includes('deodorized');
      out.push({ oil: match.key, nameFr: match.nameFr, refined, deodorized });
    }
  }

  for (const matcher of SEED_OIL_MATCHERS) {
    if (seen.has(matcher.key)) continue;
    if (matcher.patterns.some((p) => p.test(hay))) {
      seen.add(matcher.key);
      const unrefinedHere = UNREFINED_RE.test(hay);
      const refined = matcher.key === 'vegetable_generic' ? true : !unrefinedHere;
      const deodorized = DEODORIZED_RE.test(hay);
      out.push({ oil: matcher.key, nameFr: matcher.nameFr, refined, deodorized });
    }
  }

  return out;
}
