const CACHE = "municipal-shell-v2";

const SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Complaints, auth and photos are private or change constantly. Keep them
  // out of the cache and always go to the network.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/uploads/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Built assets are content-hashed, so serving the cached copy while
  // refreshing it in the background is safe.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            // Clone synchronously. The browser starts consuming the response
            // as soon as respondWith settles, so cloning later inside the
            // caches.open() chain throws "Response body is already used".
            const copy = response.clone();

            caches
              .open(CACHE)
              .then((cache) => cache.put(request, copy))
              .catch(() => {});
          }

          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
