'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  ShieldCheck,
  Building,
  DollarSign,
  FileText,
  Shield,
  Home,
  Settings,
  HelpCircle,
  Code2,
  Cog,
  GraduationCap,
  Leaf,
  Eye,
  Building2,
  MoreVertical,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { Button } from './button';
import { useUserData } from '@/contexts/UserContext';
import Image from 'next/image';
import ThemeToggle from './theme-toggle';

interface NavigationItem {
  title: string;
  href?: string;
  icon: React.ComponentType<any>;
  description: string;
  isAdmin?: boolean;
  children?: NavigationItem[];
  isCollapsible?: boolean;
  section?: string;
}

const navigationItems: NavigationItem[] = [
  // Top-level (no section)
  {
    title: 'Executive Dashboard',
    href: '/dashboard/executive',
    icon: LayoutDashboard,
    description: 'Executive Overview'
  },

  // INVENTORY
  {
    title: 'Use Cases',
    href: '/dashboard',
    icon: Home,
    description: 'AI Use Cases',
    section: 'Inventory'
  },
  {
    title: 'Production',
    href: '/dashboard/production',
    icon: Activity,
    description: 'Production Monitoring'
  },

  // ASSURANCE
  {
    title: 'Risk Management',
    href: '/dashboard/risks',
    icon: ShieldCheck,
    description: 'Risk Assessment',
    section: 'Assurance'
  },
  {
    title: 'Threat Modeling',
    href: '/dashboard/threats',
    icon: AlertTriangle,
    description: 'STRIDE Threat Analysis'
  },
  {
    title: 'FinOps Dashboard',
    href: '/dashboard/finops-dashboard',
    icon: DollarSign,
    description: 'Financial Operations'
  },

  // GOVERNANCE
  {
    title: 'Governance',
    href: '/dashboard/governance',
    icon: Shield,
    description: 'Compliance & Governance',
    section: 'Governance'
  },
  {
    title: 'Vendor Assessment',
    href: '/dashboard/vendor-assessment',
    icon: Building,
    description: 'Vendor Evaluation'
  },
  {
    title: 'Policy Center',
    href: '/dashboard/policy-center',
    icon: FileText,
    description: 'Policy Management'
  },
];

interface SidebarLayoutProps {
  children: React.ReactNode;
}

