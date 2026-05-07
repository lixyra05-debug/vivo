/**
 * Export PDF — tests du générateur HTML.
 *
 * On ne teste PAS `exportHealthReportPdf` (Native I/O via expo-print/expo-sharing).
 */
import { generateHealthReportHtml, type HealthReportData } from '../generate-pdf';

function makeData(overrides: Partial<HealthReportData> = {}): HealthReportData {
  return {
    userName: 'Marie',
    generatedAt: new Date('2026-05-07T10:00:00Z'),
    periodLabel: 'Du 5 avril au 5 mai 2026',
    stats: {
      totalScans: 42,
      averageScore: 67,
      productsAvoided: 8,
      excellentProducts: 12,
    },
    topScanned: [
      { name: 'Yaourt Bio', brand: 'Danone', score: 78, scannedAt: '2026-05-01T10:00:00Z' },
      { name: 'Pain de mie', brand: 'Harrys', score: 42, scannedAt: '2026-04-30T10:00:00Z' },
    ],
    topAvoid: [
      { name: 'Soda Cola', brand: 'Coca', score: 12, scannedAt: '2026-04-28T10:00:00Z' },
    ],
    badgesUnlocked: [
      {
        id: 'first_scan',
        nameFr: 'Premier scan',
        emoji: '🔍',
        descriptionFr: 'Effectue ton premier scan',
        category: 'milestone',
      },
    ],
    ...overrides,
  };
}

describe('generateHealthReportHtml', () => {
  it('inclut les 6 sections + nom user + KPI', () => {
    const html = generateHealthReportHtml(makeData());

    // Header
    expect(html).toMatch(/<h1>Rapport santé Vivo<\/h1>/);
    expect(html).toContain('Marie');

    // Sections
    expect(html).toMatch(/<section id="period">/);
    expect(html).toMatch(/<section id="stats">/);
    expect(html).toMatch(/<section id="top-scanned">/);
    expect(html).toMatch(/<section id="top-avoid">/);
    expect(html).toMatch(/<section id="badges">/);
    expect(html).toMatch(/<footer>/);

    // KPI
    expect(html).toContain('42'); // totalScans
    expect(html).toContain('67'); // averageScore
    expect(html).toContain('8'); // productsAvoided
    expect(html).toContain('12'); // excellentProducts

    // Période + footer
    expect(html).toContain('Du 5 avril au 5 mai 2026');
    expect(html).toContain('Vivo');
  });

  it('gère empty state (0 scans, 0 produits à éviter, 0 badges)', () => {
    const html = generateHealthReportHtml(
      makeData({
        topScanned: [],
        topAvoid: [],
        badgesUnlocked: [],
      }),
    );

    expect(html).toContain('Aucun scan sur la période');
    expect(html).toContain('Aucun produit à éviter détecté');
    expect(html).toContain('Continue de scanner pour débloquer des badges');
  });

  it("échappe les caractères HTML dangereux (XSS) dans le nom utilisateur", () => {
    const html = generateHealthReportHtml(
      makeData({ userName: '<script>alert("x")</script>' }),
    );
    // Pas de balise <script> non échappée
    expect(html).not.toContain('<script>alert');
    // Forme échappée présente
    expect(html).toContain('&lt;script&gt;');
  });
});
