import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getActiveProtocol,
  startProtocol,
  completeDay,
  abandonProtocol,
  getProtocolHistory,
} from '../protocol-progress';

describe('protocol-progress — gestion AsyncStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("startProtocol('sleep') crée un protocole avec status='active'", async () => {
    const progress = await startProtocol('sleep');

    expect(progress.protocolId).toBe('sleep');
    expect(progress.status).toBe('active');
    expect(progress.currentDay).toBe(1);
    expect(progress.completedDays).toEqual([]);
    expect(progress.feelings).toEqual({});
    expect(typeof progress.startDate).toBe('string');
    expect(() => new Date(progress.startDate)).not.toThrow();

    const active = await getActiveProtocol();
    expect(active).not.toBeNull();
    expect(active?.protocolId).toBe('sleep');
  });

  it('completeDay(1, 4) ajoute 1 à completedDays + feelings[1]=4', async () => {
    await startProtocol('sleep');
    const updated = await completeDay(1, 4);

    expect(updated.completedDays).toEqual([1]);
    expect(updated.feelings[1]).toBe(4);
    expect(updated.status).toBe('active');

    const reread = await getActiveProtocol();
    expect(reread?.completedDays).toEqual([1]);
    expect(reread?.feelings[1]).toBe(4);
  });

  it('completeDay(1, 5) sur jour déjà complété → no duplicate, feeling mis à jour', async () => {
    await startProtocol('sleep');
    await completeDay(1, 4);
    const updated = await completeDay(1, 5);

    expect(updated.completedDays).toEqual([1]);
    expect(updated.completedDays.length).toBe(1);
    expect(updated.feelings[1]).toBe(5);
  });

  it("compléter 21 jours → status='completed' + active clear + history.length === 1", async () => {
    await startProtocol('sleep');
    for (let day = 1; day <= 21; day += 1) {
      await completeDay(day, 4);
    }

    const active = await getActiveProtocol();
    expect(active).toBeNull();

    const history = await getProtocolHistory();
    expect(history.length).toBe(1);
    expect(history[0].status).toBe('completed');
    expect(history[0].completedDays.length).toBe(21);
    expect(history[0].protocolId).toBe('sleep');
  });

  it("startProtocol('sleep') puis startProtocol('digestion') → ancien sleep en history avec status='abandoned'", async () => {
    await startProtocol('sleep');
    await completeDay(1, 3);
    await startProtocol('digestion');

    const active = await getActiveProtocol();
    expect(active).not.toBeNull();
    expect(active?.protocolId).toBe('digestion');

    const history = await getProtocolHistory();
    expect(history.length).toBe(1);
    expect(history[0].protocolId).toBe('sleep');
    expect(history[0].status).toBe('abandoned');
  });

  it('abandonProtocol vide active et push en history', async () => {
    await startProtocol('sleep');
    await completeDay(1, 3);
    await abandonProtocol();

    const active = await getActiveProtocol();
    expect(active).toBeNull();

    const history = await getProtocolHistory();
    expect(history.length).toBe(1);
    expect(history[0].status).toBe('abandoned');
  });
});
