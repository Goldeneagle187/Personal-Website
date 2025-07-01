// NOTE: Bumping this version number will trigger the service worker update
// process and re-cache all assets.
const CACHE_VERSION = 5;
const CACHE_NAME = `my-website-cache-v${CACHE_VERSION}`;

// A list of all the assets that should be cached on install.
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    'script.js',
    '/assets/profile.webp',
    '/assets/img.svg',
    '/assets/noscript-error.svg',
    // Icons
    '/assets/icons/arrow-up.svg',
    '/assets/icons/email-logo.svg',
    '/assets/icons/feedback-logo.svg',
    '/assets/icons/github-logo.svg',
    '/assets/icons/instagram-logo.svg',
    '/assets/icons/linkedin-logo.svg',
    '/assets/icons/QR-logo.svg',
    '/assets/icons/quora-logo.svg',
    '/assets/icons/signal-logo.svg',
    '/assets/icons/telegram-logo.svg',
    '/assets/icons/twitterx-logo.svg',
    '/assets/icons/whatsapp-logo.svg',
    '/assets/icons/youtube-logo.svg',
    // Animated Icons
    '/assets/an-icons/leafy-green.webp',
    '/assets/an-icons/lightbulb-emoji-am.webp',
    '/assets/an-icons/moon-emoji-am.webp',
    '/assets/an-icons/school.webp',
    '/assets/an-icons/scientist.webp',
    //Academia
    'assets/academia/cu-college.webp',
    'assets/academia/dav-school.webp',
    'assets/academia/sm-school.webp',
    'assets/academia/sxi-school.webp',
    // Others
    '/assets/cursors/cursor-dark.svg',
    '/assets/cursors/cursor-hand-dark.svg',
    '/assets/cursors/cursor-light.svg',
    '/assets/cursors/cursor-hand-light.svg',
    'assets/icons/arrow-up.svg',
    //Favicon
    '/assets/favicon/apple-touch-icon.png',
    '/assets/favicon/favicon.ico',
    '/assets/favicon/favicon.svg',
    '/favicon/favicon-96x96.png',
    '/assets/favicon/site.webmanifest'
];

/**
 * 'install' event listener.
 * This is called when the service worker is first installed.
 * It opens a cache and adds all specified assets to it.
 */
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache and caching assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch(err => {
                console.error('Failed to cache assets during install:', err);
            })
    );
});

/**
 * 'activate' event listener.
 * This is called when the service worker is activated.
 * It cleans up old caches that are no longer needed.
 */
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

/**
 * 'fetch' event listener.
 * This is called for every network request made by the page.
 * It implements a "cache-first" strategy.
 */
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // If the response is in the cache, return it.
                if (response) {
                    return response;
                }
                // Otherwise, fetch it from the network.
                return fetch(event.request).then(
                    (networkResponse) => {
                        // Optionally, cache new requests dynamically
                        // Be cautious with this to avoid bloating the cache
                        return networkResponse;
                    }
                );
            })
    );
});
