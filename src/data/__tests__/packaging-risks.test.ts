import {
  PACKAGING_RISKS,
  detectPackagingRisk,
  type PackagingMaterial,
} from '../packaging-risks';

const SOURCE_ALLOWLIST_REGEX = /efsa|anses|echa|circ|iarc|oms|eur-lex|ansm/i;

describe('PACKAGING_RISKS — Catalogue', () => {
  it('contient unknown_plastic en dernière position (fallback)', () => {
    const last = PACKAGING_RISKS[PACKAGING_RISKS.length - 1];
    expect(last.id).toBe('unknown_plastic');
    expect(last.tagPatterns).toEqual([]);
  });

  it('tous les id sont uniques', () => {
    const ids = PACKAGING_RISKS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('garde-fou anti-source-tierce : toutes les sources matchent EFSA/ANSES/ECHA/CIRC/OMS/eur-lex/ANSM', () => {
    for (const material of PACKAGING_RISKS) {
      expect(material.sources.length).toBeGreaterThan(0);
      for (const source of material.sources) {
        expect(source).toMatch(SOURCE_ALLOWLIST_REGEX);
      }
    }
  });

  it('aucune source ne cite Gouget, Beauvillard, Clément, O\'Neill ou source non officielle', () => {
    const FORBIDDEN = /gouget|beauvillard|clément|clement|o'?neill/i;
    for (const material of PACKAGING_RISKS) {
      for (const source of material.sources) {
        expect(source).not.toMatch(FORBIDDEN);
      }
    }
  });
});

describe('detectPackagingRisk — Helper de matching', () => {
  it('matche le tag `en:pet-bottle` → PET', () => {
    const result = detectPackagingRisk(['en:pet-bottle']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('pet');
    expect(result[0].riskLevel).toBe('moderate');
  });

  it('fallback sur unknown_plastic quand le tag est plastique générique sans précision', () => {
    const result = detectPackagingRisk(['en:plastic', 'en:bottle']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('unknown_plastic');
    expect(result[0].riskLevel).toBe('moderate');
  });

  it('matche le tag `en:tetra-pak` → tetra_pak', () => {
    const result = detectPackagingRisk(['en:tetra-pak']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('tetra_pak');
  });

  it('renvoie un tableau vide pour un tableau vide ou non-array', () => {
    expect(detectPackagingRisk([])).toEqual([]);
    expect(detectPackagingRisk(null as unknown as string[])).toEqual([]);
    expect(detectPackagingRisk(undefined as unknown as string[])).toEqual([]);
  });

  it('matche plusieurs matériaux et trie par risque décroissant (moderate avant low)', () => {
    const result = detectPackagingRisk(['en:glass', 'en:metal-can']);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('metal_can');
    expect(result[0].riskLevel).toBe('moderate');
    expect(result[1].id).toBe('glass');
    expect(result[1].riskLevel).toBe('low');
  });

  it('gère les tags français accentués (préfixe fr: + accents stripés)', () => {
    const result = detectPackagingRisk(['fr:plastique-recycle']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('unknown_plastic');
  });

  it('déduplique les matériaux quand plusieurs tags pointent vers le même', () => {
    const result = detectPackagingRisk(['en:pet-bottle', 'en:polyethylene-terephthalate']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('pet');
  });

  it('matche PVC sur tag `en:3-pvc` → riskLevel high', () => {
    const result = detectPackagingRisk(['en:3-pvc']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('pvc');
    expect(result[0].riskLevel).toBe('high');
  });
});
