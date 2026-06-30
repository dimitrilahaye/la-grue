## Purpose

Affichage d'un splashscreen branded au lancement de la PWA depuis l'écran d'accueil iPhone. iOS Safari exige la présence du meta tag `apple-mobile-web-app-capable` et des `<link rel="apple-touch-startup-image">` avec media queries exactes pour chaque taille d'écran.

---

## Requirements

### Requirement: Splashscreen iOS PWA
Le système SHALL afficher un splashscreen au lancement de la PWA depuis l'écran d'accueil iPhone. Le `<head>` de `index.html` SHALL contenir `<meta name="apple-mobile-web-app-capable" content="yes">`. Des `<link rel="apple-touch-startup-image">` avec media queries SHALL couvrir toutes les tailles d'écran iPhone courantes de l'iPhone SE (1ère gen) aux modèles iPhone 15. Chaque lien SHALL pointer vers un fichier PNG dans `assets/` aux dimensions physiques exactes (logical CSS × DPR). Les images SHALL utiliser le fond `#F5C518` (couleur accent) avec le logo centré.

#### Scenario: Splashscreen affiché au lancement
- **WHEN** l'utilisateur lance la PWA depuis l'icône de son écran d'accueil iPhone
- **THEN** le splashscreen s'affiche pendant le chargement avant l'apparition de l'interface

#### Scenario: Couverture iPhone SE 1ère génération
- **WHEN** la PWA est lancée sur un iPhone SE 1ère gen (320×568 @2x)
- **THEN** l'image `splash-640x1136.png` est servie via la media query correspondante

#### Scenario: Couverture iPhone 14 Pro Max / 15 Plus / 15 Pro Max
- **WHEN** la PWA est lancée sur un iPhone 14 Pro Max, 15 Plus ou 15 Pro Max (430×932 @3x)
- **THEN** l'image `splash-1290x2796.png` est servie via la media query correspondante
