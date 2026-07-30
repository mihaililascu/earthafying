// Earthafying service worker
// Purpose: satisfies "installable app" requirements (needed to package for Google Play)
// via PWABuilder). Intentionally does NOT cache pages, so the site always loads
// the latest version from the network — no stale/"stuck on old version" problems.

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

// A fetch handler must exist for the app to count as installable.
// This one simply lets every request go straight to the network (no caching).
self.addEventListener('fetch', function (event) {
  // network passthrough — nothing cached
});
