import { upsertEvents, richnessScore } from '../deduplicator';
import { events } from '../../db/schema';
import { db } from '../../db/client';
import { type NormalizedEvent } from '../../types/event';

jest.mock('../../db/client', () => ({
  db: { insert: jest.fn() },
}));

const mockInsert = db.insert as jest.Mock;

// --- Fixture factory -----------------------------------------------------

function makeEvent(overrides: Partial<NormalizedEvent> = {}): NormalizedEvent {
  return {
    source: 'wik',
    externalId: 'ext-001',
    canonicalId: 'canonical-001',
    title: 'Test Event',
    description: null,
    startAt: new Date('2026-06-25T20:00:00Z'),
    endAt: null,
    venueName: 'Le Ferrailleur',
    city: 'Nantes',
    address: null,
    lat: null,
    lon: null,
    category: 'concerts-musique',
    rawCategory: 'musique',
    tags: [],
    detailUrl: null,
    imageUrl: null,
    isFree: false,
    priceInfo: null,
    ...overrides,
  };
}

function setupInsertMock(
  rows: Array<{ id: string; createdAt: Date; updatedAt: Date }>,
) {
  const returning = jest.fn().mockResolvedValue(rows);
  const onConflictDoUpdate = jest.fn().mockReturnValue({ returning });
  const values = jest.fn().mockReturnValue({ onConflictDoUpdate });
  mockInsert.mockReturnValue({ values });
  return { values, onConflictDoUpdate, returning };
}

// --- Tests ---------------------------------------------------------------

describe('richnessScore', () => {
  it('returns 0 for an event with no enriched fields', () => {
    expect(richnessScore(makeEvent({ title: '', description: null, lat: null, lon: null, imageUrl: null, priceInfo: null }))).toBe(0);
  });

  it('returns 5 for a fully enriched event', () => {
    expect(richnessScore(makeEvent({
      title: 'Concert',
      description: 'Une description',
      lat: 47.2,
      lon: -1.5,
      imageUrl: 'https://img.jpg',
      priceInfo: '10€',
    }))).toBe(5);
  });

  it('counts lat+lon as a single point (both required)', () => {
    expect(richnessScore(makeEvent({ lat: 47.2, lon: null }))).toBe(1); // title only
    expect(richnessScore(makeEvent({ lat: 47.2, lon: -1.5 }))).toBe(2); // title + coords
  });

  it('counts description presence regardless of length', () => {
    expect(richnessScore(makeEvent({ description: 'x' }))).toBe(2); // title + description
  });
});

describe('upsertEvents', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns zeros and skips DB call for empty input', async () => {
    const result = await upsertEvents([]);
    expect(result).toEqual({ inserted: 0, updated: 0, errors: 0 });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('counts a row as inserted when createdAt ≈ updatedAt', async () => {
    const now = new Date();
    setupInsertMock([{ id: 'uuid-1', createdAt: now, updatedAt: now }]);

    const result = await upsertEvents([makeEvent()]);

    expect(result.inserted).toBe(1);
    expect(result.updated).toBe(0);
    expect(result.errors).toBe(0);
  });

  it('counts a row as updated when createdAt is much earlier than updatedAt', async () => {
    const now = new Date();
    const past = new Date(now.getTime() - 10_000);
    setupInsertMock([{ id: 'uuid-1', createdAt: past, updatedAt: now }]);

    const result = await upsertEvents([makeEvent()]);

    expect(result.inserted).toBe(0);
    expect(result.updated).toBe(1);
    expect(result.errors).toBe(0);
  });

  it('deduplicates by canonicalId: keeps the candidate with the highest richness score', async () => {
    const now = new Date();
    const { values } = setupInsertMock([{ id: 'uuid-1', createdAt: now, updatedAt: now }]);

    const poor = makeEvent({ canonicalId: 'same-canon', externalId: 'ext-a', source: 'wik', title: 'Event', description: null });
    const rich = makeEvent({ canonicalId: 'same-canon', externalId: 'ext-b', source: 'grabuge', title: 'Event', description: 'Une description complète' });

    await upsertEvents([poor, rich]);

    const rows: Array<{ externalId: string }> = values.mock.calls[0][0];
    expect(rows).toHaveLength(1);
    expect(rows[0].externalId).toBe('ext-b');
  });

  it('deduplicates by canonicalId: when scores are equal, keeps the first', async () => {
    const now = new Date();
    const { values } = setupInsertMock([{ id: 'uuid-1', createdAt: now, updatedAt: now }]);

    const first = makeEvent({ canonicalId: 'same-canon', externalId: 'ext-a', title: 'Event' });
    const second = makeEvent({ canonicalId: 'same-canon', externalId: 'ext-b', title: 'Event' });

    await upsertEvents([first, second]);

    const rows: Array<{ externalId: string }> = values.mock.calls[0][0];
    expect(rows).toHaveLength(1);
    expect(rows[0].externalId).toBe('ext-a');
  });

  it('handles multiple events correctly', async () => {
    const now = new Date();
    const past = new Date(now.getTime() - 10_000);
    setupInsertMock([
      { id: 'uuid-1', createdAt: now, updatedAt: now },
      { id: 'uuid-2', createdAt: past, updatedAt: now },
    ]);

    const result = await upsertEvents([
      makeEvent({ externalId: 'a' }),
      makeEvent({ externalId: 'b' }),
    ]);

    expect(result.inserted).toBe(1);
    expect(result.updated).toBe(1);
    expect(result.errors).toBe(0);
  });

  it('counts errors when the DB insert throws', async () => {
    mockInsert.mockReturnValue({
      values: jest.fn().mockReturnValue({
        onConflictDoUpdate: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error('DB error')),
        }),
      }),
    });

    const result = await upsertEvents([
      makeEvent({ externalId: 'a', canonicalId: 'canon-a' }),
      makeEvent({ externalId: 'b', canonicalId: 'canon-b' }),
    ]);

    expect(result.errors).toBe(2);
    expect(result.inserted).toBe(0);
    expect(result.updated).toBe(0);
  });

  it('uses canonicalId as conflict target', async () => {
    const now = new Date();
    const { onConflictDoUpdate } = setupInsertMock([{ id: 'uuid-1', createdAt: now, updatedAt: now }]);

    await upsertEvents([makeEvent()]);

    const callArg = onConflictDoUpdate.mock.calls[0][0];
    expect(callArg.target).toEqual([events.canonicalId]);
  });

  it('cross-run: description SQL prefers the longer value', async () => {
    const now = new Date();
    const { onConflictDoUpdate } = setupInsertMock([{ id: 'uuid-1', createdAt: now, updatedAt: now }]);

    await upsertEvents([makeEvent({ description: 'courte' })]);

    const set = onConflictDoUpdate.mock.calls[0][0].set;
    expect(JSON.stringify(set.description)).toMatch(/length/i);
  });

  it('cross-run: imageUrl SQL uses COALESCE to preserve existing', async () => {
    const now = new Date();
    const { onConflictDoUpdate } = setupInsertMock([{ id: 'uuid-1', createdAt: now, updatedAt: now }]);

    await upsertEvents([makeEvent({ imageUrl: null })]);

    const set = onConflictDoUpdate.mock.calls[0][0].set;
    expect(JSON.stringify(set.imageUrl)).toMatch(/COALESCE/i);
  });
});
