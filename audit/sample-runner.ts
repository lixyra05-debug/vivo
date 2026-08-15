/**
 * AUDIT AGENT 4 — RUNNER JETABLE de distribution du scoring.
 *
 * Ce fichier N'EST PAS un test permanent du projet. Il n'a volontairement pas
 * le suffixe `.test.` pour qu'un `npx jest` global ne le ramasse JAMAIS.
 * Il rejoue le pipeline de PRODUCTION exact sur un échantillon OFF téléchargé
 * au préalable (TEMPS 1, curl) dans le scratchpad de session :
 *
 *   normalizeOFFProduct(off)            — src/lib/api/openfoodfacts.ts
 *   → productToScoringInput(product)    — src/lib/api/openfoodfacts.ts
 *   → calculateScore(input, standard)   — src/lib/scoring/engine.ts
 *   → composeScore(result, packagings)  — src/lib/scoring/composite-score.ts
 *
 * Aucun maillon n'est réimplémenté : les 4 fonctions sont les exports de prod.
 *
 * Exécution :
 *   npx jest --runTestsByPath audit/sample-runner.ts --testEnvironment=node
 *
 * Si le dossier scratchpad est absent (session terminée), le test warn et
 * return sans échouer — le fichier est documenté comme jetable.
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  normalizeOFFProduct,
  productToScoringInput,
  type OFFProduct,
} from '../src/lib/api/openfoodfacts';
import { calculateScore } from '../src/lib/scoring/engine';
import {
  composeScore,
  type CompositeScoringResult,
} from '../src/lib/scoring/composite-score';
import type { UserProfile } from '../src/lib/api/types';
import { MAX_PACKAGING_PENALTY } from '../src/constants/scoring-rules';

const SCRATCH_DIR =
  '/private/tmp/claude-501/-Users-volanthector-projects-vivo/e0e9a3cf-fc63-49ec-9aa7-602472de591f/scratchpad/off-sample';

/** Fichiers TEMPS 1 : 1 appel search v2 fr.openfoodfacts.org par catégorie. */
const CATEGORY_FILES: ReadonlyArray<readonly [string, string]> = [
  ['eaux', 'en_waters.json'],
  ['sodas', 'en_sodas.json'],
  ['yaourts', 'en_yogurts.json'],
  ['cereales', 'en_breakfast-cereals.json'],
  ['chocolats', 'en_chocolates.json'],
  ['plats', 'en_meals.json'],
];

const PROFILE: UserProfile = { type: 'standard', allergies: [], intolerances: [] };

/**
 * Codes-barres dont on veut le détail complet des pénalités (cas emblématiques
 * repérés dans la sortie agrégée — preuve par le pipeline, pas par relecture).
 */
const DETAIL_BARCODES: ReadonlyArray<string> = [
  '6111035000430', // Sidi Ali — nova ABSENT (eau minérale)
  '6111035002175', // Sidi Ali — nova=1, même marque
  '6111248360376', // Eau aman — SANS packagings[]
  '5449000214911', // Coca-Cola — nova 4, sucres 10.6
  '5449000133328', // Coca Zero — e951 aspartame
  '3281780894950', // Carottes râpées Pierre Martinet — form 0
  '3036811368029', // Velouté 12 légumes Liebig — form 0, 0 additif
  '3046920022651', // Lindt Noir Intense — serving '10 g'
  '3700214611548', // Alter Eco 85% — serving '100g'
  '3068320080000', // Evian — serving '1g' (donnée OFF corrompue)
  '8445291061132', // HEPAR — serving '1000 ml'
  '3268840001008', // Cristaline 0.5L — ancre documentée PET+HDPE → 62
  '5201054017418', // FAGE Total 0% — yaourt SANS packagings[] → 100
];

