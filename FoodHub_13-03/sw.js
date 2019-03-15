const staticAssets = [
  "./",
  "./assets/css/main.css",
  "./assets/js/main.js",
  "./assets/css/styles.css",
  "./assets/js/jquery-3.3.1.min.js",
  "./assets/fonts/Sansation_Regular.ttf",
  "./assets/fonts/Sansation_Bold.ttf",
  "./assets/css/all.min.css",
  "./assets/css/bootstrap.min.css",
  "./assets/js/popper.min.js",
  "./assets/webfonts/fa-solid-900.woff2",
  "./assets/webfonts/fa-regular-400.woff2",
  "./assets/webfonts/fa-brands-400.woff2"
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