function SidebarLayoutContent({ children }: SidebarLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const pathname = usePathname();
  const { userData } = useUserData();

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
    // Wait a bit for user data to be loaded
    const timer = setTimeout(() => {
      setDataReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Track previous pathname to detect actual navigation
  const prevPathnameRef = useRef(pathname);

  // Auto-close Organization Setup panel when navigating away from its sub-items
  useEffect(() => {
    if (dataReady && userData) {
      // Only check if pathname actually changed (not on initial render or menu state change)
      const pathnameChanged = prevPathnameRef.current !== pathname;
      
      if (pathnameChanged && expandedMenu === 'Organization Setup') {
        // Check if current path matches any Organization Setup sub-item
        const orgSetupPaths = [
          '/dashboard/configure-questions',
          '/dashboard/configure-models',
          '/dashboard/governance-setup',
          '/dashboard/training',
          '/dashboard/oversight',
          '/dashboard/sustainability'
        ];
        const isOrgSetupPath = orgSetupPaths.some(path => 
          pathname === path || pathname.startsWith(path)
        );
        
        // If we navigated away from Organization Setup pages, close the panel
        if (!isOrgSetupPath) {
          setExpandedMenu(null);
        }
      }
      
      // Update previous pathname
      prevPathnameRef.current = pathname;
    }
  }, [pathname, dataReady, userData, expandedMenu]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (isCollapsed) {
      // If collapsing, also close expanded menu
      setExpandedMenu(null);
    }
  };

  const toggleMenu = (menuTitle: string) => {
    setExpandedMenu(expandedMenu === menuTitle ? null : menuTitle);
  };

  // Organization Setup sub-items
  const organizationSetupItems: NavigationItem[] = [
    ...(userData?.role === 'ORG_ADMIN'
      ? [{
          title: 'Configure Questions',
          href: '/dashboard/configure-questions',
          icon: HelpCircle,
          description: 'Question Management',
          isAdmin: true
        }]
      : []),
    {
      title: 'Configure Models',
      href: '/dashboard/configure-models',
      icon: Code2,
      description: 'Model Management'
    },
    {
      title: 'Governance Setup',
      href: '/dashboard/governance-setup',
      icon: Cog,
      description: 'Governance Configuration'
    },
    {
      title: 'Training & Competency',
      href: '/dashboard/training',
      icon: GraduationCap,
      description: 'AI Training Programs'
    },
    {
      title: 'Oversight & Monitoring',
      href: '/dashboard/oversight',
      icon: Eye,
      description: 'Governance Control Tower'
    },
    {
      title: 'Sustainable AI',
      href: '/dashboard/sustainability',
      icon: Leaf,
      description: 'Environmental Impact'
    }
  ];

  // Organization Setup parent item
  const organizationSetupItem: NavigationItem = {
    title: 'Organization Setup',
    icon: Building2,
    description: 'Organization Configuration',
    isCollapsible: true,
    children: organizationSetupItems
  };
  
  // Build sidebar items
  const sidebarItems: NavigationItem[] = [
    ...(userData?.role === 'ORG_ADMIN'
      ? [organizationSetupItem]
      : []),
    ...navigationItems
  ];

  // Don't render until mounted and data is ready to prevent hydration mismatch
  if (!mounted || !dataReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
      </div>
    );
  }

  // Check if current path matches any Organization Setup sub-item (for styling only)
  const isOrgSetupActive = organizationSetupItems.some(item => 
    item.href && (pathname === item.href || pathname.startsWith(item.href))
  );
  // Only show secondary panel when explicitly clicked, not auto-expanded
  const isOrgSetupExpanded = expandedMenu === 'Organization Setup';

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className={`${isCollapsed ? 'w-16' : 'w-56'} bg-card border-r border-border shadow-sm transition-all duration-300 ease-in-out flex flex-col font-brandSans`}>
        {/* Logo and Brand */}
        <div className="border-b border-border h-[60px] flex items-center overflow-hidden">
          {isCollapsed ? (
            <div className="flex flex-col items-center justify-start gap-1.5 pt-2.5 pb-1.5 px-1.5 w-full h-full">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md bg-white shrink-0 overflow-hidden">
                <Image src="https://vgwacd4qotpurdv6.public.blob.vercel-storage.com/logo/logo.png" alt="Logo" width={32} height={32} className="object-contain w-full h-full" priority />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="p-0.5 hover:bg-muted rounded-lg transition-colors shrink-0 h-auto min-h-0"
              >
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col justify-center gap-1 px-3 py-2 w-full h-full">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md bg-card">
                  <Image src="https://vgwacd4qotpurdv6.public.blob.vercel-storage.com/logo/logo.png" alt="Logo" width={32} height={32} className="object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-foreground leading-tight">QUBE</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">AI Platform</span>
                </div>
                <div className="flex-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSidebar}
                    className="p-1 hover:bg-muted rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              {(userData?.role === 'ORG_ADMIN' || userData?.role === 'ORG_USER') && userData?.organization?.name && (
                <div className="px-2.5">
                  <span className="text-[10px] text-muted-foreground leading-tight font-medium truncate block">
                    {userData.organization.name}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 p-2 ${isCollapsed ? 'space-y-2' : 'space-y-1'} overflow-y-auto main-sidebar-nav`}>
          {sidebarItems.map((item) => {
            const isActive = item.href && (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)));
            const Icon = item.icon;
            const isCollapsible = item.isCollapsible && item.children;
            const isExpanded = isCollapsible && (item.title === 'Organization Setup' ? isOrgSetupExpanded : expandedMenu === item.title);

            const sectionHeader = item.section ? (
              !isCollapsed ? (
                <div className="pt-4 pb-1 px-3" key={`section-${item.section}`}>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {item.section}
                  </span>
                </div>
              ) : (
                <div className="my-1.5 mx-2 border-t border-border" key={`section-${item.section}`} />
              )
            ) : null;

            if (isCollapsible) {
              if (isCollapsed) {
                // When collapsed, show just the icon
                return (
                  <React.Fragment key={item.title}>
                  {sectionHeader}
                  <button
                    onClick={() => {
                      setIsCollapsed(false);
                      // Small delay to ensure sidebar expands first, then open menu
                      setTimeout(() => toggleMenu(item.title), 100);
                    }}
                    className={`
                      w-full flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 group
                      ${isOrgSetupActive 
                        ? 'bg-primary/10 text-primary shadow-sm' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-sm'
                      }
                    `}
                    title={item.title}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isOrgSetupActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                  </button>
                  </React.Fragment>
                );
              }

              // When expanded, show full menu item with chevron
              return (
                <React.Fragment key={item.title}>
                  {sectionHeader}
                  <div>
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group
                      ${isOrgSetupActive 
                        ? 'bg-primary/10 text-primary shadow-sm border-l-4 border-primary font-medium' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-sm'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isOrgSetupActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium leading-tight">{item.title}</span>
                    </div>
                  </button>
                  </div>
                </React.Fragment>
              );
            }

            if (!item.href) return null;

            return (
              <React.Fragment key={item.href}>
              {sectionHeader}
              <Link href={item.href}>
                <div className={`
                  ${isCollapsed ? 'flex flex-col items-center justify-center p-2' : 'flex items-center gap-2 px-3 py-2'} 
                  rounded-lg transition-all duration-200 group
                  ${isActive 
                    ? 'bg-primary/10 text-primary shadow-sm border-l-4 border-primary' 
                    : item.isAdmin 
                      ? 'bg-accent/10 text-accent-foreground border-l-4 border-accent hover:bg-accent/20'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-sm'
                  }
                `}>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : item.isAdmin ? 'text-accent-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
                  {!isCollapsed && (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium leading-tight">{item.title}</span>
                      {item.isAdmin && (
                        <span className="text-[10px] text-accent-foreground font-normal leading-snug">Admin Only</span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Settings and Help Buttons */}
        <div className="p-2 border-t border-border space-y-1">
          <button
            onClick={() => {
              // TODO: Add settings functionality
              console.log('Settings button clicked');
            }}
            className={`
              w-full ${isCollapsed ? 'flex flex-col items-center justify-center p-2' : 'flex items-center gap-2 px-2.5 py-1.5'} 
              rounded-lg transition-all duration-200 group
              text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-sm
            `}
          >
            <Settings className={`w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:text-foreground`} />
            {!isCollapsed && (
              <span className="text-xs font-normal leading-tight">Settings</span>
            )}
          </button>
          
          <button
            onClick={() => {
              // TODO: Add help functionality
              console.log('Help button clicked');
            }}
            className={`
              w-full ${isCollapsed ? 'flex flex-col items-center justify-center p-2' : 'flex items-center gap-2 px-2.5 py-1.5'} 
              rounded-lg transition-all duration-200 group
              text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-sm
            `}
          >
            <HelpCircle className={`w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:text-foreground`} />
            {!isCollapsed && (
              <span className="text-xs font-normal leading-tight">Help</span>
            )}
          </button>
        </div>

        {/* User Info and Theme Toggle */}
        <div className="border-t border-border">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2 p-2">
              <ThemeToggle />
            </div>
          ) : (
            <div className="px-2.5 py-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {userData?.firstName && userData?.lastName
                      ? `${userData.firstName} ${userData.lastName}`
                      : userData?.email || 'User'}
                  </p>
                  {userData?.role && (
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {userData.role === 'ORG_ADMIN' ? 'Admin' : userData.role === 'ORG_USER' ? 'User' : userData.role === 'QZEN_ADMIN' ? 'Admin' : userData.role}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Side Panel for Organization Setup */}
      {isOrgSetupExpanded && !isCollapsed && userData?.role === 'ORG_ADMIN' && (
        <div className="w-64 bg-card border-r border-border shadow-sm transition-all duration-300 ease-in-out flex flex-col">
          <div className="border-b border-border p-2 flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedMenu(null)}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
          <nav className="flex-1 p-2 overflow-y-auto">
            {organizationSetupItems.map((subItem) => {
              const isSubActive = subItem.href && (pathname === subItem.href || pathname.startsWith(subItem.href));
              const SubIcon = subItem.icon;
              
              return (
                <Link key={subItem.href} href={subItem.href || '#'}>
                    <div className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                    ${isSubActive 
                      ? 'bg-primary/10 text-primary shadow-sm border-l-4 border-primary font-medium' 
                      : subItem.isAdmin 
                        ? 'bg-accent/10 text-accent-foreground border-l-4 border-accent hover:bg-accent/20'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-sm'
                    }
                  `}>
                    <SubIcon className={`w-5 h-5 flex-shrink-0 ${isSubActive ? 'text-primary' : subItem.isAdmin ? 'text-accent-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium leading-tight">{subItem.title}</span>
                      {subItem.isAdmin && (
                        <span className="text-xs text-accent-foreground font-medium">Admin Only</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Breadcrumb Navigation */}
        <nav className="bg-card border-b border-border px-6 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            {(() => {
              // Check Organization Setup sub-items first
              const activeSubItem = organizationSetupItems.find(item => 
                item.href && (pathname === item.href || pathname.startsWith(item.href))
              );
              if (activeSubItem) {
                return (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-foreground">
                      <activeSubItem.icon className="w-3.5 h-3.5" />
                      <span>{activeSubItem.title}</span>
                    </div>
                  </>
                );
              }
              
              // Then check main sidebar items - handle nested routes like /dashboard/[useCaseId]/risks
              const activeItem = sidebarItems.find(item => {
                if (!item.href || item.href === '/dashboard') return false;
                // For exact match
                if (pathname === item.href) return true;
                // For nested routes, check if pathname matches the pattern
                // e.g., /dashboard/[useCaseId]/risks should match /dashboard/risks
                const routeSegment = item.href.replace('/dashboard/', '');
                if (routeSegment && pathname.includes(`/${routeSegment}`)) {
                  return true;
                }
                // Also check if pathname starts with item.href
                if (pathname.startsWith(item.href)) {
                  return true;
                }
                return false;
              });
              
              if (activeItem && activeItem.href !== '/dashboard') {
                const Icon = activeItem.icon;
                return (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-foreground">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{activeItem.title}</span>
                    </div>
                  </>
                );
              }
              
              return null;
            })()}
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  return <SidebarLayoutContent>{children}</SidebarLayoutContent>;
}