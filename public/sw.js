const CACHE_NAME = 'ai-dashboard-v1.0.1'
const STATIC_CACHE_NAME = 'ai-dashboard-static-v1.0.1'
const DYNAMIC_CACHE_NAME = 'ai-dashboard-dynamic-v1.0.1'

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/new-usecase',
  '/analytics',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html'
]

// API routes to cache
const API_ROUTES = [
  '/api/usecases',
  '/api/assessments',
  '/api/analytics',
  '/api/integrations'
]

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first for static assets
  CACHE_FIRST: 'cache-first',
  // Network first for API calls
  NETWORK_FIRST: 'network-first',
  // Stale while revalidate for dynamic content
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Static assets cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // IMPORTANT: Bypass Next.js internal assets and RSC/data fetches to avoid stale chunks
  // Let the network handle these without service worker interference
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/__nextjs_original-stack-frame_invariant') ||
    url.pathname.startsWith('/__nextjs_original-stack-frame')
  ) {
    return
  }
  
  // Determine caching strategy based on request type
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request))
  } else if (isApiRequest(request)) {
    event.respondWith(networkFirst(request))
  } else if (isPageRequest(request)) {
    event.respondWith(staleWhileRevalidate(request))
  } else {
    event.respondWith(networkFirst(request))
  }
})

// Cache first strategy for static assets
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('Cache first strategy failed:', error)
    return new Response('Network error', { status: 503 })
  }
}

// Network first strategy for API requests
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Network failed, trying cache:', error)
    
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'You are currently offline. Please check your connection.' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Stale while revalidate strategy for pages
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  }).catch(() => {
    // If network fails and no cache, return offline page
    if (!cachedResponse) {
      return caches.match('/offline.html')
    }
    return cachedResponse
  })
  
  return cachedResponse || fetchPromise
}

// Helper functions to determine request type
function isStaticAsset(request) {
  const url = new URL(request.url)
  // Exclude Next.js internal assets explicitly (defense-in-depth)
  if (url.pathname.startsWith('/_next/')) {
    return false
  }
  return url.pathname.match(/\.(css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)
}

function isApiRequest(request) {
  const url = new URL(request.url)
  return url.pathname.startsWith('/api/')
}

function isPageRequest(request) {
  const url = new URL(request.url)
  return url.pathname === '/' || 
         url.pathname.startsWith('/dashboard') ||
         url.pathname.startsWith('/new-usecase') ||
         url.pathname.startsWith('/analytics') ||
         url.pathname.startsWith('/integrations')
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag)
  
  if (event.tag === 'background-sync-usecase') {
    event.waitUntil(syncUseCases())
  } else if (event.tag === 'background-sync-assessment') {
    event.waitUntil(syncAssessments())
  }
})

// Sync use cases when back online
async function syncUseCases() {
  try {
    const pendingUseCases = await getPendingUseCases()
    
    for (const useCase of pendingUseCases) {
      try {
        await fetch('/api/usecases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(useCase)
        })
        
        // Remove from pending queue
        await removePendingUseCase(useCase.id)
        console.log('Synced use case:', useCase.id)
      } catch (error) {
        console.error('Failed to sync use case:', useCase.id, error)
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Sync assessments when back online
async function syncAssessments() {
  try {
    const pendingAssessments = await getPendingAssessments()
    
    for (const assessment of pendingAssessments) {
      try {
        await fetch('/api/assessments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assessment)
        })
        
        // Remove from pending queue
        await removePendingAssessment(assessment.id)
        console.log('Synced assessment:', assessment.id)
      } catch (error) {
        console.error('Failed to sync assessment:', assessment.id, error)
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('AI Dashboard', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked')
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  } else if (event.action === 'close') {
    // Just close the notification
    return
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})

// Helper functions for offline storage (using IndexedDB)
async function getPendingUseCases() {
  // Implementation would use IndexedDB
  return []
}

async function removePendingUseCase(id) {
  // Implementation would use IndexedDB
  return true
}

async function getPendingAssessments() {
  // Implementation would use IndexedDB
  return []
}

async function removePendingAssessment(id) {
  // Implementation would use IndexedDB
  return true
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent())
  }
})

async function syncContent() {
  try {
    // Sync critical content in the background
    console.log('Service Worker: Periodic sync triggered')
    
    // Update cache with latest content
    const response = await fetch('/api/sync')
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      await cache.put('/api/sync', response.clone())
    }
  } catch (error) {
    console.error('Periodic sync failed:', error)
  }
}

console.log('Service Worker: Loaded successfully')


