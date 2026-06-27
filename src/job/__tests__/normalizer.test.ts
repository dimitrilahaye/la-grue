import {
  mapNantesMetropoleCategory,
  mapPaysLoireCategory,
  mapWikCategory,
} from '../normalizer';

describe('mapNantesMetropoleCategory', () => {
  it('maps concert types to concerts-musique', () => {
    expect(mapNantesMetropoleCategory('Concert', '')).toBe('concerts-musique');
  });
  it('maps exposition to expositions-arts', () => {
    expect(mapNantesMetropoleCategory('Exposition', 'Culture')).toBe('expositions-arts');
  });
  it('maps festival to festivals', () => {
    expect(mapNantesMetropoleCategory('Festival', '')).toBe('festivals');
  });
  it('returns null for unknown types', () => {
    expect(mapNantesMetropoleCategory('', '')).toBeNull();
  });
  it('does not match concertation as concert (word-boundary)', () => {
    expect(mapNantesMetropoleCategory('Conférence - Débat', 'Citoyenneté - Concertation')).toBeNull();
  });
  it('maps sexpo category', () => {
    expect(mapNantesMetropoleCategory('Sexpo', '')).toBe('sexpo');
  });
});

describe('mapPaysLoireCategory', () => {
  it('maps jazz keyword to concerts-musique', () => {
    expect(mapPaysLoireCategory('jazz;musique')).toBe('concerts-musique');
  });
  it('maps bal keyword to ginguettes-guinguettes', () => {
    expect(mapPaysLoireCategory('bal;danse')).toBe('ginguettes-guinguettes');
  });
  it('returns null for empty keywords', () => {
    expect(mapPaysLoireCategory('')).toBeNull();
  });
  it('maps opera to spectacles-theatre', () => {
    expect(mapPaysLoireCategory('opéra;classique')).toBe('spectacles-theatre');
  });
});

describe('mapWikCategory', () => {
  it('maps scene path to concerts-musique', () => {
    expect(mapWikCategory('scene')).toBe('concerts-musique');
  });
  it('maps expo path to expositions-arts', () => {
    expect(mapWikCategory('expo')).toBe('expositions-arts');
  });
  it('returns null for unrecognised path', () => {
    expect(mapWikCategory('loisir')).toBeNull();
  });
  it('maps sexpo to sexpo', () => {
    expect(mapWikCategory('sexpo')).toBe('sexpo');
  });
});
