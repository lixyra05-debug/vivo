// Budget commun des utilitaires asynchrones de @testing-library/react-native (findBy*,
// waitFor) : 1 000 ms par défaut, en temps réel. Le rendu complet d'un écran les dépasse
// quand la machine est sursouscrite (plusieurs suites à la fois) ; Jest, lui, coupe un test
// à 5 s par défaut, porté à 30 s par `testTimeout` (package.json). Les deux budgets sont
// fixés une fois, plutôt que test par test (CLAUDE.md, « Tests d'écran instables sous charge »).
// Chargé après l'environnement de test : depuis setupFiles, RNTL n'enregistrerait pas son
// nettoyage automatique, `afterEach` n'existant pas encore.
const { configure } = require('@testing-library/react-native');

configure({ asyncUtilTimeout: 15000 });
