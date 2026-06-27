const CF_MARKERS = [
  'Just a moment',
  'cf-browser-verification',
  'Enable JavaScript and cookies to continue',
];

export function assertNotCloudflare(body: string, url: string): void {
  for (const marker of CF_MARKERS) {
    if (body.includes(marker)) {
      throw new Error(`Cloudflare challenge detected on ${url} (marker: "${marker}")`);
    }
  }
}

export function buildDateRange(): { dateStart: string; dateEnd: string } {
  const now = new Date();
  const later = new Date(now);
  later.setDate(now.getDate() + 14);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { dateStart: fmt(now), dateEnd: fmt(later) };
}
