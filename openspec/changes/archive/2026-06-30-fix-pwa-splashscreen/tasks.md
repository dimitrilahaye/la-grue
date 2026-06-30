## 1. Meta tag

- [x] 1.1 Ajouter `<meta name="apple-mobile-web-app-capable" content="yes">` dans le `<head>` de `frontend/index.html`

## 2. Script de génération des images

- [x] 2.1 Ajouter `sharp` en devDependency (`npm install --save-dev sharp`)
- [x] 2.2 Créer `scripts/generate-splashscreens.ts` : génère les 10 PNG dans `assets/` (fond `#F5C518`, logo SVG centré) pour toutes les dimensions listées dans le design

## 3. Génération des assets

- [x] 3.1 Exécuter `npx tsx scripts/generate-splashscreens.ts` pour produire tous les fichiers PNG dans `assets/`
- [x] 3.2 Vérifier visuellement un échantillon des images générées

## 4. HTML — link tags

- [x] 4.1 Remplacer les 3 `<link rel="apple-touch-startup-image">` existants dans `frontend/index.html` par la liste complète des 10 tailles (cf. tableau design.md)
