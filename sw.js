const CACHE_NAME='organizador_pessoal-sync-status-v3';const FILES=['./','index.html','style.css','app.js','sync.js','config.js','manifest.json','icon-180.png','icon-192.png','icon-512.png','favicon-32.png'];self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(FILES)));self.skipWaiting()});self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim()});self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Supabase and any other external API must always go directly to the network.
  if (url.origin !== self.location.origin || request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match('index.html')))
  );
});
