const CACHE_NAME = 'walican-v2'; // バージョンを更新して古いキャッシュを削除
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.svg',
  '/icon-512x512.svg',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Chrome拡張機能のリクエストは無視
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // POSTリクエストやその他の非GETリクエストはキャッシュしない
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // HTTPSまたはlocalhostのリクエストのみキャッシュ
          const url = new URL(event.request.url);
          if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Add to cache
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache).catch((error) => {
                // キャッシュエラーを静かに処理
                console.warn('Cache put failed:', error.message);
              });
            });

          return response;
        });
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
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
    }).then(() => {
      // 即座に新しいService Workerを有効化
      return self.clients.claim();
    })
  );
});

// SKIP_WAITINGメッセージを受信したら待機をスキップ
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});