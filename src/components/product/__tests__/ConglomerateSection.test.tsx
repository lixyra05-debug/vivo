import { render, waitFor } from '@testing-library/react-native';
import { ConglomerateSection } from '../ConglomerateSection';
import {
  __resetConglomerateCacheForTests,
  type ConglomerateInfo,
} from '@/src/lib/api/conglomerate';

jest.mock('@/src/lib/api/conglomerate', () => {
  const actual = jest.requireActual('@/src/lib/api/conglomerate');
  return {
    ...actual,
    getConglomerateOwner: jest.fn(),
  };
});

import { getConglomerateOwner } from '@/src/lib/api/conglomerate';

describe('ConglomerateSection', () => {
  beforeEach(() => {
    __resetConglomerateCacheForTests();
    (getConglomerateOwner as jest.Mock).mockReset();
  });

  it('renvoie null quand brandName est vide ou whitespace', () => {
    const { toJSON: a } = render(<ConglomerateSection brandName={null} />);
    expect(a()).toBeNull();
    const { toJSON: b } = render(<ConglomerateSection brandName="" />);
    expect(b()).toBeNull();
    const { toJSON: c } = render(<ConglomerateSection brandName="   " />);
    expect(c()).toBeNull();
  });

  it("affiche un skeleton pendant la résolution Wikidata", () => {
    (getConglomerateOwner as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { getByText } = render(<ConglomerateSection brandName="Nutella" />);
    expect(getByText('Maison-mère')).toBeTruthy();
  });

  it("affiche owner + flag + lien Wikidata quand le owner est résolu", async () => {
    const info: ConglomerateInfo = {
      ownerName: 'Ferrero',
      ownerWikidataId: 'Q170480',
      countryCode: 'ITA',
      countryName: 'Italie',
    };
    (getConglomerateOwner as jest.Mock).mockResolvedValue(info);

    const { getByText, findByText } = render(
      <ConglomerateSection brandName="Nutella" />,
    );

    await waitFor(() => {
      expect(getByText('Ferrero')).toBeTruthy();
    });
    expect(getByText('Italie')).toBeTruthy();
    expect(getByText('Voir sur Wikidata')).toBeTruthy();
    // Drapeau italien rendu
    expect(await findByText('🇮🇹')).toBeTruthy();
  });

  it("retourne null quand getConglomerateOwner renvoie null (rien trouvé)", async () => {
    (getConglomerateOwner as jest.Mock).mockResolvedValue(null);

    const { queryByText, toJSON } = render(
      <ConglomerateSection brandName="Inconnue" />,
    );

    // État loading initial visible (skeleton avec titre)
    await waitFor(() => {
      expect(toJSON()).toBeNull();
    });
    expect(queryByText('Voir sur Wikidata')).toBeNull();
  });
});
