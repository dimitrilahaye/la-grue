## Why

Le splashscreen n'apparaît pas lors du lancement de la PWA depuis l'écran d'accueil iPhone. Deux causes : le meta tag `apple-mobile-web-app-capable` est absent (iOS ignore les `<link rel="apple-touch-startup-image">` sans lui), et seules 3 tailles d'écran sont couvertes, laissant la majorité des modèles iPhone sans image correspondante.

## What Changes

- Ajout de `<meta name="apple-mobile-web-app-capable" content="yes">` dans `index.html`
- Extension de la couverture des `<link rel="apple-touch-startup-image">` à tous les modèles iPhone courants (de l'iPhone SE 1ère génération aux modèles 15)
- Génération des images splash manquantes dans `assets/` aux dimensions physiques exactes requises par iOS

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

Aucune — changement purement au niveau des assets et du HTML, sans impact sur les requirements comportementaux du système.

## Impact

- `frontend/index.html` : ajout du meta + link tags supplémentaires
- `assets/` : nouvelles images PNG aux dimensions requises
- Aucun impact sur le backend ni les tests
