## Tasks

- [x] `src/job/scrapers/nantesMetropole.ts` — corriger l'interface `NantesRecord` : `types_libelles?: string | string[]`, `themes_libelles?: string | string[]`
- [x] `src/job/scrapers/nantesMetropole.ts` — ajouter un helper `toStr(v: string | string[] | undefined): string` et l'utiliser pour normaliser `types_libelles` / `themes_libelles` avant l'appel au normalizer
- [x] `src/job/normalizer.ts` — remplacer `normalized.includes(normalizeString(key))` par un test de token entier dans `mapNantesMetropoleCategory`
