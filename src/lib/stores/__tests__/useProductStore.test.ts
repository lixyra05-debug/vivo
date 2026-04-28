import { dedupeByBarcode, buildScanInsertPayload, type ScanHistoryRow } from '../useProductStore';

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
    product_type: 'food',
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

describe('buildScanInsertPayload', () => {
  const baseInput = {
    barcode: '3017620422003',
    score: 75,
    profile: 'standard',
    penalties: [{ code: 'E102', points: 5 }],
  };

  it("inclut product_type='food' par défaut quand non fourni (rétrocompat)", () => {
    const payload = buildScanInsertPayload('user-123', baseInput);
    expect(payload).toMatchObject({
      user_id: 'user-123',
      barcode: '3017620422003',
      score_at_scan: 75,
      profile_used: 'standard',
      penalties_snapshot: [{ code: 'E102', points: 5 }],
      product_type: 'food',
    });
  });

  it("inclut product_type='cosmetic' quand productType='cosmetic'", () => {
    const payload = buildScanInsertPayload('user-123', {
      ...baseInput,
      productType: 'cosmetic',
    });
    expect(payload.product_type).toBe('cosmetic');
  });

  it("inclut product_type='food' quand productType='food' explicite", () => {
    const payload = buildScanInsertPayload('user-123', {
      ...baseInput,
      productType: 'food',
    });
    expect(payload.product_type).toBe('food');
  });
});
