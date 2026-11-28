// Офлайн для PWA: сначала сеть (свежая версия, если есть интернет), без сети — из кэша.
// Новый набор файлов — поменяй CACHE (старый кэш удалится при активации).
const CACHE = 'proto-type-v101';
const FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
  ...['util', 'gestures', 'audio', 'core', 'universe', 'codex', 'sling', 's0_quarks', 's_particles', 's1_nuclei', 's_stars', 's2_atoms', 's3_molecules', 'online', 'main'].map(f => `./js/${f}.js`)];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => {
    if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
    return res;
  }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || (r.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
