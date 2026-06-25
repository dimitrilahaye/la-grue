// Service worker minimal — installabilité uniquement (pas de cache en v1)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
