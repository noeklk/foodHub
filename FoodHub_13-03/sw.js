const staticAssets = [
  "./",
  "./assets/css/main.css",
  "./assets/js/main.js",
  "./assets/css/styles.css",
  "./assets/js/jquery-3.3.1.min.js"
];

self.addEventListener("install", async event => {
  const cache = await caches.open("foodhub-static");
  cache.addAll(staticAssets);
});

self.addEventListener("fetch", event => {
  const req = event.request;
  event.respondWith(cacheFirst(req));
});

async function cacheFirst(req) {
  const cachedResponse = await caches.match(req);
  return cachedResponse || fetch(req);
}
