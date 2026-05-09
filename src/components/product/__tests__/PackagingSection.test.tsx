import { render } from '@testing-library/react-native';
import { PackagingSection } from '../PackagingSection';

describe('PackagingSection', () => {
  it('renvoie null quand packagingTags est vide ou ne matche rien', () => {
    const { toJSON: a } = render(<PackagingSection packagingTags={[]} />);
    expect(a()).toBeNull();
    const { toJSON: b } = render(<PackagingSection packagingTags={null} />);
    expect(b()).toBeNull();
    const { toJSON: c } = render(
      <PackagingSection packagingTags={['en:unknown-material-xyz']} />,
    );
    expect(c()).toBeNull();
  });

  it('affiche le matériau détecté avec son chip de risque et la liste des sources', () => {
    const { getByText } = render(
      <PackagingSection packagingTags={['en:pet-bottle']} />,
    );
    expect(getByText(/PET/)).toBeTruthy();
    expect(getByText('Risque modéré')).toBeTruthy();
    expect(getByText(/Sources :/)).toBeTruthy();
    expect(getByText('Recyclable')).toBeTruthy();
  });

  it('affiche un matériau à risque élevé (PVC) avec chip rouge', () => {
    const { getByText } = render(
      <PackagingSection packagingTags={['en:3-pvc']} />,
    );
    expect(getByText(/PVC/)).toBeTruthy();
    expect(getByText('Risque élevé')).toBeTruthy();
    expect(getByText('Non recyclable')).toBeTruthy();
  });
});
