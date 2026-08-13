import { render } from '@testing-library/react-native';
import {
  ScoreFactorsCard,
  SCORE_FACTORS_TITLE,
  SCORE_FACTORS_TOTAL_LABEL,
} from '../ScoreFactorsCard';
import { SCORE_LABEL_DEFAULT } from '../ScoreCircle';
import type { ScoreFactor } from '@/src/lib/scoring/composite-score';

/**
 * Les lignes de la carte sont marquées `accessibilityElementsHidden` : la
 * GlassCard porte déjà la décomposition en une phrase, et un lecteur d'écran
 * égrènerait sinon huit fragments de chiffres. D'où `includeHiddenElements`
 * pour vérifier le rendu VISUEL — même idiome que ScoreCircle.test.tsx.
 */
const VISIBLE = { includeHiddenElements: true } as const;

const FORMULATION: ScoreFactor = {
  kind: 'formulation',
  code: 'formulation',
  label: 'Formulation',
  points: 100,
};

const PET: ScoreFactor = {
  kind: 'packaging',
  code: 'pet',
  label: 'PET (Polyéthylène téréphtalate)',
  detail: 'risque modéré · au contact',
  points: -32,
};

const HDPE: ScoreFactor = {
  kind: 'packaging',
  code: 'hdpe',
  label: 'PEHD (Polyéthylène haute densité)',
  detail: 'risque faible · au contact',
  points: -6,
};

describe('ScoreFactorsCard', () => {
  it('énonce la formulation puis chaque emballage, signés', () => {
    const { getByText } = render(
      <ScoreFactorsCard factors={[FORMULATION, PET, HDPE]} finalScore={62} />,
    );

    expect(getByText(SCORE_FACTORS_TITLE, VISIBLE)).toBeTruthy();
    expect(getByText('Formulation', VISIBLE)).toBeTruthy();
    expect(getByText('+100', VISIBLE)).toBeTruthy();
    expect(getByText(/PET/, VISIBLE)).toBeTruthy();
    expect(getByText('−32', VISIBLE)).toBeTruthy();
    expect(getByText('−6', VISIBLE)).toBeTruthy();
    expect(getByText('62', VISIBLE)).toBeTruthy();
  });

  it('utilise un vrai signe moins, pas un trait d’union', () => {
    const { queryByText } = render(
      <ScoreFactorsCard factors={[FORMULATION, PET]} finalScore={68} />,
    );
    expect(queryByText('−32', VISIBLE)).toBeTruthy();
    expect(queryByText('-32', VISIBLE)).toBeNull();
  });

  it('qualifie chaque emballage par son risque et son contact', () => {
    const { getByText } = render(
      <ScoreFactorsCard factors={[FORMULATION, PET]} finalScore={68} />,
    );
    expect(getByText('risque modéré · au contact', VISIBLE)).toBeTruthy();
  });

  // Sans facteur emballage, la carte ne répéterait que le score affiché juste
  // au-dessus. Elle se masque plutôt que d'afficher une ligne fantôme.
  it('ne rend rien quand la formulation est le seul facteur', () => {
    const { toJSON } = render(
      <ScoreFactorsCard factors={[FORMULATION]} finalScore={100} />,
    );
    expect(toJSON()).toBeNull();
  });

  it('ne rend rien sans aucun facteur', () => {
    const { toJSON } = render(<ScoreFactorsCard factors={[]} finalScore={0} />);
    expect(toJSON()).toBeNull();
  });

  it('annonce la décomposition complète en une seule étiquette accessible', () => {
    const { getByLabelText } = render(
      <ScoreFactorsCard factors={[FORMULATION, PET, HDPE]} finalScore={62} />,
    );
    expect(
      getByLabelText(
        `${SCORE_FACTORS_TITLE}. Formulation, plus 100 points. ${PET.label}, moins 32 points. ${HDPE.label}, moins 6 points. ${SCORE_FACTORS_TOTAL_LABEL} 62 sur 100.`,
      ),
    ).toBeTruthy();
  });

  it('nomme le total comme l’anneau qui le surplombe', () => {
    // Deux libellés différents pour le même nombre, à 40 px d'écart, se
    // liraient comme deux mesures distinctes.
    expect(SCORE_FACTORS_TOTAL_LABEL).toBe(SCORE_LABEL_DEFAULT);

    const { getByText } = render(
      <ScoreFactorsCard factors={[FORMULATION, PET]} finalScore={68} />,
    );
    expect(getByText(SCORE_FACTORS_TOTAL_LABEL, VISIBLE)).toBeTruthy();
  });

  it('accorde le singulier sur un point isolé', () => {
    const { getByLabelText } = render(
      <ScoreFactorsCard
        factors={[FORMULATION, { ...PET, points: -1 }]}
        finalScore={99}
      />,
    );
    expect(getByLabelText(/moins 1 point\./)).toBeTruthy();
  });

  it('reste un constat, jamais une prescription', () => {
    // R5 : la fiche décrit ce qui compose la note. Elle ne dit jamais quoi faire.
    const PRESCRIPTIVE =
      /évite|évitez|préfère|préférez|choisis|choisissez|ne pas |il faut|déconseill|recommand/i;
    const { toJSON } = render(
      <ScoreFactorsCard factors={[FORMULATION, PET, HDPE]} finalScore={62} />,
    );
    expect(JSON.stringify(toJSON())).not.toMatch(PRESCRIPTIVE);
  });
});
