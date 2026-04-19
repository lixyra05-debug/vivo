import { formatFirstName, formatGreetingSubtitle, formatStats } from '../formatters';

describe('formatFirstName', () => {
  it('extrait le prénom depuis un display_name complet', () => {
    expect(formatFirstName('Hector Martin')).toBe('Hector');
  });

  it('capitalise la première lettre', () => {
    expect(formatFirstName('hector')).toBe('Hector');
  });

  it('retombe sur le prefix email si display_name vide', () => {
    expect(formatFirstName(null, 'sophie.lopez@example.com')).toBe('Sophie.lopez');
  });

  it('retombe sur "toi" quand rien n\'est fourni', () => {
    expect(formatFirstName()).toBe('toi');
    expect(formatFirstName('   ', null)).toBe('toi');
  });

  it('gère les display_name avec espaces superflus', () => {
    expect(formatFirstName('   Léa   Dupont   ')).toBe('Léa');
  });
});

describe('formatStats', () => {
  it('retourne des zéros formatés si stats absent', () => {
    expect(formatStats()).toEqual({ scans: '0', average: '—', bad: '0' });
    expect(formatStats(null)).toEqual({ scans: '0', average: '—', bad: '0' });
  });

  it('affiche le score moyen si des scans existent', () => {
    const display = formatStats({ total: 12, unique: 9, avg: 68, bad: 3 });
    expect(display).toEqual({ scans: '12', average: '68', bad: '3' });
  });

  it('remplace le score moyen par un tiret quand aucun scan', () => {
    const display = formatStats({ total: 0, unique: 0, avg: 0, bad: 0 });
    expect(display.average).toBe('—');
  });
});

describe('formatGreetingSubtitle', () => {
  it('invite au premier scan quand total = 0', () => {
    expect(formatGreetingSubtitle(0)).toMatch(/premier/);
  });

  it('encourage sur les premiers scans', () => {
    expect(formatGreetingSubtitle(3)).toMatch(/lancée/);
  });

  it('change de ton après 5 scans', () => {
    expect(formatGreetingSubtitle(10)).toMatch(/élan/);
  });

  it('message standard après 25 scans', () => {
    expect(formatGreetingSubtitle(30)).toMatch(/Prêt/);
  });
});
