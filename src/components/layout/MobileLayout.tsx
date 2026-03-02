import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { EnhancedBadge } from '@/components/ui/enhanced-badge'
import { 
  Menu, 
  X, 
  Home, 
  Plus, 
  BarChart3, 
  Users, 
  Settings, 
  Bell,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Tablet,
  Monitor,
  Wifi,
  WifiOff,
  Battery,
  Signal
} from 'lucide-react'

export interface MobileLayoutProps {
  children: React.ReactNode
  currentPath?: string
  onNavigate?: (path: string) => void
  onSearch?: (query: string) => void
  onFilter?: (filters: Record<string, any>) => void
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  currentPath = '/',
  onNavigate,
  onSearch,
  onFilter,
}) => {
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [isSearchOpen, setSearchOpen] = useState(false)
  const [isFilterOpen, setFilterOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [deviceInfo, setDeviceInfo] = useState({
    isOnline: true,
    batteryLevel: 100,
    connectionType: 'wifi',
    deviceType: 'mobile',
  })

  useEffect(() => {
    // Detect device type
    const detectDeviceType = () => {
      const width = window.innerWidth
      if (width < 768) return 'mobile'
      if (width < 1024) return 'tablet'
      return 'desktop'
    }

    // Monitor online status
    const updateOnlineStatus = () => {
      setDeviceInfo(prev => ({
        ...prev,
        isOnline: navigator.onLine,
      }))
    }

    // Monitor battery level (if supported)
    const updateBatteryInfo = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery()
          setDeviceInfo(prev => ({
            ...prev,
            batteryLevel: Math.round(battery.level * 100),
          }))
        } catch (error) {
          console.log('Battery API not supported')
        }
      }
    }

    // Monitor connection type
    const updateConnectionInfo = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      if (connection) {
        setDeviceInfo(prev => ({
          ...prev,
          connectionType: connection.effectiveType || 'unknown',
        }))
      }
    }

    // Initial setup
    setDeviceInfo(prev => ({
      ...prev,
      deviceType: detectDeviceType(),
    }))

    // Event listeners
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    window.addEventListener('resize', () => {
      setDeviceInfo(prev => ({
        ...prev,
        deviceType: detectDeviceType(),
      }))
    })

    // Initial updates
    updateOnlineStatus()
    updateBatteryInfo()
    updateConnectionInfo()

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
    { id: 'new-usecase', label: 'New Use Case', icon: Plus, path: '/new-usecase' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { id: 'team', label: 'Team', icon: Users, path: '/team' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ]

  const handleNavigation = (path: string) => {
    setMenuOpen(false)
    onNavigate?.(path)
  }

  const handleSearch = () => {
    setSearchOpen(!isSearchOpen)
    if (isSearchOpen && searchQuery) {
      onSearch?.(searchQuery)
      setSearchQuery('')
    }
  }

  const handleFilter = () => {
    setFilterOpen(!isFilterOpen)
    if (isFilterOpen) {
      onFilter?.({})
    }
  }

  const getDeviceIcon = () => {
    switch (deviceInfo.deviceType) {
      case 'mobile': return <Smartphone className="h-4 w-4" />
      case 'tablet': return <Tablet className="h-4 w-4" />
      case 'desktop': return <Monitor className="h-4 w-4" />
      default: return <Smartphone className="h-4 w-4" />
    }
  }

  const getConnectionIcon = () => {
    if (!deviceInfo.isOnline) return <WifiOff className="h-4 w-4 text-red-500" />
    
    switch (deviceInfo.connectionType) {
      case 'wifi': return <Wifi className="h-4 w-4 text-green-500" />
      case '4g': return <Signal className="h-4 w-4 text-blue-500" />
      case '3g': return <Signal className="h-4 w-4 text-yellow-500" />
      case '2g': return <Signal className="h-4 w-4 text-orange-500" />
      default: return <Signal className="h-4 w-4 text-gray-500" />
    }
  }

  const getBatteryColor = () => {
    if (deviceInfo.batteryLevel > 50) return 'text-green-500'
    if (deviceInfo.batteryLevel > 20) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <EnhancedButton
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(!isMenuOpen)}
              className="md:hidden"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </EnhancedButton>
            
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">AI Dashboard</h1>
              <EnhancedBadge variant="outline" className="text-xs">
                {deviceInfo.deviceType}
              </EnhancedBadge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Device Status */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              {getConnectionIcon()}
              <Battery className={`h-4 w-4 ${getBatteryColor()}`} />
              <span>{deviceInfo.batteryLevel}%</span>
            </div>

            {/* Search Button */}
            <EnhancedButton
              variant="ghost"
              size="icon"
              onClick={handleSearch}
            >
              <Search className="h-5 w-5" />
            </EnhancedButton>

            {/* Filter Button */}
            <EnhancedButton
              variant="ghost"
              size="icon"
              onClick={handleFilter}
            >
              <Filter className="h-5 w-5" />
            </EnhancedButton>

            {/* Notifications */}
            <EnhancedButton
              variant="ghost"
              size="icon"
              className="relative"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </EnhancedButton>
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search use cases, assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Filter Bar */}
        {isFilterOpen && (
          <div className="px-4 pb-4">
            <div className="flex gap-2">
              <select className="flex-1 px-3 py-2 border rounded-lg bg-background text-sm">
                <option value="">All Categories</option>
                <option value="ai">AI/ML</option>
                <option value="automation">Automation</option>
                <option value="analytics">Analytics</option>
              </select>
              <select className="flex-1 px-3 py-2 border rounded-lg bg-background text-sm">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-80 bg-background border-r shadow-lg">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Navigation</h2>
                <EnhancedButton
                  variant="ghost"
                  size="icon"
                  onClick={() => setMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </EnhancedButton>
              </div>

              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPath === item.path
                  
                  return (
                    <EnhancedButton
                      key={item.id}
                      variant={isActive ? "default" : "ghost"}
                      onClick={() => handleNavigation(item.path)}
                      className="w-full justify-start"
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {item.label}
                    </EnhancedButton>
                  )
                })}
              </nav>

              {/* Device Info */}
              <div className="mt-8 p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-3">Device Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Device:</span>
                    <div className="flex items-center gap-1">
                      {getDeviceIcon()}
                      <span className="capitalize">{deviceInfo.deviceType}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Connection:</span>
                    <div className="flex items-center gap-1">
                      {getConnectionIcon()}
                      <span className="capitalize">{deviceInfo.connectionType}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Battery:</span>
                    <div className="flex items-center gap-1">
                      <Battery className={`h-4 w-4 ${getBatteryColor()}`} />
                      <span>{deviceInfo.batteryLevel}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <EnhancedBadge className={deviceInfo.isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {deviceInfo.isOnline ? 'Online' : 'Offline'}
                    </EnhancedBadge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t shadow-lg md:hidden">
        <div className="flex items-center justify-around py-2">
          {navigationItems.slice(0, 5).map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.path
            
            return (
              <EnhancedButton
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation(item.path)}
                className={`flex flex-col items-center gap-1 px-3 py-2 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </EnhancedButton>
            )
          })}
        </div>
      </div>

      {/* Offline Banner */}
      {!deviceInfo.isOnline && (
        <div className="fixed top-16 left-0 right-0 z-30 bg-red-500 text-white text-center py-2 text-sm">
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span>You're offline. Some features may be limited.</span>
          </div>
        </div>
      )}

      {/* PWA Install Prompt */}
      <div className="fixed bottom-20 left-4 right-4 z-30 md:hidden">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Install App</h3>
                <p className="text-sm opacity-90">Get quick access to the AI Dashboard</p>
              </div>
              <EnhancedButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  // Trigger PWA install prompt
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(() => {
                      // Show install prompt
                    })
                  }
                }}
              >
                Install
              </EnhancedButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default MobileLayout


