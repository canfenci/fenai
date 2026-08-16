// ============================================================
// SERVICE WORKER – FenAI PWA Offline & Caching Support
// ============================================================

const CACHE_NAME = 'fenai-v14';
const staticAssets = [
  './',
  './index.html',
  './css/reset.css',
  './css/variables.css',
  './css/layout.css',
  './css/sidebar.css',
  './css/header.css',
  './css/dashboard.css',
  './css/components.css',
  './css/forms.css',
  './css/cards.css',
  './css/buttons.css',
  './css/responsive.css',
  './js/component-engine.js',
  './js/app.js',
  './js/mufredat.js',
  './js/api.js',
  './js/ui.js',
  './js/word.js',
  './js/database.js',
  './js/cerceve.js',
  './js/core/bootstrap.js',
  './js/core/appState.js',
  './js/ui/uiEngine.js',
  './js/database/localDb.js',
  './js/ai/providers.js',
  './js/prompt/promptEngine.js',
  './js/ai/aiEngine.js',
  './js/ai/learningAgent.js',
  './js/document/layoutEngine.js',
  './js/document/logoBase64.js',
  './js/document/exportEngine.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install Event
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(staticAssets).catch(err => {
        console.warn('Statik PWA dosyaları önbelleğe yüklenirken uyarı:', err);
      });
    })
  );
});

// Activate Event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Network-First, Cache Fallback)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  // Dış API isteklerini cacheleme
  const url = event.request.url;
  if (url.includes('generativelanguage.googleapis.com') || 
      url.includes('api.deepseek.com') || 
      url.includes('openrouter.ai') || 
      url.includes('api.openai.com') || 
      url.includes('api.anthropic.com') || 
      url.includes('integrate.api.nvidia.com') || 
      url.includes('api.perplexity.ai')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});