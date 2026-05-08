/**
 * useOcrSessionStore — store volatile in-memory pour la session OCR.
 *
 * Sert à transiter le base64 + le résultat d'analyse entre les écrans
 * `/ocr/analyzing` et `/ocr/result`. Volontairement NON persistant
 * (pas d'AsyncStorage) pour éviter de stocker une image lourde
 * inutilement et garantir un flush au redémarrage de l'app.
 */

import { create } from 'zustand';
import type { OcrAnalysisResult } from '@/src/types/ocr-analysis';

interface OcrSessionState {
  imageBase64: string | null;
  mimeType: string | null;
  result: OcrAnalysisResult | null;
  setImage: (imageBase64: string, mimeType: string) => void;
  setResult: (result: OcrAnalysisResult) => void;
  clear: () => void;
}

export const useOcrSessionStore = create<OcrSessionState>((set) => ({
  imageBase64: null,
  mimeType: null,
  result: null,
  setImage: (imageBase64, mimeType) => set({ imageBase64, mimeType, result: null }),
  setResult: (result) => set({ result }),
  clear: () => set({ imageBase64: null, mimeType: null, result: null }),
}));
