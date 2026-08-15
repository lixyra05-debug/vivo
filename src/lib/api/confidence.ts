import type {
  CosmeticProduct,
  Product,
  ProductConfidence,
} from './types';

// Couleurs (palette Vivo)
const COLOR_VERIFIED = '#4CAF50'; // vert score
const COLOR_COMMUNITY = '#C4A882'; // terre
const COLOR_UNVERIFIED = '#FF9800'; // orange

// Labels FR
const LABEL_VERIFIED = 'Vérifié fabricant';
const LABEL_COMMUNITY = 'Contribution communautaire';
const LABEL_UNVERIFIED = 'À vérifier';

function isStringFilled(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNumberFilled(value: number | null | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Calcule le niveau de confiance pour un produit alimentaire à partir
 * du cache local (Product). 6 critères : image, nom, marque, ingrédients,
 * nutriscore, au moins un nutriment.
 */
export function getProductConfidence(product: Product): ProductConfidence {
  const checks: Array<{ ok: boolean; presentFr: string; missingFr: string }> = [
    {
      ok: isStringFilled(product.image_url),
      presentFr: 'Image présente',
      missingFr: 'Image manquante',
    },
    {
      ok: isStringFilled(product.name),
      presentFr: 'Nom renseigné',
      missingFr: 'Nom manquant',
    },
    {
      ok: isStringFilled(product.brand),
      presentFr: 'Marque renseignée',
      missingFr: 'Marque manquante',
    },
    {
      ok: isStringFilled(product.ingredients_raw),
      presentFr: 'Ingrédients listés',
      missingFr: 'Ingrédients non renseignés',
    },
    {
      ok: isStringFilled(product.nutriscore_grade),
      presentFr: 'Nutri-Score disponible',
      missingFr: 'Nutri-Score absent',
    },
    {
      ok: isNumberFilled(product.energy_kcal_100g),
      presentFr: 'Valeurs nutritionnelles disponibles',
      missingFr: 'Valeurs nutritionnelles absentes',
    },
  ];

  const filled = checks.filter((c) => c.ok).length;
  const missingLabels = checks.filter((c) => !c.ok).map((c) => c.missingFr);

  if (filled === checks.length) {
    return {
      level: 'verified',
      labelFr: LABEL_VERIFIED,
      color: COLOR_VERIFIED,
      reasons: ['Toutes les données essentielles renseignées'],
    };
  }

  if (filled >= 4) {
    const reasons: string[] = ['Informations partielles, contribution communautaire'];
    // Ajoute jusqu'à 2 mentions manquantes pour rester sous la limite de 3
    for (const m of missingLabels.slice(0, 2)) {
      reasons.push(m);
    }
    return {
      level: 'community',
      labelFr: LABEL_COMMUNITY,
      color: COLOR_COMMUNITY,
      reasons: reasons.slice(0, 3),
    };
  }

  // unverified
  const reasons: string[] = [];
  for (const m of missingLabels.slice(0, 2)) {
    reasons.push(m);
  }
  reasons.push('À vérifier avant usage');
  return {
    level: 'unverified',
    labelFr: LABEL_UNVERIFIED,
    color: COLOR_UNVERIFIED,
    reasons: reasons.slice(0, 3),
  };
}

/**
 * Calcule le niveau de confiance pour un produit cosmétique. 5 critères :
 * image, nom, marque, ingrédients INCI, catégorie.
 */
export function getCosmeticConfidence(product: CosmeticProduct): ProductConfidence {
  const checks: Array<{ ok: boolean; presentFr: string; missingFr: string }> = [
    {
      ok: isStringFilled(product.image_url),
      presentFr: 'Image présente',
      missingFr: 'Image manquante',
    },
    {
      ok: isStringFilled(product.name),
      presentFr: 'Nom renseigné',
      missingFr: 'Nom manquant',
    },
    {
      ok: isStringFilled(product.brand),
      presentFr: 'Marque renseignée',
      missingFr: 'Marque manquante',
    },
    {
      ok: isStringFilled(product.ingredients_inci),
      presentFr: 'Ingrédients INCI listés',
      missingFr: 'Ingrédients INCI non renseignés',
    },
    {
      ok: isStringFilled(product.category),
      presentFr: 'Catégorie renseignée',
      missingFr: 'Catégorie manquante',
    },
  ];

  const filled = checks.filter((c) => c.ok).length;
  const missingLabels = checks.filter((c) => !c.ok).map((c) => c.missingFr);

  if (filled === checks.length) {
    return {
      level: 'verified',
      labelFr: LABEL_VERIFIED,
      color: COLOR_VERIFIED,
      reasons: ['Toutes les données essentielles renseignées'],
    };
  }

  if (filled >= 3) {
    const reasons: string[] = ['Informations partielles, contribution communautaire'];
    for (const m of missingLabels.slice(0, 2)) {
      reasons.push(m);
    }
    return {
      level: 'community',
      labelFr: LABEL_COMMUNITY,
      color: COLOR_COMMUNITY,
      reasons: reasons.slice(0, 3),
    };
  }

  const reasons: string[] = [];
  for (const m of missingLabels.slice(0, 2)) {
    reasons.push(m);
  }
  reasons.push('À vérifier avant usage');
  return {
    level: 'unverified',
    labelFr: LABEL_UNVERIFIED,
    color: COLOR_UNVERIFIED,
    reasons: reasons.slice(0, 3),
  };
}

/**
 * FACE 2 du bloquant 4, voie (i) — nomme les macros PÉNALISABLES absentes
 * (sucres, gras saturés, sel : les trois que le moteur pénalise). Absent =
 * `null` ; zéro est une VALEUR et n'est jamais listé.
 *
 * Complète `getProductConfidence` sans le remplacer : le badge agrège six
 * critères en un niveau — trop grossier pour porter la face 2 (racine A de
 * l'audit : « l'app avoue l'incertitude dans un badge de 11 px pendant que
 * le chiffre de 72 px affirme »). Ici on nomme précisément CE QUI manque,
 * pour que `MissingNutritionBanner` l'affiche au même niveau que la note.
 */
export function getMissingNutritionFields(product: Product): string[] {
  const missing: string[] = [];
  if (product.sugars_100g == null) missing.push('sucres');
  if (product.saturated_fat_100g == null) missing.push('gras saturés');
  if (product.salt_100g == null) missing.push('sel');
  return missing;
}
