/**
 * Family store — tests CRUD pour les profils familiaux.
 *
 * Approche : on teste les fonctions internes (`fetchFamilyProfiles`,
 * `createFamilyProfile`, `deleteFamilyProfile`, `setActiveFamilyProfile`) qui
 * sont les queryFn / mutationFn des hooks React Query. Cela suffit à valider
 * la chaîne Supabase et le comportement attendu côté DB.
 *
 * Le trigger DB `enforce_single_active_family_profile` désactive automatiquement
 * les autres profils quand on update `is_active = true` — donc côté client on
 * fait juste un update minimal.
 */
import { supabase } from '../../api/supabase';
import {
  fetchFamilyProfiles,
  createFamilyProfile,
  deleteFamilyProfile,
  setActiveFamilyProfile,
  MAX_FAMILY_PROFILES,
  type FamilyProfile,
} from '../family-store';

jest.mock('../../api/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const sampleProfiles: FamilyProfile[] = [
  {
    id: 'p1',
    user_id: 'uid-1',
    name: 'Marie',
    avatar_emoji: '👩',
    age_group: 'adult',
    allergies: [],
    conditions: [],
    is_active: true,
    created_at: '2026-04-01T10:00:00Z',
    updated_at: '2026-04-01T10:00:00Z',
  },
  {
    id: 'p2',
    user_id: 'uid-1',
    name: 'Lucas',
    avatar_emoji: '🧒',
    age_group: 'child',
    allergies: ['peanuts'],
    conditions: [],
    is_active: false,
    created_at: '2026-04-02T10:00:00Z',
    updated_at: '2026-04-02T10:00:00Z',
  },
  {
    id: 'p3',
    user_id: 'uid-1',
    name: 'Bébé',
    avatar_emoji: '👶',
    age_group: 'baby',
    allergies: [],
    conditions: [],
    is_active: false,
    created_at: '2026-04-03T10:00:00Z',
    updated_at: '2026-04-03T10:00:00Z',
  },
];

describe('family-store', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('exporte la constante MAX_FAMILY_PROFILES = 4', () => {
    expect(MAX_FAMILY_PROFILES).toBe(4);
  });

  it('fetchFamilyProfiles renvoie la liste triée par created_at ascendant', async () => {
    const order = jest.fn().mockResolvedValue({ data: sampleProfiles, error: null });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const out = await fetchFamilyProfiles('uid-1');

    expect(supabase.from).toHaveBeenCalledWith('family_profiles');
    expect(select).toHaveBeenCalledWith('*');
    expect(eq).toHaveBeenCalledWith('user_id', 'uid-1');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: true });
    expect(out).toHaveLength(3);
    expect(out[0].id).toBe('p1');
  });

  it('fetchFamilyProfiles renvoie [] si userId null sans appeler Supabase', async () => {
    const out = await fetchFamilyProfiles(null);
    expect(out).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("createFamilyProfile insert avec user_id ajouté à l'input", async () => {
    const single = jest
      .fn()
      .mockResolvedValue({ data: sampleProfiles[0], error: null });
    const select = jest.fn().mockReturnValue({ single });
    const insert = jest.fn().mockReturnValue({ select });
    (supabase.from as jest.Mock).mockReturnValue({ insert });

    const created = await createFamilyProfile('uid-1', {
      name: 'Marie',
      avatar_emoji: '👩',
      age_group: 'adult',
    });

    expect(supabase.from).toHaveBeenCalledWith('family_profiles');
    expect(insert).toHaveBeenCalledTimes(1);
    const payload = (insert as jest.Mock).mock.calls[0][0];
    expect(payload).toMatchObject({
      user_id: 'uid-1',
      name: 'Marie',
      avatar_emoji: '👩',
      age_group: 'adult',
      allergies: [],
      conditions: [],
    });
    expect(created.id).toBe('p1');
  });

  it("deleteFamilyProfile fait .delete().eq('id', ...)", async () => {
    const eqId = jest.fn().mockResolvedValue({ data: null, error: null });
    const del = jest.fn().mockReturnValue({ eq: eqId });
    (supabase.from as jest.Mock).mockReturnValue({ delete: del });

    await deleteFamilyProfile('p2');

    expect(supabase.from).toHaveBeenCalledWith('family_profiles');
    expect(del).toHaveBeenCalledTimes(1);
    expect(eqId).toHaveBeenCalledWith('id', 'p2');
  });

  it('setActiveFamilyProfile update is_active=true sur le profil ciblé', async () => {
    const single = jest
      .fn()
      .mockResolvedValue({ data: sampleProfiles[1], error: null });
    const select = jest.fn().mockReturnValue({ single });
    const eqId = jest.fn().mockReturnValue({ select });
    const update = jest.fn().mockReturnValue({ eq: eqId });
    (supabase.from as jest.Mock).mockReturnValue({ update });

    const out = await setActiveFamilyProfile('p2');

    expect(supabase.from).toHaveBeenCalledWith('family_profiles');
    expect(update).toHaveBeenCalledTimes(1);
    const payload = (update as jest.Mock).mock.calls[0][0];
    expect(payload).toEqual({ is_active: true });
    expect(eqId).toHaveBeenCalledWith('id', 'p2');
    expect(out.id).toBe('p2');
  });
});
