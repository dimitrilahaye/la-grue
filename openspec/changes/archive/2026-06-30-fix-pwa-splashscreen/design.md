## Context

iOS Safari exige deux conditions pour afficher un splashscreen au lancement d'une PWA installée :
1. `<meta name="apple-mobile-web-app-capable" content="yes">` présent dans le `<head>`
2. Un `<link rel="apple-touch-startup-image">` dont le `media` query correspond exactement aux dimensions logiques et au DPR du device

Les images splash doivent avoir les dimensions **physiques** exactes (CSS logical × DPR). L'approche actuelle ne couvre que 3 modèles sur ~12 tailles distinctes.

## Goals / Non-Goals

**Goals:**
- Splashscreen affiché sur tous les iPhones courants (SE 1ère gen → iPhone 15 Pro Max)
- Couverture en portrait uniquement (l'app est verrouillée `portrait-primary` dans le manifest)

**Non-Goals:**
- iPad (hors scope)
- Android (gère le splash via le manifest `background_color`, déjà configuré)

## Decisions

**Dimensions à couvrir**

| Modèle | CSS | DPR | Image physique |
|---|---|---|---|
| iPhone SE 1ère gen | 320×568 | @2x | 640×1136 |
| iPhone SE 2/3, 6/7/8 | 375×667 | @2x | 750×1334 |
| iPhone 6+/7+/8+ | 414×736 | @3x | 1242×2208 |
| iPhone X, XS, 11 Pro, 12 mini, 13 mini | 375×812 | @3x | 1125×2436 |
| iPhone XR, 11 | 414×896 | @2x | 828×1792 |
| iPhone XS Max, 11 Pro Max | 414×896 | @3x | 1242×2688 |
| iPhone 12, 12 Pro, 13, 13 Pro, 14 | 390×844 | @3x | 1170×2532 |
| iPhone 12 Pro Max, 13 Pro Max | 428×926 | @3x | 1284×2778 |
| iPhone 14 Pro, 15, 15 Pro | 393×852 | @3x | 1179×2556 |
| iPhone 14 Pro Max, 15 Plus, 15 Pro Max | 430×932 | @3x | 1290×2796 |

Note : iPhone X et iPhone 12 mini partagent la même media query (375×812 @3x). Une seule image est utilisée pour les deux.

**Génération des images**

Script Node.js utilisant `sharp` pour générer chaque PNG aux bonnes dimensions à partir d'un template (fond couleur accent `#F5C518` + logo centré). `sharp` est déjà disponible ou s'ajoute en devDependency.

## Risks / Trade-offs

- [Cache PWA] iOS met en cache les splash screens après installation. Un utilisateur ayant déjà installé la PWA devra désinstaller/réinstaller pour voir le nouveau splash.
- [Poids assets] ~10 images PNG de 100–300kb chacune. Acceptable car servis statiquement et non dans le bundle JS.
