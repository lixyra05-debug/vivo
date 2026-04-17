import { dedupeByBarcode, type ScanHistoryRow } from '../useProductStore';

function row(barcode: string, scannedAt: string, isFavorite = false): ScanHistoryRow {
  return {
    id: `${barcode}-${scannedAt}`,
    user_id: 'u1',
    barcode,
    score_at_scan: 50,
    profile_used: 'standard',
    penalties_snapshot: null,
    is_favorite: isFavorite,
    scanned_at: scannedAt,
    product: null,
  };
}

describe('dedupeByBarcode', () => {
  it('garde seulement la première occurrence de chaque barcode', () => {
    const rows = [
      row('111', '2026-04-17T10:00:00Z'),
      row('222', '2026-04-17T09:00:00Z'),
      row('111', '2026-04-17T08:00:00Z'),
    ];
    const out = dedupeByBarcode(rows);
    expect(out).toHaveLength(2);
    expect(out[0].scanned_at).toBe('2026-04-17T10:00:00Z');
    expect(out[1].barcode).toBe('222');
  });

  it('retourne une liste vide pour une entrée vide', () => {
    expect(dedupeByBarcode([])).toEqual([]);
  });
});
