/* 볼케이노 대시보드 — 껍데기(잠금화면)만 캐시한다. 실제 데이터는 절대 캐시하지 않는다. */
const CACHE = "vdp-shell-v3";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()).catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // 다른 출처(api.github.com 등)는 손대지 않는다 — 데이터가 캐시에 남지 않도록.
  if (url.origin !== self.location.origin) return;
  const clean = url.origin + url.pathname;
  const isShell = SHELL.some((p) => clean === new URL(p, self.registration.scope).href);
  if (!isShell) return;

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
