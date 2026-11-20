/* 세계사 정주행 서비스 워커 (2026-11-17)
   - 페이지(HTML)는 인터넷이 되면 새로 받고, 안 되면 저장해 둔 것을 보여 준다
   - 그림·글꼴·스크립트는 저장본을 먼저 쓰고 뒤에서 새로 받아 둔다
   - "책 전체 저장" 요청을 받으면 sitemap.xml의 모든 페이지를 저장한다 */
const CACHE = 'wh-v3';
const CORE = ['./', './manifest.webmanifest', './assets/globe-logo.svg', './assets/globe.svg', './assets/app/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const FONT_HOSTS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === location.origin;
  if (!same && !FONT_HOSTS.includes(url.hostname)) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    }).catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});

async function saveAll(port) {
  const base = self.registration.scope;
  const xml = await (await fetch(base + 'sitemap.xml', {cache: 'no-store'})).text();
  const pages = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname)
    .map(p => new URL(p, location.origin).href).filter(u => u.startsWith(base));
  const extra = ['search/search_index.json', 'stylesheets/extra.css', 'javascripts/globe.js', 'javascripts/reveal.js', 'javascripts/app-install.js', 'javascripts/bookmark.js',
    'assets/globe-grin.svg', 'assets/globe-smile.svg', 'assets/globe-wow.svg'].map(p => base + p);
  const all = [...new Set([...pages, ...extra])];
  const cache = await caches.open(CACHE);
  let done = 0, fail = 0;
  for (let i = 0; i < all.length; i += 6) {
    await Promise.all(all.slice(i, i + 6).map(u => fetch(u).then(r => { if (r.ok) return cache.put(u, r); fail++; }).catch(() => { fail++; })));
    done = Math.min(i + 6, all.length);
    port.postMessage({type: 'progress', done, total: all.length});
  }
  port.postMessage({type: 'done', total: all.length, fail});
}
self.addEventListener('message', e => {
  if (e.data === 'save-all' && e.ports[0]) e.waitUntil(saveAll(e.ports[0]).catch(err => e.ports[0].postMessage({type: 'error', message: String(err)})));
});
