const CACHE_NAME = 'orcamento-profissional-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/state.js',
  '/ui.js',
  '/dom.js',
  '/pdf.js',
  '/logo_placeholder.png',
  '/sun.png',
  '/moon.png',
  '/company.png',
  '/client.png',
  '/items.png',
  '/discount.png',
  '/data.png',
  '/pdf.png',
  '/history.png',
  '/whatsapp.png',
  '/instagram.png',
  '/website.png',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
  'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc4.woff2',
  'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBxc4.woff2',
  'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.woff2',
  'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBxc4.woff2',
  'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmYUtfBBc4.woff2',
  'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmYUtfBxc4.woff2',
  'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmYUtvBBc4.woff2',
  'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmYUtvBxc4.woff2',
  'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2',
  'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4WxK.woff2',
  'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu5mxK.woff2',
  'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu72xK.woff2',
  'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu7GxK.woff2',
  'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu7WxK.woff2',
  'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu7mxK.woff2',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Serve from cache
        }

        // Not in cache, fetch from network
        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // We don't cache POST requests or chrome extension requests
                if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
                  return;
                }
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});