interface Row {
  category: string;
  code: string;
  name: string;
  brand: string;
  /** `nova_group` BRUT du payload OFF (avant toute coercion pipeline). */
  novaRaw: number | null;
  novaWasString: boolean;
  hasPackagings: boolean;
  /** Note affichée par l'app = composite score_final. */
  score: number;
  formulation: number;
  /** Malus emballage réellement appliqué (formulation − note). */
  malus: number;
  /** Malus brut avant plafond/amortissement. */
  malusRaw: number;
  atCap: boolean;
  sugarsMissing: boolean;
  satFatMissing: boolean;
  saltMissing: boolean;
  ingredientsMissing: boolean;
  /** `serving_size` brut OFF (texte libre contributeur). */
  servingRaw: string | null;
  /** `portion_grams` réellement utilisé par le moteur (défaut 100). */
  portion: number;
  composite: CompositeScoringResult;
}

function mean(xs: number[]): number {
  if (xs.length === 0) return NaN;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function median(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  const lo = s[mid - 1] ?? NaN;
  const hi = s[mid] ?? NaN;
  return s.length % 2 === 0 ? (lo + hi) / 2 : hi;
}

function stdev(xs: number[]): number {
  if (xs.length < 2) return NaN;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) * (x - m))));
}

/** 10 tranches de 10 pts ; 100 tombe dans la tranche 90-100. */
function histogram(xs: number[]): number[] {
  const buckets = new Array<number>(10).fill(0);
  for (const x of xs) {
    const idx = Math.min(9, Math.max(0, Math.floor(x / 10)));
    buckets[idx] = (buckets[idx] ?? 0) + 1;
  }
  return buckets;
}

function fmt(n: number, digits = 1): string {
  return Number.isNaN(n) ? 'n/a' : n.toFixed(digits);
}

function pct(part: number, total: number): string {
  return total === 0 ? 'n/a' : `${((100 * part) / total).toFixed(1)}%`;
}

