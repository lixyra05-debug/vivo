/**
 * useProtocol — hook React qui orchestre la progression d'un protocole 21j.
 *
 * Charge l'état actif + history depuis AsyncStorage au mount.
 * Expose les actions pour démarrer/compléter/abandonner.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  getActiveProtocol,
  startProtocol as startProtocolFn,
  completeDay as completeDayFn,
  abandonProtocol as abandonProtocolFn,
  getProtocolHistory,
  type ProtocolProgress,
} from './protocol-progress';
import { getProtocolById } from '../../data/protocols';
import { PLANT_ENCYCLOPEDIA, type PlantEntry } from '../../data/plant-encyclopedia';

export interface UseProtocolResult {
  activeProtocol: ProtocolProgress | null;
  /** 1..21 si actif, 0 sinon */
  todayDay: number;
  todayPlant: PlantEntry | null;
  todayRecipe: string | null;
  todayTip: string | null;
  /** Pas de jour de repos pour le MVP — toujours false */
  isRestDay: boolean;
  completeToday: (feeling: number) => Promise<void>;
  startProtocol: (protocolId: string) => Promise<void>;
  abandon: () => Promise<void>;
  history: ProtocolProgress[];
  isLoading: boolean;
}

function getPlantById(plantId: string): PlantEntry | null {
  return PLANT_ENCYCLOPEDIA.find((p) => p.id === plantId) ?? null;
}

export function useProtocol(): UseProtocolResult {
  const [activeProtocol, setActiveProtocol] =
    useState<ProtocolProgress | null>(null);
  const [history, setHistory] = useState<ProtocolProgress[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const reload = useCallback(async () => {
    const [active, hist] = await Promise.all([
      getActiveProtocol(),
      getProtocolHistory(),
    ]);
    setActiveProtocol(active);
    setHistory(hist);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    reload().catch(() => {
      if (cancelled) return;
      setActiveProtocol(null);
      setHistory([]);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const todayDay = activeProtocol?.currentDay ?? 0;

  const protocolDef = activeProtocol
    ? getProtocolById(activeProtocol.protocolId)
    : undefined;

  const todayProtocolDay =
    protocolDef && todayDay >= 1 && todayDay <= 21
      ? protocolDef.days[todayDay - 1]
      : null;

  const todayPlant = todayProtocolDay
    ? getPlantById(todayProtocolDay.plantId)
    : null;
  const todayRecipe = todayProtocolDay?.recipeFr ?? null;
  const todayTip = todayProtocolDay?.tipFr ?? null;

  const completeToday = useCallback(
    async (feeling: number) => {
      if (!activeProtocol || todayDay < 1 || todayDay > 21) return;
      await completeDayFn(todayDay, feeling);
      await reload();
    },
    [activeProtocol, todayDay, reload],
  );

  const startProtocol = useCallback(
    async (protocolId: string) => {
      await startProtocolFn(protocolId);
      await reload();
    },
    [reload],
  );

  const abandon = useCallback(async () => {
    await abandonProtocolFn();
    await reload();
  }, [reload]);

  return {
    activeProtocol,
    todayDay,
    todayPlant,
    todayRecipe,
    todayTip,
    isRestDay: false,
    completeToday,
    startProtocol,
    abandon,
    history,
    isLoading,
  };
}
