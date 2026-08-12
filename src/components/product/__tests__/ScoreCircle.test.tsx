import { render } from '@testing-library/react-native';
import { ScoreCircle, SCORE_LABEL_DEFAULT } from '../ScoreCircle';

/**
 * Le contenu du cercle (nombre, « / 100 », libellé) est marqué
 * `accessibilityElementsHidden` : le conteneur porte déjà une phrase complète,
 * et un lecteur d'écran lirait sinon deux fois la même information. D'où
 * `includeHiddenElements` pour vérifier le rendu VISUEL.
 */
const VISIBLE = { includeHiddenElements: true } as const;

describe('ScoreCircle', () => {
  it('nomme ce que le score mesure', () => {
    // Sans libellé, « 100 / 100 » se lit comme un verdict sur le produit
    // entier — y compris quand la section emballage affiche un risque juste
    // en dessous.
    const { getByText } = render(<ScoreCircle score={100} />);
    expect(getByText(SCORE_LABEL_DEFAULT, VISIBLE)).toBeTruthy();
  });

  it('accepte un libellé explicite, sans le rendre obligatoire', () => {
    const { getByText, queryByText } = render(
      <ScoreCircle score={42} label="Qualité de la formule" />,
    );
    expect(getByText('Qualité de la formule', VISIBLE)).toBeTruthy();
    expect(queryByText(SCORE_LABEL_DEFAULT, VISIBLE)).toBeNull();
  });

  it("n'annonce pas le libellé deux fois au lecteur d'écran", () => {
    const { getByText } = render(<ScoreCircle score={100} />);
    expect(
      getByText(SCORE_LABEL_DEFAULT, VISIBLE).props.accessibilityElementsHidden,
    ).toBe(true);
  });

  it("annonce à l'oral le verdict affiché à l'écran", () => {
    // La table locale disait « Bon » à partir de 70 sans palier à 90 : un 95
    // s'annonçait « Bon » pendant que la fiche affichait « Excellent ».
    const { getByLabelText } = render(<ScoreCircle score={95} />);
    expect(
      getByLabelText(`${SCORE_LABEL_DEFAULT} : 95 sur 100. Excellent.`),
    ).toBeTruthy();
  });

  it('annonce « À éviter » en bas d’échelle, et non « Danger »', () => {
    const { getByLabelText } = render(<ScoreCircle score={10} />);
    expect(getByLabelText(/À éviter\.$/)).toBeTruthy();
  });

  it('clampe et arrondit le score annoncé', () => {
    const { getByLabelText } = render(<ScoreCircle score={132} />);
    expect(getByLabelText(/: 100 sur 100/)).toBeTruthy();
  });
});
