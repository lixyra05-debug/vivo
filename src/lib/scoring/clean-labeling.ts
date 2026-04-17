export interface CleanLabelingAlert {
  term: string;
  suspectedMeaning: string;
}

const CLEAN_LABELING_TERMS: Array<{ pattern: RegExp; term: string; suspected: string }> = [
  {
    pattern: /extrait\s+de\s+levure/i,
    term: 'Extrait de levure',
    suspected: 'MSG caché (glutamate)',
  },
  {
    pattern: /ar[ôo]me\s+naturel/i,
    term: 'Arôme naturel',
    suspected: 'Potentiellement MSG ou excitotoxine',
  },
  {
    pattern: /prot[ée]ines?\s+hydrolys[ée]es?/i,
    term: 'Protéines hydrolysées',
    suspected: 'MSG caché + indicateur NOVA 4',
  },
  {
    pattern: /prot[ée]ine\s+v[ée]g[ée]tale\s+hydrolys[ée]e/i,
    term: 'Protéine végétale hydrolysée',
    suspected: 'MSG caché',
  },
  {
    pattern: /maltodextrine/i,
    term: 'Maltodextrine',
    suspected: 'Sucre déguisé à IG élevé',
  },
  {
    pattern: /\bbouillon\b/i,
    term: 'Bouillon',
    suspected: 'Souvent MSG caché',
  },
  {
    pattern: /huile\s+v[ée]g[ée]tale(?!\s+d)/i,
    term: 'Huile végétale',
    suspected: 'Souvent huile de graines raffinée non spécifiée',
  },
  {
    pattern: /sirop\s+de\s+glucose(-fructose)?/i,
    term: 'Sirop de glucose-fructose',
    suspected: 'Sucre ultra-raffiné, pic glycémique sévère',
  },
  {
    pattern: /amidon\s+modifi[ée]/i,
    term: 'Amidon modifié',
    suspected: 'Indicateur NOVA 4',
  },
  {
    pattern: /ar[ôo]me\s+artificiel/i,
    term: 'Arôme artificiel',
    suspected: 'Composé synthétique non tracé',
  },
];

export function detectCleanLabeling(ingredientsRaw: string): CleanLabelingAlert[] {
  if (!ingredientsRaw) return [];
  const out: CleanLabelingAlert[] = [];
  const seen = new Set<string>();
  for (const entry of CLEAN_LABELING_TERMS) {
    if (entry.pattern.test(ingredientsRaw) && !seen.has(entry.term)) {
      seen.add(entry.term);
      out.push({ term: entry.term, suspectedMeaning: entry.suspected });
    }
  }
  return out;
}
