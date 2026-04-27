import { render } from '@testing-library/react-native';
import { StoreLogo } from '../StoreLogo';

describe('StoreLogo', () => {
  it('affiche un Image accessible pour un slug mappé (carrefour)', () => {
    const { getByLabelText, queryByText } = render(
      <StoreLogo slug="carrefour" emoji="🟥" variant="card" />,
    );
    expect(getByLabelText('Logo carrefour')).toBeTruthy();
    expect(queryByText('🟥')).toBeNull();
  });

  it('utilise les 10 slugs Vivo (smoke test)', () => {
    const slugs = [
      'carrefour', 'leclerc', 'auchan', 'intermarche', 'picard',
      'monoprix', 'lidl', 'aldi', 'casino', 'franprix',
    ];
    for (const slug of slugs) {
      const { getByLabelText } = render(<StoreLogo slug={slug} emoji="🛒" />);
      expect(getByLabelText(`Logo ${slug}`)).toBeTruthy();
    }
  });

  it('fallback sur emoji pour un slug inconnu', () => {
    const { getByText, queryByLabelText } = render(
      <StoreLogo slug="inexistant" emoji="🛒" />,
    );
    expect(getByText('🛒')).toBeTruthy();
    expect(queryByLabelText(/Logo/)).toBeNull();
  });

  it('variant header utilise des dimensions plus grandes que card', () => {
    const card = render(<StoreLogo slug="carrefour" emoji="🟥" variant="card" testID="logo" />);
    const cardEl = card.getByTestId('logo');
    expect(cardEl.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: 80, height: 44 })]),
    );
    card.unmount();

    const header = render(<StoreLogo slug="carrefour" emoji="🟥" variant="header" testID="logo" />);
    const headerEl = header.getByTestId('logo');
    expect(headerEl.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: 96, height: 56 })]),
    );
  });
});
