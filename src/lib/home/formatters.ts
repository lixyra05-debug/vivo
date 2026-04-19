import type { UserStats } from '@/src/lib/stores/useProductStore';

export function formatFirstName(displayName?: string | null, emailFallback?: string | null): string {
  const trimmed = displayName?.trim();
  if (trimmed) {
    const first = trimmed.split(/\s+/)[0];
    if (first) return capitalize(first);
  }
  const prefix = emailFallback?.split('@')[0];
  if (prefix) return capitalize(prefix);
  return 'toi';
}

function capitalize(value: string): string {
  if (value.length === 0) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export interface HomeStatsDisplay {
  scans: string;
  average: string;
  bad: string;
}

export function formatStats(stats?: UserStats | null): HomeStatsDisplay {
  const total = stats?.total ?? 0;
  const avg = stats?.avg ?? 0;
  const bad = stats?.bad ?? 0;
  return {
    scans: total.toString(),
    average: total === 0 ? '—' : `${avg}`,
    bad: bad.toString(),
  };
}

export function formatGreetingSubtitle(total: number): string {
  if (total === 0) return 'Scanne ton premier produit pour démarrer.';
  if (total < 5) return 'Continue sur ta lancée, chaque scan compte.';
  if (total < 25) return 'Bel élan — analysons ton prochain produit.';
  return 'Prêt à scanner ton prochain produit ?';
}
