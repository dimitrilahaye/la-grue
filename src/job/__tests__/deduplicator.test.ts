import { upsertEvents } from '../deduplicator';
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

  it('deduplicates input: keeps last occurrence for same (source, externalId)', async () => {
    const now = new Date();
    const { values } = setupInsertMock([{ id: 'uuid-1', createdAt: now, updatedAt: now }]);

    const first = makeEvent({ externalId: 'id-dup', title: 'First Version' });
    const second = makeEvent({ externalId: 'id-dup', title: 'Second Version' });

    await upsertEvents([first, second]);

    const rows: Array<{ title: string }> = values.mock.calls[0][0];
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Second Version');
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
      makeEvent({ externalId: 'a' }),
      makeEvent({ externalId: 'b' }),
    ]);

    expect(result.errors).toBe(2);
    expect(result.inserted).toBe(0);
    expect(result.updated).toBe(0);
  });
});
