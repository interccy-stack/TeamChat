/**
 * TeamChat Service Worker v5.2.3
 * 提供静态资源缓存和离线支持
 */

const CACHE_NAME = 'teamchat-v5.2.7';
const CACHE_VERSION = 'v2';

// 核心资源 - 立即缓存
const CORE_ASSETS = [
  '/api/plugins/team_chat/static/index.js',
  '/api/plugins/team_chat/media/0123.jpg',
  '/api/plugins/team_chat/media/bot.gif',
  '/api/plugins/team_chat/media/nest_bird.svg'
];

// 可选资源 - 按需缓存
const OPTIONAL_ASSETS = [
  '/api/plugins/team_chat/static/modules/ai-chat.module.js',
  '/api/plugins/team_chat/static/modules/email.module.js',
  '/api/plugins/team_chat/static/modules/ai-fenshen.module.js',
  '/api/plugins/team_chat/static/modules/animation.module.js',
  '/api/plugins/team_chat/static/modules/onboarding.module.js'
];

// 安装时缓存核心资源
self.addEventListener('install', event => {
  console.log('[SW] 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 缓存核心资源');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活时清理旧缓存
self.addEventListener('activate', event => {
  console.log('[SW] 激活中...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('teamchat-') && name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] 删除旧缓存:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截请求
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 策略1: 核心JS文件 - 网络优先，缓存回退
  if (url.pathname.includes('/static/index.js') || 
      url.pathname.includes('/static/modules/')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // 策略2: 媒体文件 - 缓存优先，长期缓存
  if (url.pathname.includes('/media/')) {
    event.respondWith(cacheFirst(request, true));
    return;
  }
  
  // 策略3: API请求 - 网络优先，短期缓存
  if (url.pathname.startsWith('/api/plugins/team_chat/')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // 策略4: 其他请求 - 网络优先
  event.respondWith(networkFirst(request));
});

/**
 * 缓存优先策略
 */
async function cacheFirst(request, longTerm = false) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    // 长期缓存直接返回
    if (longTerm) return cached;
    
    // 短期缓存：后台更新
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    }).catch(() => {});
    
    return cached;
  }
  
  // 缓存未命中，从网络获取
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] 网络请求失败:', error);
    return new Response('网络离线', { status: 503 });
  }
}

/**
 * 网络优先策略
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // 更新缓存
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // 网络失败，尝试缓存
    const cached = await cache.match(request);
    if (cached) {
      console.log('[SW] 使用缓存:', request.url);
      return cached;
    }
    
    console.error('[SW] 无缓存可用:', request.url);
    return new Response('网络离线且无缓存', { status: 503 });
  }
}

/**
 * 清理旧缓存
 */
async function cleanupCache() {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  
  // 删除超过30天的缓存
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  
  for (const request of requests) {
    const response = await cache.match(request);
    if (response && response.headers) {
      const date = response.headers.get('date');
      if (date && (now - new Date(date).getTime()) > thirtyDays) {
        await cache.delete(request);
      }
    }
  }
}

// 定期清理（每天）
setInterval(cleanupCache, 24 * 60 * 60 * 1000);

// 监听消息
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker 已加载');
