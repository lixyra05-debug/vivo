/**
 * Export PDF — Rapport santé Vivo (Mode Premium).
 *
 * `generateHealthReportHtml` est pure et testable. `exportHealthReportPdf`
 * orchestre `expo-print` + `expo-sharing` (lazy-require pour rester hors
 * du scope unitaire et compatible web).
 *
 * R5 strict : aucune allégation thérapeutique dans le HTML.
 * R8 : aucun PII utilisateur loggé (le HTML reste local au device).
 */

import type { BadgeDef } from '@/src/lib/gamification/types';

// ─── Types publics ──────────────────────────────────────────────────────────

export interface HealthReportSection {
  totalScans: number;
  averageScore: number;
  productsAvoided: number;
  excellentProducts: number;
}

export interface HealthReportProduct {
  name: string | null;
  brand: string | null;
  score: number;
  scannedAt: string;
}

export interface HealthReportData {
  userName: string | null;
  generatedAt: Date;
  periodLabel: string; // ex: "Du 5 avril au 5 mai 2026"
  stats: HealthReportSection;
  topScanned: HealthReportProduct[]; // max 5
  topAvoid: HealthReportProduct[]; // max 5
  badgesUnlocked: BadgeDef[];
}

// ─── Couleurs Vivo ──────────────────────────────────────────────────────────

const COLOR_SAGE = '#8BAD8B';
const COLOR_CREAM = '#FAFAF7';
const COLOR_EARTH = '#C4A882';
const COLOR_TEXT = '#2B3E2B';
const COLOR_GREEN = '#4CAF50';
const COLOR_ORANGE = '#FF9800';
const COLOR_RED = '#F44336';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Échappe les caractères HTML dangereux pour empêcher l'injection. */
function escapeHtml(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Couleur du score selon les seuils Vivo. */
function scoreColor(score: number): string {
  if (score >= 70) return COLOR_GREEN;
  if (score >= 50) return COLOR_ORANGE;
  return COLOR_RED;
}

/** Format français de la date "généré le 7 mai 2026 à 10:00". */
function formatGeneratedAt(date: Date): string {
  const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  });
  const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
  return `${dateFormatter.format(date)} à ${timeFormatter.format(date)}`;
}

/** Rend une ligne produit "nom — marque" avec score coloré. */
function renderProductRow(p: HealthReportProduct): string {
  const label = [p.name, p.brand].filter(Boolean).map((s) => escapeHtml(s)).join(' — ');
  const safeLabel = label.length > 0 ? label : 'Produit sans nom';
  return `
    <tr>
      <td class="product-name">${safeLabel}</td>
      <td class="product-score" style="color: ${scoreColor(p.score)};">${p.score}/100</td>
    </tr>`;
}

// ─── Génération HTML ────────────────────────────────────────────────────────

/**
 * Génère le HTML inline du rapport santé.
 * Pure : pas d'I/O, pas de lazy-require — testable.
 */
