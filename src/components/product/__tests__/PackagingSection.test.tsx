import { render } from '@testing-library/react-native';
import {
  PackagingSection,
  RECYCLABILITY_UNKNOWN_LABEL,
} from '../PackagingSection';

describe('PackagingSection', () => {
  it('renvoie null quand packagings est vide ou ne matche rien', () => {
    const { toJSON: a } = render(<PackagingSection packagings={[]} />);
    expect(a()).toBeNull();
    const { toJSON: b } = render(<PackagingSection packagings={null} />);
    expect(b()).toBeNull();
    const { toJSON: c } = render(
      <PackagingSection packagings={[{ material: 'en:unknown-material-xyz' }]} />,
    );
    expect(c()).toBeNull();
  });

  it("disparaît quand le produit n'a pas de packagings[] — pas de repli sur l'ancienne source", () => {
    // R6 : mieux vaut aucune section qu'une section fausse. Un produit dont
    // seuls les `packaging_tags` hérités existent n'affiche plus rien.
    const { toJSON } = render(<PackagingSection packagings={undefined} />);
    expect(toJSON()).toBeNull();
  });

  it('affiche le matériau détecté avec son chip de risque et la liste des sources', () => {
    const { getByText } = render(
      <PackagingSection
        packagings={[
          { material: 'en:pet-1-polyethylene-terephthalate', food_contact: 1 },
        ]}
      />,
    );
    expect(getByText(/PET/)).toBeTruthy();
    expect(getByText('Risque modéré')).toBeTruthy();
    expect(getByText(/Sources :/)).toBeTruthy();
    expect(getByText('Recyclable')).toBeTruthy();
  });

  it('affiche un matériau à risque élevé (PVC) avec chip rouge', () => {
    const { getByText } = render(
      <PackagingSection packagings={[{ material: 'en:3-pvc' }]} />,
    );
    expect(getByText(/PVC/)).toBeTruthy();
    expect(getByText('Risque élevé')).toBeTruthy();
    // PVC garde « Non recyclable » : son exclusion des filières est documentée,
    // ce n'est pas une absence de donnée.
    expect(getByText('Non recyclable')).toBeTruthy();
  });

  it("n'affirme pas « Non recyclable » quand la recyclabilité est inconnue", () => {
    // `en:plastic` = 42 % des matériaux observés. On ne sait pas quel polymère
    // c'est, donc on ne sait pas s'il se recycle.
    const { getByText, queryByText } = render(
      <PackagingSection packagings={[{ material: 'en:plastic' }]} />,
    );
    expect(getByText(/Plastique non spécifié/)).toBeTruthy();
    expect(getByText(RECYCLABILITY_UNKNOWN_LABEL)).toBeTruthy();
    expect(queryByText('Non recyclable')).toBeNull();
    expect(queryByText('Recyclable')).toBeNull();
  });
});
