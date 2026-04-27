// Mock du client supabase AVANT import du module testé.
// Convention Jest : variables `mock*` peuvent traverser le scope du factory.
type SignUpInput = { email: string; password: string };
type AuthResponse = {
  data: {
    session: { access_token: string } | null;
    user: { id: string } | null;
  };
  error: Error | null;
};

const mockSignUp = jest.fn<Promise<AuthResponse>, [SignUpInput]>();
const mockUpsert = jest.fn<Promise<{ error: Error | null }>, [unknown, unknown?]>();
const mockFrom = jest.fn(() => ({ upsert: mockUpsert }));

jest.mock('../supabase', () => ({
  supabase: {
    auth: { signUp: mockSignUp },
    from: mockFrom,
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { CGU_VERSION, signUpWithEmail } = require('../auth') as typeof import('../auth');

describe('signUpWithEmail — consentement RGPD', () => {
  beforeEach(() => {
    mockSignUp.mockReset();
    mockUpsert.mockReset();
    mockFrom.mockClear();
    mockUpsert.mockResolvedValue({ error: null });
  });

  it('expose CGU_VERSION constant', () => {
    expect(CGU_VERSION).toBe('1.0');
  });

  it("propage l'inscription Supabase et retourne needsConfirmation=true sans session", async () => {
    mockSignUp.mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    });
    const result = await signUpWithEmail('test@vivo.fr', 'azerty12', {
      consentAt: '2026-04-27T10:00:00.000Z',
      cguVersion: '1.0',
    });
    expect(result).toEqual({ needsConfirmation: true });
    // Pas de session → pas d'upsert immédiat (sera fait au login).
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('persiste consent_at + cgu_version via user_profiles quand session immédiate', async () => {
    mockSignUp.mockResolvedValue({
      data: {
        session: { access_token: 'tok' },
        user: { id: 'user-123' },
      },
      error: null,
    });
    await signUpWithEmail('test@vivo.fr', 'azerty12', {
      consentAt: '2026-04-27T10:00:00.000Z',
      cguVersion: CGU_VERSION,
    });
    expect(mockFrom).toHaveBeenCalledWith('user_profiles');
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const payload = mockUpsert.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.id).toBe('user-123');
    expect(payload.consent_at).toBe('2026-04-27T10:00:00.000Z');
    expect(payload.cgu_version).toBe('1.0');
  });

  it("propage l'erreur Supabase auth.signUp", async () => {
    mockSignUp.mockResolvedValue({
      data: { session: null, user: null },
      error: new Error('email déjà utilisé'),
    });
    await expect(
      signUpWithEmail('dup@vivo.fr', 'azerty12', {
        consentAt: '2026-04-27T10:00:00.000Z',
        cguVersion: '1.0',
      }),
    ).rejects.toThrow('email déjà utilisé');
  });
});
