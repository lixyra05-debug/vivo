/**
 * Méthodologie de scoring publique — utilisée dans l'écran "Transparence".
 *
 * Tous les poids somment à 100 pour faciliter la lecture en pourcentages.
 * Les seuils définissent excellent/good/mediocre/bad sur l'échelle 0-100.
 */

import type { ScoringMethodology } from '../gamification/types';

export const SCORING_METHODOLOGY: ScoringMethodology = {
  food: {
    formulaFr:
      'Score = 100 - (NOVA + Additifs + Macros + Huiles) + Bonus',
    weights: {
      nova: 30,
      additives: 25,
      macros: 25,
      oils: 10,
      bonus: 10,
    },
    thresholds: {
      excellent: 80,
      good: 60,
      mediocre: 40,
      bad: 20,
    },
    sources: [
      {
        name: 'EFSA — Avis additifs',
        url: 'https://www.efsa.europa.eu/fr/topics/topic/food-additives',
      },
      {
        name: 'ANSES — Saisines additifs',
        url: 'https://www.anses.fr/fr/themes/additifs-alimentaires',
      },
      {
        name: 'OMS — Alimentation saine',
        url: 'https://www.who.int/fr/news-room/fact-sheets/detail/healthy-diet',
      },
      {
        name: 'Monteiro et al. — Classification NOVA (2019)',
        url: 'https://www.cambridge.org/core/journals/public-health-nutrition/article/ultraprocessed-foods-what-they-are-and-how-to-identify-them/E6D744D714B1FF09D5BCA3E74D53A185',
      },
      {
        name: 'Santé Publique France — Nutri-Score',
        url: 'https://www.santepubliquefrance.fr/determinants-de-sante/nutrition-et-activite-physique/articles/nutri-score',
      },
    ],
  },
  cosmetic: {
    formulaFr:
      'Score = 100 - (Perturbateurs + Irritants + Allergènes + Silicones + Conservateurs)',
    weights: {
      endocrine: 30,
      irritant: 20,
      allergen: 20,
      silicone: 15,
      preservative: 15,
    },
    thresholds: {
      excellent: 80,
      good: 60,
      mediocre: 40,
      bad: 20,
    },
    sources: [
      {
        name: 'ANSES — Perturbateurs endocriniens',
        url: 'https://www.anses.fr/fr/content/perturbateurs-endocriniens',
      },
      {
        name: 'ECHA — Substances réglementées',
        url: 'https://echa.europa.eu/fr',
      },
      {
        name: 'CIR — Cosmetic Ingredient Review',
        url: 'https://www.cir-safety.org/',
      },
      {
        name: 'ANSM — Avis cosmétique',
        url: 'https://ansm.sante.fr/',
      },
      {
        name: 'Règlement (CE) 1223/2009',
        url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX%3A32009R1223',
      },
    ],
  },
  faq: [
    {
      questionFr: 'Comment le score est-il calculé ?',
      answerFr:
        "Vivo applique un système de pénalités à partir d'une base 100. Plus un produit cumule d'additifs controversés, d'huiles raffinées ou d'ultra-transformation, plus le score baisse. Aucune compensation entre critères : un poison reste un poison.",
    },
    {
      questionFr: "D'où viennent les données ?",
      answerFr:
        "Les données alimentaires proviennent d'Open Food Facts, les données cosmétiques d'Open Beauty Facts, deux bases ouvertes contributives. Vivo applique son propre algorithme de scoring par-dessus.",
    },
    {
      questionFr: 'Pourquoi mon produit bio a un mauvais score ?',
      answerFr:
        "Le label bio garantit l'absence de pesticides de synthèse mais pas l'équilibre nutritionnel. Un biscuit bio reste un produit ultra-transformé riche en sucres : Vivo le note sur ces critères.",
    },
    {
      questionFr: 'Vivo est-il indépendant des marques ?',
      answerFr:
        "Oui, totalement. Vivo ne reçoit aucun financement de marque ni d'industriel. Le scoring est public et auditable. Aucun produit n'est mis en avant contre rémunération.",
    },
    {
      questionFr: 'Puis-je personnaliser les critères ?',
      answerFr:
        "Oui : ton profil santé (allergies, intolérances, conditions médicales) ajuste le score automatiquement. Tu peux aussi activer le mode 'Ce que je peux manger' pour filtrer les produits selon tes critères.",
    },
  ],
};