export function generateHealthReportHtml(data: HealthReportData): string {
  const userName = data.userName ?? 'Mon profil';
  const generatedAtStr = formatGeneratedAt(data.generatedAt);

  const topScannedRows = data.topScanned
    .slice(0, 5)
    .map(renderProductRow)
    .join('');
  const topScannedSection =
    data.topScanned.length === 0
      ? '<p class="empty">Aucun scan sur la période</p>'
      : `<table class="products-table">${topScannedRows}</table>`;

  const topAvoidRows = data.topAvoid
    .slice(0, 5)
    .map(renderProductRow)
    .join('');
  const topAvoidSection =
    data.topAvoid.length === 0
      ? '<p class="empty">Aucun produit à éviter détecté ✅</p>'
      : `<table class="products-table">${topAvoidRows}</table>`;

  const badgesHtml = data.badgesUnlocked
    .map(
      (b) => `
      <div class="badge">
        <span class="badge-emoji">${escapeHtml(b.emoji)}</span>
        <div class="badge-text">
          <div class="badge-name">${escapeHtml(b.nameFr)}</div>
          <div class="badge-desc">${escapeHtml(b.descriptionFr)}</div>
        </div>
      </div>`,
    )
    .join('');
  const badgesSection =
    data.badgesUnlocked.length === 0
      ? '<p class="empty">Continue de scanner pour débloquer des badges</p>'
      : `<div class="badges-list">${badgesHtml}</div>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Rapport santé Vivo</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: Helvetica, Arial, sans-serif;
    color: ${COLOR_TEXT};
    background: ${COLOR_CREAM};
    margin: 0;
    padding: 24px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  h1 {
    color: ${COLOR_SAGE};
    font-size: 28px;
    margin: 0 0 4px 0;
  }
  h2 {
    color: ${COLOR_SAGE};
    font-size: 18px;
    margin: 24px 0 12px 0;
    border-bottom: 2px solid ${COLOR_SAGE};
    padding-bottom: 4px;
  }
  .subtitle {
    color: ${COLOR_EARTH};
    font-size: 14px;
    margin-bottom: 16px;
  }
  section { margin-bottom: 16px; }
  #stats { display: flex; flex-wrap: wrap; gap: 12px; }
  .kpi {
    flex: 1 1 calc(50% - 12px);
    background: white;
    border-left: 4px solid ${COLOR_SAGE};
    padding: 12px 16px;
    border-radius: 8px;
  }
  .kpi-value {
    font-size: 24px;
    font-weight: bold;
    color: ${COLOR_SAGE};
  }
  .kpi-label { font-size: 12px; color: ${COLOR_TEXT}; }
  .products-table {
    width: 100%;
    border-collapse: collapse;
  }
  .products-table td {
    padding: 8px 4px;
    border-bottom: 1px solid #E5E5DD;
  }
  .product-name { font-size: 13px; }
  .product-score { font-size: 13px; font-weight: bold; text-align: right; white-space: nowrap; }
  .empty {
    font-size: 13px;
    color: ${COLOR_EARTH};
    font-style: italic;
    padding: 8px 0;
  }
  .badges-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .badge {
    display: flex;
    align-items: center;
    gap: 8px;
    background: white;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid ${COLOR_SAGE};
  }
  .badge-emoji { font-size: 20px; }
  .badge-name { font-size: 13px; font-weight: bold; color: ${COLOR_TEXT}; }
  .badge-desc { font-size: 11px; color: ${COLOR_EARTH}; }
  footer {
    margin-top: 32px;
    padding-top: 12px;
    border-top: 1px solid ${COLOR_EARTH};
    font-size: 11px;
    color: ${COLOR_EARTH};
    text-align: center;
  }
</style>
</head>
<body>
  <h1>Rapport santé Vivo</h1>
  <div class="subtitle">${escapeHtml(userName)}</div>

  <section id="period">${escapeHtml(data.periodLabel)}</section>

  <section id="stats">
    <div class="kpi">
      <div class="kpi-value">${data.stats.totalScans}</div>
      <div class="kpi-label">Produits scannés</div>
    </div>
    <div class="kpi">
      <div class="kpi-value">${data.stats.averageScore}</div>
      <div class="kpi-label">Score moyen</div>
    </div>
    <div class="kpi">
      <div class="kpi-value">${data.stats.productsAvoided}</div>
      <div class="kpi-label">Produits évités</div>
    </div>
    <div class="kpi">
      <div class="kpi-value">${data.stats.excellentProducts}</div>
      <div class="kpi-label">Produits excellents</div>
    </div>
  </section>

  <section id="top-scanned">
    <h2>Top 5 produits scannés</h2>
    ${topScannedSection}
  </section>

  <section id="top-avoid">
    <h2>Top 5 produits à éviter</h2>
    ${topAvoidSection}
  </section>

  <section id="badges">
    <h2>Badges débloqués</h2>
    ${badgesSection}
  </section>

  <footer>
    Rapport généré le ${escapeHtml(generatedAtStr)} · Vivo
  </footer>
</body>
</html>`;
}

// ─── Orchestration native (lazy-require, hors scope unitaire) ───────────────

interface PrintModule {
  printToFileAsync(opts: { html: string; base64?: boolean }): Promise<{ uri: string }>;
}

interface SharingModule {
  isAvailableAsync(): Promise<boolean>;
  shareAsync(
    uri: string,
    opts?: { mimeType?: string; dialogTitle?: string },
  ): Promise<void>;
}

/**
 * Génère le PDF via `expo-print` puis ouvre le sheet de partage natif.
 * Lazy-require pour ne pas alourdir le bundle web et rester testable.
 *
 * Note : `expo-print` n'est pas une dépendance directe ici — l'app finale
 * (Mode Premium Export PDF) doit l'installer avant d'appeler cette fonction.
 * Si le module est absent au runtime, on lance une erreur explicite plutôt
 * que de planter silencieusement.
 */
export async function exportHealthReportPdf(data: HealthReportData): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const Print = require('expo-print') as PrintModule;
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const Sharing = require('expo-sharing') as SharingModule;

  const html = generateHealthReportHtml(data);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Rapport santé Vivo',
    });
  }
}
