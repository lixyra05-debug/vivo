import { submitProductReport } from '../reports';
import { supabase } from '../supabase';

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('reports', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("retourne 'Code-barres requis' si barcode vide", async () => {
    const res = await submitProductReport({
      barcode: '',
      userId: 'user-123',
      reportType: 'wrong_name',
    });
    expect(res).toEqual({ ok: false, error: 'Code-barres requis' });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("retourne 'Description requise' si type='other' sans description", async () => {
    const res = await submitProductReport({
      barcode: '3017620422003',
      userId: 'user-123',
      reportType: 'other',
      description: '   ',
    });
    expect(res).toEqual({ ok: false, error: 'Description requise' });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('insère le signalement dans Supabase et retourne ok=true sur succès', async () => {
    const insertMock = jest.fn().mockResolvedValue({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert: insertMock });

    const res = await submitProductReport({
      barcode: '3017620422003',
      userId: 'user-123',
      reportType: 'wrong_ingredients',
      description: 'Manque le sel',
    });

    expect(supabase.from).toHaveBeenCalledWith('product_reports');
    expect(insertMock).toHaveBeenCalledTimes(1);
    const payload = insertMock.mock.calls[0][0];
    expect(payload).toMatchObject({
      barcode: '3017620422003',
      user_id: 'user-123',
      report_type: 'wrong_ingredients',
      description: 'Manque le sel',
      photo_url: null,
    });
    expect(res).toEqual({ ok: true, error: null });
  });
});
