const CACHE_NAME = "lockin-v2";
const CORE_ASSETS = ["/icon.png", "/manifest.webmanifest"];
const STATIC_DESTINATIONS = new Set(["script", "style", "image", "font"]);

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
            ),
        ),
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== self.location.origin) return;

    // Avoid caching documents/API responses to prevent stale auth redirects and blank pages.
    if (!STATIC_DESTINATIONS.has(event.request.destination)) return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request)
                .then((response) => {
                    if (!response.ok) return response;
                    const cloned = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
                    return response;
                });
        }),
    );
});