function printHistogram(title: string, xs: number[], out: (s: string) => void): void {
  const h = histogram(xs);
  out(`${title} (n=${xs.length})\n`);
  for (let i = 0; i < 10; i += 1) {
    const lo = i * 10;
    const hi = i === 9 ? 100 : i * 10 + 9;
    const n = h[i] ?? 0;
    const bar = '#'.repeat(n);
    out(`  [${String(lo).padStart(2)}-${String(hi).padEnd(3)}] ${String(n).padStart(3)} ${bar}\n`);
  }
  out(
    `  moyenne=${fmt(mean(xs), 2)} mediane=${fmt(median(xs), 1)} ecart-type=${fmt(stdev(xs), 2)}\n`,
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function rowLine(r: Row): string {
  const flags: string[] = [];
  if (!r.hasPackagings) flags.push('SANS-PACK');
  if (r.atCap) flags.push('PLAFOND');
  if (r.novaRaw === null) flags.push('NOVA-ABSENT→4');
  if (r.sugarsMissing) flags.push('SUCRES-ABS');
  if (r.ingredientsMissing) flags.push('INGR-ABS');
  return (
    `${String(r.score).padStart(3)} (form ${String(r.formulation).padStart(3)}, ` +
    `malus ${String(r.malus).padStart(2)}) nova=${r.novaRaw ?? '∅'} ` +
    `[${r.category}] ${truncate(r.name || '(sans nom)', 38)} — ` +
    `${truncate(r.brand || '(sans marque)', 22)}` +
    (flags.length > 0 ? `  «${flags.join(',')}»` : '')
  );
}

interface InversionPair {
  category: string;
  nova4: Row;
  nova12: Row;
  gap: number;
  cause: string;
}

function diagnoseInversion(p4: Row, p12: Row): string {
  const causes: string[] = [];
  if (p12.malus > 0 && p4.malus === 0) {
    causes.push(
      p4.hasPackagings
        ? 'NOVA4 emballage détecté mais malus nul'
        : 'NOVA4 SANS packagings[] → aucun malus',
    );
  }
  if (p4.malus > 0 && p12.malus > p4.malus) {
    causes.push(`malus NOVA1-2 (${p12.malus}) > malus NOVA4 (${p4.malus})`);
  }
  if (p4.formulation > p12.formulation) {
    const details: string[] = [];
    if (p4.sugarsMissing) details.push('sucres absents→0');
    if (p4.satFatMissing) details.push('AGS absents→0');
    if (p4.saltMissing) details.push('sel absent→0');
    if (p12.novaRaw === null) details.push('NOVA absent sur le 1-2 (défaut 4)');
    causes.push(
      `formulation NOVA4 (${p4.formulation}) > NOVA1-2 (${p12.formulation})` +
        (details.length > 0 ? ` [${details.join(', ')}]` : ''),
    );
  }
  return causes.length > 0 ? causes.join(' + ') : 'cause non classée';
}

describe('AUDIT AGENT 4 — distribution réelle du scoring (échantillon OFF ~300)', () => {
  it('rejoue le pipeline de production et imprime les distributions (a) et (b)', () => {
    if (!fs.existsSync(SCRATCH_DIR)) {
      process.stdout.write(
        `\n[AUDIT] Scratchpad absent: ${SCRATCH_DIR}\n` +
          '[AUDIT] Le TEMPS 1 (curl) n’a pas été rejoué dans cette session — runner sauté.\n',
      );
      return;
    }

    const out = (s: string): void => {
      process.stdout.write(s);
    };

    const rows: Row[] = [];
    let skippedNoCode = 0;
    let novaStringCount = 0;

    for (const [category, file] of CATEGORY_FILES) {
      const fullPath = path.join(SCRATCH_DIR, file);
      if (!fs.existsSync(fullPath)) {
        out(`[AUDIT] Fichier manquant, catégorie ignorée: ${file}\n`);
        continue;
      }
      const payload = JSON.parse(fs.readFileSync(fullPath, 'utf8')) as {
        products?: unknown[];
      };
      const products = Array.isArray(payload.products) ? payload.products : [];

      for (const raw of products) {
        if (!raw || typeof raw !== 'object') continue;
        const off = raw as OFFProduct;
        if (typeof off.code !== 'string' || off.code.length === 0) {
          skippedNoCode += 1;
          continue;
        }

        // ── PIPELINE DE PRODUCTION, à l'identique ──────────────────────────
        const product = normalizeOFFProduct(off);
        const input = productToScoringInput(product);
        const formulationResult = calculateScore(input, PROFILE);
        const composite = composeScore(formulationResult, product.packaging_components);
        // ───────────────────────────────────────────────────────────────────

        const rawRecord = raw as Record<string, unknown>;
        const novaRawValue = rawRecord['nova_group'];
        let novaRaw: number | null = null;
        let novaWasString = false;
        if (typeof novaRawValue === 'number' && Number.isFinite(novaRawValue)) {
          novaRaw = novaRawValue;
        } else if (typeof novaRawValue === 'string' && novaRawValue.trim() !== '') {
          const coerced = Number(novaRawValue);
          if (Number.isFinite(coerced)) {
            novaRaw = coerced;
            novaWasString = true;
            novaStringCount += 1;
          }
        }

        const nutriments = off.nutriments ?? {};
        rows.push({
          category,
          code: off.code,
          name: off.product_name ?? '',
          brand: off.brands ?? '',
          novaRaw,
          novaWasString,
          hasPackagings: composite.hasPackagingData,
          score: composite.score_final,
          formulation: composite.formulationScore,
          malus: composite.packagingPenalty,
          malusRaw: composite.packagingPenaltyRaw,
          atCap: composite.packagingPenaltyRaw >= MAX_PACKAGING_PENALTY,
          sugarsMissing: nutriments['sugars_100g'] === undefined,
          satFatMissing: nutriments['saturated-fat_100g'] === undefined,
          saltMissing: nutriments['salt_100g'] === undefined,
          ingredientsMissing: !off.ingredients_text,
          servingRaw: off.serving_size ?? null,
          portion: input.portion_grams,
          composite,
        });
      }
    }

    // Dédoublonnage global par code-barres (un produit peut porter 2 catégories).
    const seen = new Set<string>();
    const global: Row[] = [];
    for (const r of rows) {
      if (seen.has(r.code)) continue;
      seen.add(r.code);
      global.push(r);
    }
    const duplicates = rows.length - global.length;

    const withPack = global.filter((r) => r.hasPackagings);
    const withMalus = global.filter((r) => r.malus > 0);
    const withMalusInB = withPack.filter((r) => r.malus > 0);
    const atCap = withPack.filter((r) => r.atCap);
    const novaDefaulted = global.filter((r) => r.novaRaw === null);

    out('\n================ AUDIT AGENT 4 — SORTIE BRUTE ================\n');
    out(
      `Echantillon: ${rows.length} lignes (${global.length} produits uniques, ${duplicates} doublons inter-categories, ${skippedNoCode} sans code ignores)\n`,
    );
    out(`nova_group arrive en string (coercion OFF connue): ${novaStringCount} produits\n\n`);

    // ── (a) Distribution telle que l'app l'affiche ────────────────────────
    printHistogram(
      '--- (a) NOTE AFFICHEE, tous produits (packagings absents → aucun malus)',
      global.map((r) => r.score),
      out,
    );
    out('\n');

    // ── (b) Restreinte aux produits AVEC packagings[] exploitables ────────
    printHistogram(
      '--- (b) NOTE AFFICHEE, restreinte aux produits AVEC packagings[] non vide',
      withPack.map((r) => r.score),
      out,
    );
    out('\n');

    // Référence: les SANS packagings, pour lire l'écart dans l'autre sens.
    printHistogram(
      '--- (ref) NOTE AFFICHEE, produits SANS packagings[]',
      global.filter((r) => !r.hasPackagings).map((r) => r.score),
      out,
    );
    out('\n');

    printHistogram(
      '--- (ref) FORMULATION seule, tous produits (avant malus emballage)',
      global.map((r) => r.formulation),
      out,
    );
    out('\n');

    out('--- COUVERTURE & MALUS ---\n');
    out(
      `packagings[] present non vide : ${withPack.length}/${global.length} (${pct(withPack.length, global.length)})\n`,
    );
    out(
      `malus applique > 0            : ${withMalus.length}/${global.length} (${pct(withMalus.length, global.length)}) — soit ${pct(withMalusInB.length, withPack.length)} des produits de (b)\n`,
    );
    out(
      `malus (parmi (b), tous)       : moyen=${fmt(mean(withPack.map((r) => r.malus)), 2)} median=${fmt(median(withPack.map((r) => r.malus)), 1)}\n`,
    );
    out(
      `malus (parmi (b), malus>0)    : moyen=${fmt(mean(withMalusInB.map((r) => r.malus)), 2)} median=${fmt(median(withMalusInB.map((r) => r.malus)), 1)}\n`,
    );
    out(
      `plafond atteint rawPoints>=${MAX_PACKAGING_PENALTY} : ${atCap.length}/${withPack.length} de (b) (${pct(atCap.length, withPack.length)})\n`,
    );
    out(
      `nova_group ABSENT → pipeline force NOVA 4 : ${novaDefaulted.length}/${global.length} (${pct(novaDefaulted.length, global.length)}) — note moyenne de ces produits: ${fmt(mean(novaDefaulted.map((r) => r.score)), 1)}\n`,
    );
    out(
      `ecart (a)−(b) : moyenne ${fmt(mean(global.map((r) => r.score)) - mean(withPack.map((r) => r.score)), 2)} pts · mediane ${fmt(median(global.map((r) => r.score)) - median(withPack.map((r) => r.score)), 1)} pts\n\n`,
    );

    out('--- PAR CATEGORIE (note affichee (a)) ---\n');
    for (const [category] of CATEGORY_FILES) {
      const cat = global.filter((r) => r.category === category);
      const catPack = cat.filter((r) => r.hasPackagings);
      out(
        `${category.padEnd(10)} n=${String(cat.length).padStart(3)} moy=${fmt(mean(cat.map((r) => r.score)), 1).padStart(5)} med=${fmt(median(cat.map((r) => r.score)), 1).padStart(5)} | packagings ${pct(catPack.length, cat.length).padStart(6)} | malus>0 ${pct(cat.filter((r) => r.malus > 0).length, cat.length).padStart(6)} | nova-absent ${String(cat.filter((r) => r.novaRaw === null).length).padStart(2)}\n`,
      );
    }
    out('\n');

    const sorted = [...global].sort((x, y) => y.score - x.score);
    out('--- TOP 15 (note affichee) ---\n');
    for (const r of sorted.slice(0, 15)) out(`${rowLine(r)}\n`);
    out('\n--- BOTTOM 15 (note affichee) ---\n');
    for (const r of sorted.slice(-15).reverse()) out(`${rowLine(r)}\n`);
    out('\n');

    // ── Le zéro est-il « réservé aux blockers » ? ─────────────────────────
    const zeros = global.filter((r) => r.score === 0);
    const zerosWithBlockers = zeros.filter((r) => r.composite.blockers.length > 0);
    const zerosWithoutBlockers = zeros.filter((r) => r.composite.blockers.length === 0);
    out('--- SCORE 0 : BLOCKERS OU ACCUMULATION ? ---\n');
    out(
      `score affiche == 0 : ${zeros.length}/${global.length} (${pct(zeros.length, global.length)})\n` +
        `  … dont AVEC additif bloquant : ${zerosWithBlockers.length} (${pct(zerosWithBlockers.length, zeros.length)})\n` +
        `  … dont SANS aucun blocker    : ${zerosWithoutBlockers.length} (${pct(zerosWithoutBlockers.length, zeros.length)}) — zero atteint par simple accumulation de penalites\n\n`,
    );

    // ── Portion : la base de calcul des macros depend de serving_size ─────
    out('--- BASE PORTION (serving_size texte libre → portion_grams) ---\n');
    const servingAbsent = global.filter((r) => r.servingRaw === null);
    const servingUnparsed = global.filter(
      (r) => r.servingRaw !== null && r.portion === 100 && !/100\s*(g|ml)/i.test(r.servingRaw),
    );
    const servingParsed = global.filter(
      (r) => r.servingRaw !== null && !servingUnparsed.includes(r),
    );
    const portions = servingParsed.map((r) => r.portion);
    out(
      `serving_size ABSENT → portion defaut 100 g : ${servingAbsent.length}/${global.length} (${pct(servingAbsent.length, global.length)})\n` +
        `serving_size PRESENT mais NON PARSE (ex. '1l', '33 cl') → defaut 100 g : ${servingUnparsed.length} (${pct(servingUnparsed.length, global.length)})\n` +
        `serving_size PARSE : ${servingParsed.length} (${pct(servingParsed.length, global.length)}) — portion min=${fmt(Math.min(...portions), 0)} max=${fmt(Math.max(...portions), 0)} mediane=${fmt(median(portions), 0)}\n`,
    );
    const unparsedExamples = servingUnparsed
      .slice(0, 8)
      .map((r) => `'${r.servingRaw ?? ''}'`)
      .join(' · ');
    out(`exemples non parses: ${unparsedExamples}\n\n`);

    // ── Où le biais packaging mord vraiment : formulation >= 50 ──────────
    out('--- BIAIS PACKAGING SUR LE HAUT DE L\'ECHELLE (formulation >= 50) ---\n');
    const top = global.filter((r) => r.formulation >= 50);
    const topPack = top.filter((r) => r.hasPackagings);
    const topNoPack = top.filter((r) => !r.hasPackagings);
    out(
      `n=${top.length} | avec packagings: ${topPack.length} (note moy=${fmt(mean(topPack.map((r) => r.score)), 1)}, med=${fmt(median(topPack.map((r) => r.score)), 1)}) | ` +
        `SANS packagings: ${topNoPack.length} (note moy=${fmt(mean(topNoPack.map((r) => r.score)), 1)}, med=${fmt(median(topNoPack.map((r) => r.score)), 1)})\n` +
        `avantage moyen du produit NON documente : ${fmt(mean(topNoPack.map((r) => r.score)) - mean(topPack.map((r) => r.score)), 1)} pts\n\n`,
    );

    // ── Les eaux sans nova_group : absence de donnee = NOVA 4 ─────────────
    out('--- EAUX AVEC nova_group ABSENT (pipeline force NOVA 4, plafond 30) ---\n');
    for (const r of global.filter((x) => x.category === 'eaux' && x.novaRaw === null)) {
      out(`${rowLine(r)}\n`);
    }
    out('\n');

    // ── Details des cas emblematiques ─────────────────────────────────────
    out('--- DETAILS PENALITES (cas emblematiques) ---\n');
    for (const code of DETAIL_BARCODES) {
      const r = global.find((x) => x.code === code);
      if (!r) {
        out(`${code}: absent de l'echantillon\n`);
        continue;
      }
      out(
        `\n▶ ${r.code} — ${truncate(r.name || '(sans nom)', 48)} — ${truncate(r.brand, 24)} [${r.category}]\n` +
          `  note=${r.score} formulation=${r.formulation} malus=${r.malus} (raw ${r.malusRaw}) nova_brut=${r.novaRaw ?? 'ABSENT'} nova_input=${r.composite.nova_group} ` +
          `serving=${r.servingRaw === null ? 'ABSENT' : `'${r.servingRaw}'`} → portion=${r.portion}g packagings=${r.hasPackagings ? 'oui' : 'NON'}\n`,
      );
      if (r.composite.blockers.length > 0) {
        out(`  BLOCKERS: ${r.composite.blockers.join(' | ')}\n`);
      }
      for (const p of r.composite.penalties) {
        out(`    ${p.category.padEnd(14)} ${String(Math.round(p.points * 10) / 10).padStart(6)} ${p.label}\n`);
      }
      for (const f of r.composite.factors) {
        out(`    factor:${f.kind.padEnd(11)} ${String(f.points).padStart(6)} ${f.label}${f.detail ? ` (${f.detail})` : ''}\n`);
      }
    }
    out('\n');

    // ── Inversions NOVA intra-catégorie ───────────────────────────────────
    out('--- INVERSIONS: NOVA 4 affiche AU-DESSUS de NOVA 1-2 (meme categorie, nova BRUT OFF) ---\n');
    const pairs: InversionPair[] = [];
    for (const [category] of CATEGORY_FILES) {
      const cat = global.filter((r) => r.category === category);
      const nova4 = cat.filter((r) => r.novaRaw === 4);
      const nova12 = cat.filter((r) => r.novaRaw === 1 || r.novaRaw === 2);
      for (const p4 of nova4) {
        for (const p12 of nova12) {
          if (p4.score > p12.score) {
            pairs.push({
              category,
              nova4: p4,
              nova12: p12,
              gap: p4.score - p12.score,
              cause: diagnoseInversion(p4, p12),
            });
          }
        }
      }
      const invCount = new Set(
        pairs.filter((p) => p.category === category).map((p) => p.nova4.code),
      ).size;
      out(
        `${category.padEnd(10)} nova4=${String(nova4.length).padStart(3)} nova1-2=${String(nova12.length).padStart(3)} paires_inversees=${String(pairs.filter((p) => p.category === category).length).padStart(4)} nova4_impliques=${invCount}\n`,
      );
    }
    pairs.sort((x, y) => y.gap - x.gap);
    out(`\nTotal paires inversees: ${pairs.length}\n`);
    out('Pires 12 paires (gap decroissant):\n');
    for (const p of pairs.slice(0, 12)) {
      out(
        `  gap=${String(p.gap).padStart(2)} [${p.category}]\n` +
          `    NOVA4  : ${String(p.nova4.score).padStart(3)} (form ${p.nova4.formulation}, malus ${p.nova4.malus}${p.nova4.hasPackagings ? '' : ', SANS-PACK'}) ${truncate(p.nova4.name || p.nova4.code, 44)} — ${truncate(p.nova4.brand, 20)}\n` +
          `    NOVA1-2: ${String(p.nova12.score).padStart(3)} (form ${p.nova12.formulation}, malus ${p.nova12.malus}${p.nova12.hasPackagings ? '' : ', SANS-PACK'}) ${truncate(p.nova12.name || p.nova12.code, 44)} — ${truncate(p.nova12.brand, 20)}\n` +
          `    cause  : ${p.cause}\n`,
      );
    }
    out('================ FIN SORTIE BRUTE ================\n\n');

    expect(global.length).toBeGreaterThan(0);
  });
});
