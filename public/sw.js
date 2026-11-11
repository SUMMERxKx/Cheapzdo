// Minimal service worker so Chrome and Edge offer to install Cheapzdo as an app.
// It caches nothing, so the board and its API and Supabase data always come from the network.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
