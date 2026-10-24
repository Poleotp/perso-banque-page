// Service worker : garde une copie de la page pour l'ouvrir même quand le Mac (serveur) est en veille.
// Les données (transactions, solde) sont déjà gardées dans le navigateur par la page elle-même.
const CACHE = 'etat-des-comptes-v1';
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Seule la page est mise en cache ; les appels /api/* passent toujours par le réseau.
  if (e.request.method !== 'GET' || url.origin !== location.origin || e.request.mode !== 'navigate') return;
  e.respondWith(networkFirst(e.request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(request, { signal: AbortSignal.timeout(NETWORK_TIMEOUT_MS) });
    if (res.ok) await cache.put(self.registration.scope, res.clone());
    return res;
  } catch {
    return (await cache.match(self.registration.scope)) || new Response('Serveur injoignable et aucune copie enregistrée.', { status: 503 });
  }
}
