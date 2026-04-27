import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from '../ErrorBoundary';

function Boom(): null {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Évite le bruit dans la sortie : React logue l'erreur capturée par
    // l'ErrorBoundary, et componentDidCatch console.error volontairement.
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("affiche le fallback FR quand un enfant lève une erreur", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(getByText("Oups, une erreur s'est produite")).toBeTruthy();
    expect(getByText('Réessayer')).toBeTruthy();
  });

  it('rend les enfants normalement quand aucune erreur', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Contenu OK</Text>
      </ErrorBoundary>,
    );
    expect(getByText('Contenu OK')).toBeTruthy();
  });

  it('expose un bouton "Réessayer" actionnable', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    // Le bouton doit être rendu et cliquable sans throw.
    fireEvent.press(getByText('Réessayer'));
    // Après press, le boundary tente de re-rendre Boom et capture à nouveau
    // l'erreur — le fallback reste donc visible (comportement attendu en
    // prod : l'utilisateur quitte l'écran via la nav).
    expect(getByText("Oups, une erreur s'est produite")).toBeTruthy();
  });
});
