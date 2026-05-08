import { useOcrSessionStore } from '../useOcrSessionStore';
import type { OcrAnalysisResult } from '@/src/types/ocr-analysis';

const mockResult: OcrAnalysisResult = {
  score: 72,
  productType: 'food',
  ingredients: [
    { name: 'Sucre', riskLevel: 'caution', reason: 'À modérer' },
    { name: 'Eau', riskLevel: 'safe', reason: 'Neutre' },
  ],
  concerns: ['Trop de sucre ajouté'],
  positives: ['Liste courte'],
  summary: 'Produit acceptable mais sucré.',
};

beforeEach(() => {
  useOcrSessionStore.getState().clear();
});

describe('useOcrSessionStore', () => {
  it("a un état initial vide (imageBase64, mimeType, result tous null)", () => {
    const state = useOcrSessionStore.getState();
    expect(state.imageBase64).toBeNull();
    expect(state.mimeType).toBeNull();
    expect(state.result).toBeNull();
  });

  it('setImage met à jour imageBase64 + mimeType, et reset result à null', () => {
    useOcrSessionStore.getState().setResult(mockResult);
    useOcrSessionStore.getState().setImage('abc123', 'image/jpeg');
    const state = useOcrSessionStore.getState();
    expect(state.imageBase64).toBe('abc123');
    expect(state.mimeType).toBe('image/jpeg');
    expect(state.result).toBeNull();
  });

  it("setResult populate result et préserve l'image", () => {
    useOcrSessionStore.getState().setImage('xyz', 'image/png');
    useOcrSessionStore.getState().setResult(mockResult);
    const state = useOcrSessionStore.getState();
    expect(state.result).toEqual(mockResult);
    expect(state.imageBase64).toBe('xyz');
    expect(state.mimeType).toBe('image/png');
  });

  it('clear() remet tout à null', () => {
    useOcrSessionStore.getState().setImage('xyz', 'image/png');
    useOcrSessionStore.getState().setResult(mockResult);
    useOcrSessionStore.getState().clear();
    const state = useOcrSessionStore.getState();
    expect(state.imageBase64).toBeNull();
    expect(state.mimeType).toBeNull();
    expect(state.result).toBeNull();
  });
});
