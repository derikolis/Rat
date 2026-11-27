// Service worker: guarda o site no aparelho para abrir sem internet.
// Sempre que publicar uma versão nova, aumente o número abaixo (rat-v31, rat-v54...)
// e o ?v= do style.css e do app.js no index.html.
const CACHE = 'rat-v54';

const FILES = [
  './',
  './index.html',
  './mascara.html',
  './manifest.json',
  './assets/css/style.css',
  './assets/js/app.js',
  './assets/js/mascara.js',
  './assets/js/swipe.js',
  './assets/css/swipe.css',
  './assets/css/mascara.css',
  './assets/js/vendor/html2canvas.min.js',
  './assets/fonts/caveat-latin.woff2',
  './assets/img/equipamentos.png',
  './assets/img/rodape.png',
  './assets/icons/favicon-32.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Com internet: busca a versão nova e atualiza a cópia guardada.
// Sem internet: usa a cópia guardada.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })   // sempre confere se há versão nova
      .then(res => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })
        .then(r => r || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
