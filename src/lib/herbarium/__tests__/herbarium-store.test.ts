import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addToHerbarium,
  getHerbarium,
  removeFromHerbarium,
} from '../herbarium-store';

describe('herbarium-store — gestion AsyncStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('addToHerbarium ajoute une entrée avec plantId et note', async () => {
    await addToHerbarium('chamomile', 'mon préféré');
    const entries = await getHerbarium();

    expect(entries.length).toBe(1);
    expect(entries[0].plantId).toBe('chamomile');
    expect(entries[0].note).toBe('mon préféré');
    expect(typeof entries[0].addedAt).toBe('string');
  });

  it('removeFromHerbarium retire bien la plante précédemment ajoutée', async () => {
    await addToHerbarium('chamomile');
    await removeFromHerbarium('chamomile');

    const entries = await getHerbarium();
    expect(entries).toEqual([]);
  });
});
