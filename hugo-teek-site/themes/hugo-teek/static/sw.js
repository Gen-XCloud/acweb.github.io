// Service Worker for FlexSearch Index Caching
// 为 FlexSearch 搜索索引提供持久化缓存支持
// 策略: Cache First + Background Revalidation

const CACHE_PREFIX = 'flexsearch-index-';
const MANIFEST_URL = '/data/search/manifest.json';
const INDEX_URL = '/data/search/index.json.gz';

let currentVersion = null;

// ============================================================
// Install Event - 预加载 manifest
// ============================================================
self.addEventListener('install', (event) => {
  console.log('[SW] 📦 Installing Service Worker...');
  event.waitUntil(
    fetch(MANIFEST_URL)
      .then(res => res.json())
      .then(manifest => {
        currentVersion = manifest.version;
        console.log('[SW] ✅ Cached manifest version:', currentVersion);
        return self.skipWaiting(); // 立即激活
      })
      .catch(err => {
        console.warn('[SW] ⚠️ Failed to fetch manifest during install:', err);
      })
  );
});

// ============================================================
// Activate Event - 清理旧缓存
// ============================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] 🔄 Activating Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith(CACHE_PREFIX))
          .filter(name => name !== CACHE_PREFIX + currentVersion)
          .map(name => {
            console.log('[SW] 🗑️ Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ============================================================
// Fetch Event - 拦截搜索索引请求
// ============================================================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 只处理 /data/search/ 路径下的请求
  if (!url.pathname.startsWith('/data/search/')) {
    return; // 其他请求让浏览器正常处理
  }

  if (url.pathname === MANIFEST_URL) {
    // Manifest: Network First（总是获取最新版本）
    event.respondWith(handleManifestRequest(event.request));
  } else if (url.pathname === INDEX_URL) {
    // Index: Cache First with Background Revalidation
    event.respondWith(handleIndexRequest(event.request, event));
  }
});

// ============================================================
// Manifest 请求处理（Network First）
// ============================================================
async function handleManifestRequest(request) {
  try {
    const response = await fetch(request, { cache: 'no-cache' });
    const manifest = await response.clone().json();

    // 检查版本是否变化
    if (currentVersion && manifest.version !== currentVersion) {
      console.log('[SW] 🆕 New version detected:', manifest.version, '(old:', currentVersion + ')');

      // 删除旧缓存
      await caches.delete(CACHE_PREFIX + currentVersion);
      currentVersion = manifest.version;

      // 通知所有客户端
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'INDEX_UPDATE_AVAILABLE',
          version: manifest.version,
          oldVersion: currentVersion
        });
      });
    } else if (!currentVersion) {
      currentVersion = manifest.version;
    }

    return response;
  } catch (error) {
    console.warn('[SW] ⚠️ Failed to fetch manifest:', error);
    return new Response('{}', { status: 200 });
  }
}

// ============================================================
// Index 请求处理（Cache First + Background Revalidate）
// ============================================================
async function handleIndexRequest(request, event) {
  const cacheName = CACHE_PREFIX + currentVersion;
  const cache = await caches.open(cacheName);

  // 1. 尝试从缓存获取
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    console.log('[SW] ⚡ Serving index from cache (instant load)');

    // 2. 后台检查更新（不阻塞响应）
    event.waitUntil(
      fetch(MANIFEST_URL, { cache: 'no-cache' })
        .then(res => res.json())
        .then(manifest => {
          if (manifest.version !== currentVersion) {
            console.log('[SW] 🔄 Background update: fetching new index');
            // 获取并缓存新索引
            return fetch(request).then(response => {
              const newCacheName = CACHE_PREFIX + manifest.version;
              return caches.open(newCacheName).then(newCache => {
                newCache.put(request, response.clone());
                // 删除旧缓存
                caches.delete(cacheName);
                currentVersion = manifest.version;
                return response;
              });
            });
          }
        })
        .catch(err => console.warn('[SW] ⚠️ Background revalidation failed:', err))
    );

    return cachedResponse;
  }

  // 3. 缓存未命中：从网络获取
  console.log('[SW] 📥 Cache miss, fetching from network');
  try {
    const response = await fetch(request);
    // 缓存响应
    await cache.put(request, response.clone());
    return response;
  } catch (error) {
    console.error('[SW] ❌ Failed to fetch index:', error);
    return new Response('Network error', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}
