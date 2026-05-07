import { render } from '@testing-library/react-native';
import { ProtocolCard } from '../ProtocolCard';
import { getProtocolById } from '@/src/data/protocols';
import type { ProtocolProgress } from '@/src/lib/protocols/protocol-progress';

describe('ProtocolCard', () => {
  it('rend le titre et l\'emoji du protocole sleep', () => {
    const protocol = getProtocolById('sleep');
    if (!protocol) throw new Error('Protocole sleep introuvable');

    const { getByText } = render(
      <ProtocolCard protocol={protocol} onPress={() => undefined} />,
    );

    expect(getByText('Sommeil Naturel')).toBeTruthy();
    expect(getByText('😴')).toBeTruthy();
  });

  it("affiche 'Jour 10/21' quand isActive=true et progress.currentDay=10", () => {
    const protocol = getProtocolById('sleep');
    if (!protocol) throw new Error('Protocole sleep introuvable');

    const progress: ProtocolProgress = {
      protocolId: 'sleep',
      startDate: new Date().toISOString(),
      currentDay: 10,
      completedDays: [1, 2, 3],
      feelings: { 1: 4, 2: 5, 3: 3 },
      status: 'active',
    };

    const { getByText } = render(
      <ProtocolCard
        protocol={protocol}
        isActive
        progress={progress}
        onPress={() => undefined}
      />,
    );

    expect(getByText('Jour 10/21')).toBeTruthy();
  });
});
