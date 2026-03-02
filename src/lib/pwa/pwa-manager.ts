export interface PWAConfig {
  name: string
  shortName: string
  description: string
  themeColor: string
  backgroundColor: string
  display: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser'
  orientation: 'portrait' | 'landscape' | 'any'
  scope: string
  startUrl: string
  icons: {
    src: string
    sizes: string
    type: string
    purpose?: 'any' | 'maskable' | 'monochrome'
  }[]
  shortcuts?: {
    name: string
    shortName: string
    description: string
    url: string
    icons: {
      src: string
      sizes: string
    }[]
  }[]
  categories: string[]
  lang: string
  dir: 'ltr' | 'rtl' | 'auto'
}

export interface PWAInstallPrompt {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface PWAEvent {
  type: 'install' | 'update' | 'offline' | 'online' | 'sync' | 'push'
  data?: any
}

export interface PWAMetrics {
  installCount: number
  updateCount: number
  offlineUsage: number
  onlineUsage: number
  lastUsed: Date
  totalUsageTime: number
}

export class PWAManager {
  private config: PWAConfig
  private installPrompt: PWAInstallPrompt | null = null
  private metrics: PWAMetrics
  private eventListeners: Map<string, ((event: PWAEvent) => void)[]> = new Map()
  private isInstalled = false
  private isOnline = true
  private registration: ServiceWorkerRegistration | null = null

  constructor(config: PWAConfig) {
    this.config = config
    this.metrics = {
      installCount: 0,
      updateCount: 0,
      offlineUsage: 0,
      onlineUsage: 0,
      lastUsed: new Date(),
      totalUsageTime: 0,
    }

    this.initialize()
  }

  private async initialize(): Promise<void> {
    // Check if PWA is already installed
    this.isInstalled = this.checkIfInstalled()

    // Register service worker
    await this.registerServiceWorker()

    // Set up install prompt
    this.setupInstallPrompt()

    // Set up online/offline listeners
    this.setupNetworkListeners()

    // Set up visibility change listener
    this.setupVisibilityListener()

    // Load metrics from storage
    await this.loadMetrics()
  }

  private checkIfInstalled(): boolean {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true
    }

    // Check if running in fullscreen mode
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
      return true
    }

