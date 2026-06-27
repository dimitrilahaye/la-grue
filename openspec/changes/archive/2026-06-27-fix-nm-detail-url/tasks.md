## Tasks

- [x] `src/job/scrapers/nantesMetropole.ts` — remplacer `detailUrl: \`${AGENDA_BASE}/${toNantesSlug(r.nom)}\`` par `detailUrl: r.lien_agenda ?? \`${AGENDA_BASE}/${toNantesSlug(r.nom)}\``
