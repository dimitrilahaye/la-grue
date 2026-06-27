import axios from 'axios';
import { scrapeWik } from '../wik';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// --- HTML fixtures -------------------------------------------------------

function makeArticle(opts: {
  href?: string;
  title?: string;
  date?: string;
  area?: string;
  img?: string;
} = {}): string {
  const {
    href = '/nantes/1/musique/concert-jazz',
    title = 'Concert de Jazz',
    date = 'Dates : jeudi 25 juin 2026, 21h00',
    area = 'Lieu : Le Ferrailleur',
    img = '/uploads/concert.jpg',
  } = opts;
  return `
    <div class="article">
      <a href="${href}"><img src="${img}" /></a>
      <h2 class="h2">${title}</h2>
      <div class="date">${date}</div>
      <div class="area">${area}</div>
    </div>`;
}

function listing(inner: string): string {
  return `<div class="listing-articles--agenda">${inner}</div>`;
}

const emptyListing = listing('');

// --- Tests ---------------------------------------------------------------

describe('scrapeWik', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a normalized event from a valid article', async () => {
    mockedAxios.get = jest.fn()
      .mockResolvedValueOnce({ data: listing(makeArticle()) })
      .mockResolvedValue({ data: emptyListing });

    const events = await scrapeWik();

    expect(events).toHaveLength(1);
    expect(events[0].source).toBe('wik');
    expect(events[0].title).toBe('Concert de Jazz');
    expect(events[0].venueName).toBe('Le Ferrailleur');
    expect(events[0].category).toBe('concerts-musique');
    expect(events[0].city).toBe('Nantes');
    expect(events[0].imageUrl).toBe('https://www.wik-nantes.fr/uploads/concert.jpg');
    expect(events[0].externalId).toMatch(/^[a-f0-9]{64}$/);
    expect(events[0].detailUrl).toBe('https://www.wik-nantes.fr/nantes/1/musique/concert-jazz');
  });

  it('includes the date= query param in the URL', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({ data: emptyListing });

    await scrapeWik();

    const url = (mockedAxios.get as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('date=');
    expect(url).toMatch(/\d{2}%2F\d{2}%2F\d{4}/); // DD%2FMM%2FYYYY encoded
  });

  it('stops pagination when a page returns 0 articles', async () => {
    mockedAxios.get = jest.fn()
      .mockResolvedValueOnce({ data: listing(makeArticle()) })
      .mockResolvedValue({ data: emptyListing });

    await scrapeWik();

    // page 0 (1 event) + page 1 (empty, stops) + 1 enrichment GET
    expect(mockedAxios.get).toHaveBeenCalledTimes(3);
  });

  it('skips article with empty title', async () => {
    mockedAxios.get = jest.fn()
      .mockResolvedValueOnce({ data: listing(makeArticle({ title: '' })) })
      .mockResolvedValue({ data: emptyListing });

    const events = await scrapeWik();
    expect(events).toHaveLength(0);
  });

  it('skips article whose href does not start with /nantes/', async () => {
    mockedAxios.get = jest.fn()
      .mockResolvedValueOnce({ data: listing(makeArticle({ href: '/paris/1/musique/concert' })) })
      .mockResolvedValue({ data: emptyListing });

    const events = await scrapeWik();
    expect(events).toHaveLength(0);
  });

  it('skips article with unparseable date', async () => {
    mockedAxios.get = jest.fn()
      .mockResolvedValueOnce({ data: listing(makeArticle({ date: 'Dates : date inconnue' })) })
      .mockResolvedValue({ data: emptyListing });

    const events = await scrapeWik();
    expect(events).toHaveLength(0);
  });

  it('parses endAt from "Jusqu\'au" text', async () => {
    const dateWithUntil = "Dates : jeudi 25 juin 2026, 21h00 Jusqu'au samedi 4 juillet 2026";
    mockedAxios.get = jest.fn()
      .mockResolvedValueOnce({ data: listing(makeArticle({ date: dateWithUntil })) })
      .mockResolvedValue({ data: emptyListing });

    const events = await scrapeWik();

    expect(events).toHaveLength(1);
    expect(events[0].endAt).not.toBeNull();
    expect(events[0].endAt?.getMonth()).toBe(6); // juillet = index 6
    expect(events[0].endAt?.getDate()).toBe(4);
  });

  it('continues gracefully when axios throws on a page', async () => {
    mockedAxios.get = jest.fn().mockRejectedValue(new Error('Network error'));

    const events = await scrapeWik();
    expect(events).toHaveLength(0);
  });

  it('enriches description from meta tag on detail page', async () => {
    const detailHtml = `<html><head><meta name="description" content="Un concert de jazz intime." /></head></html>`;
    mockedAxios.get = jest.fn()
      .mockResolvedValueOnce({ data: listing(makeArticle()) }) // listing page 0
      .mockResolvedValueOnce({ data: emptyListing })           // listing page 1 (stops)
      .mockResolvedValueOnce({ data: detailHtml });            // enrichment GET

    const events = await scrapeWik();
    expect(events[0].description).toBe('Un concert de jazz intime.');
  });

  it('keeps description null when detail page is inaccessible', async () => {
    mockedAxios.get = jest.fn()
      .mockResolvedValueOnce({ data: listing(makeArticle()) })
      .mockResolvedValueOnce({ data: emptyListing })
      .mockRejectedValueOnce(new Error('timeout'));

    const events = await scrapeWik();
    expect(events[0].description).toBeNull();
    expect(events).toHaveLength(1);
  });

  it('derives category from URL path', async () => {
    mockedAxios.get = jest.fn()
      .mockResolvedValueOnce({ data: listing(makeArticle({ href: '/nantes/1/expo/une-expo' })) })
      .mockResolvedValue({ data: emptyListing });

    const events = await scrapeWik();
    expect(events[0].category).toBe('expositions-arts');
  });

  it('accumulates events across multiple pages', async () => {
    mockedAxios.get = jest.fn()
      .mockResolvedValueOnce({ data: listing(makeArticle({ title: 'Event A' })) })
      .mockResolvedValueOnce({ data: listing(makeArticle({ title: 'Event B', href: '/nantes/1/scene/event-b' })) })
      .mockResolvedValue({ data: emptyListing });

    const events = await scrapeWik();
    expect(events).toHaveLength(2);
  });

  it('skips article with unmapped category path (e.g. loisir)', async () => {
    mockedAxios.get = jest.fn()
      .mockResolvedValueOnce({ data: listing(makeArticle({ href: '/nantes/1/loisir/sortie' })) })
      .mockResolvedValue({ data: emptyListing });

    const events = await scrapeWik();
    expect(events).toHaveLength(0);
  });
});
