## MODIFIED Requirements

### Requirement: Normalisation Grabuge

Le `externalId` SHALL être `String(event.id)`. La `source` SHALL être `'grabuge'`. La catégorie SHALL être déterminée par `mapGrabugeCategory(categories[].name)` — retourne `null` si aucun mapping. Les événements sans catégorie reconnue SHALL être ignorés. Le champ `isFree` SHALL être `null` (non fourni par l'API tribe/events). Le champ `description` SHALL être strippé de tout tag HTML avant persistence — seul le texte brut est stocké.

#### Scenario: externalId stable

- **WHEN** le même événement est renvoyé lors de runs successifs
- **THEN** son `externalId` est identique et l'UPSERT met à jour sans dupliquer

#### Scenario: Description HTML strippée

- **WHEN** l'API Grabuge retourne une description contenant du HTML (`<p>`, `<br>`, `<strong>`…)
- **THEN** la description stockée en BDD est du texte brut sans aucun tag HTML

#### Scenario: Description null

- **WHEN** l'API Grabuge retourne une description absente ou null
- **THEN** le champ `description` est `null` en BDD
