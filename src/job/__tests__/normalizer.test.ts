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
  it('falls back to autres for unknown types', () => {
    expect(mapNantesMetropoleCategory('', '')).toBe('autres');
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
  it('falls back to autres for empty keywords', () => {
    expect(mapPaysLoireCategory('')).toBe('autres');
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
  it('maps loisir to autres', () => {
    expect(mapWikCategory('loisir')).toBe('autres');
  });
  it('maps sexpo to sexpo', () => {
    expect(mapWikCategory('sexpo')).toBe('sexpo');
  });
});