    // Check if running in minimal-ui mode
    if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      return true
    }

    return false
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: this.config.scope,
        })

        console.log('Service Worker registered:', this.registration)

        // Listen for updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration!.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.emit('update', { registration: this.registration })
                this.metrics.updateCount++
                this.saveMetrics()
              }
            })
          }
        })

        // Listen for controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          this.emit('update', { registration: this.registration })
        })

      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }
  }

  private setupInstallPrompt(): void {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.installPrompt = {
        prompt: () => e.prompt(),
        userChoice: e.userChoice,
      }
      this.emit('install', { prompt: this.installPrompt })
    })

    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true
      this.metrics.installCount++
      this.saveMetrics()
      this.emit('install', { installed: true })
    })
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.metrics.onlineUsage++
      this.saveMetrics()
      this.emit('online', { online: true })
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.metrics.offlineUsage++
      this.saveMetrics()
      this.emit('offline', { online: false })
    })
  }

  private setupVisibilityListener(): void {
    let startTime = Date.now()

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // App became hidden, record usage time
        const usageTime = Date.now() - startTime
        this.metrics.totalUsageTime += usageTime
        this.saveMetrics()
      } else {
        // App became visible, start new session
        startTime = Date.now()
        this.metrics.lastUsed = new Date()
        this.saveMetrics()
      }
    })
  }

  // Public methods
  async install(): Promise<boolean> {
    if (!this.installPrompt) {
      return false
    }

    try {
      await this.installPrompt.prompt()
      const choiceResult = await this.installPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        this.metrics.installCount++
        this.saveMetrics()
        return true
      }
      
      return false
    } catch (error) {
      console.error('Installation failed:', error)
      return false
    }
  }

  async update(): Promise<void> {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  async uninstall(): Promise<void> {
    if (this.registration) {
      await this.registration.unregister()
      this.registration = null
    }
  }

  async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
    }
  }

  async getCacheSize(): Promise<number> {
    if (!('caches' in window)) {
      return 0
    }

    let totalSize = 0
    const cacheNames = await caches.keys()

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      const requests = await cache.keys()

      for (const request of requests) {
        const response = await cache.match(request)
        if (response) {
          const blob = await response.blob()
          totalSize += blob.size
        }
      }
    }

    return totalSize
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission
    }
    return 'denied'
  }

  async sendNotification(title: string, options?: NotificationOptions): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: this.config.icons[0]?.src,
        badge: this.config.icons[0]?.src,
        ...options,
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    }
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration || !('PushManager' in window)) {
      return null
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.getVapidPublicKey(),
      })

      return subscription
    } catch (error) {
      console.error('Push subscription failed:', error)
      return null
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.registration) {
      return false
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        return true
      }
      return false
    } catch (error) {
      console.error('Push unsubscription failed:', error)
      return false
    }
  }

  async getPushSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null
    }

    try {
      return await this.registration.pushManager.getSubscription()
    } catch (error) {
      console.error('Get push subscription failed:', error)
      return null
    }
  }

  // Event handling
  on(event: string, callback: (event: PWAEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: (event: PWAEvent) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        callback({ type: event as any, data })
      })
    }
  }

  // Metrics and storage
  private async loadMetrics(): Promise<void> {
    try {
      const stored = localStorage.getItem('pwa-metrics')
      if (stored) {
        this.metrics = { ...this.metrics, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error('Failed to load PWA metrics:', error)
    }
  }

  private async saveMetrics(): Promise<void> {
    try {
      localStorage.setItem('pwa-metrics', JSON.stringify(this.metrics))
    } catch (error) {
      console.error('Failed to save PWA metrics:', error)
    }
  }

  getMetrics(): PWAMetrics {
    return { ...this.metrics }
  }

  // Utility methods
  private getVapidPublicKey(): string {
    // This should be your VAPID public key
    return 'BEl62iUYgUivxIkv69yViEuiBIa40HI0YyQ0S4gU8KQ'
  }

  // Getters
  get isPWAInstalled(): boolean {
    return this.isInstalled
  }

  get isOnlineStatus(): boolean {
    return this.isOnline
  }

  get canInstall(): boolean {
    return this.installPrompt !== null
  }

  get hasUpdate(): boolean {
    return this.registration?.waiting !== undefined
  }

  get config(): PWAConfig {
    return this.config
  }

  get registration(): ServiceWorkerRegistration | null {
    return this.registration
  }
}

// Default PWA configuration
export const defaultPWAConfig: PWAConfig = {
  name: 'AI Use Case Dashboard',
  shortName: 'AI Dashboard',
  description: 'Comprehensive AI use case management and governance platform',
  themeColor: '#6366f1',
  backgroundColor: '#ffffff',
  display: 'standalone',
  orientation: 'portrait-primary',
  scope: '/',
  startUrl: '/',
  icons: [
    {
      src: '/icons/icon-72x72.png',
      sizes: '72x72',
      type: 'image/png',
      purpose: 'maskable any',
    },
    {
      src: '/icons/icon-96x96.png',
      sizes: '96x96',
      type: 'image/png',
      purpose: 'maskable any',
    },
    {
      src: '/icons/icon-128x128.png',
      sizes: '128x128',
      type: 'image/png',
      purpose: 'maskable any',
    },
    {
      src: '/icons/icon-144x144.png',
      sizes: '144x144',
      type: 'image/png',
      purpose: 'maskable any',
    },
    {
      src: '/icons/icon-152x152.png',
      sizes: '152x152',
      type: 'image/png',
      purpose: 'maskable any',
    },
    {
      src: '/icons/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable any',
    },
    {
      src: '/icons/icon-384x384.png',
      sizes: '384x384',
      type: 'image/png',
      purpose: 'maskable any',
    },
    {
      src: '/icons/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable any',
    },
  ],
  shortcuts: [
    {
      name: 'New Use Case',
      shortName: 'New Use Case',
      description: 'Create a new AI use case',
      url: '/new-usecase',
      icons: [
        {
          src: '/icons/shortcut-new-usecase.png',
          sizes: '96x96',
        },
      ],
    },
    {
      name: 'Dashboard',
      shortName: 'Dashboard',
      description: 'View the main dashboard',
      url: '/dashboard',
      icons: [
        {
          src: '/icons/shortcut-dashboard.png',
          sizes: '96x96',
        },
      ],
    },
    {
      name: 'Analytics',
      shortName: 'Analytics',
      description: 'View analytics and reports',
      url: '/analytics',
      icons: [
        {
          src: '/icons/shortcut-analytics.png',
          sizes: '96x96',
        },
      ],
    },
  ],
  categories: ['productivity', 'business', 'utilities'],
  lang: 'en',
  dir: 'ltr',
}

// Create singleton instance
export const pwaManager = new PWAManager(defaultPWAConfig)


