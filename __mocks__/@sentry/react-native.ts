/**
 * Jest manual mock for @sentry/react-native.
 *
 * Empêche les tests d'atteindre le SDK natif Sentry et expose des `jest.fn()`
 * mockables pour les vérifications (init, captureException, addBreadcrumb…).
 *
 * Picked up automatically by jest grâce au répertoire `__mocks__/` à la racine
 * (jest-expo preset n'écrase pas ce comportement). Voir docs Jest manual mocks.
 */

export const init = jest.fn();
export const captureException = jest.fn();
export const captureMessage = jest.fn();
export const addBreadcrumb = jest.fn();
export const setUser = jest.fn();
export const setContext = jest.fn();
export const setTag = jest.fn();

export default {
  init,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  setContext,
  setTag,
};
