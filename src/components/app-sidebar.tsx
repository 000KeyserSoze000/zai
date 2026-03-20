"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronRight,
  Zap,
  Cpu,
  FolderOpen,
  BarChart3,
  Sliders,
  Bell,
  Settings,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Users,
  CreditCard,
  Crown,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/hooks/use-auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTranslation } from "@/lib/i18n"
import { LanguageSwitcher } from "@/components/language-switcher"
import { LogoutButton } from "@/components/logout-button"

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()
  const { t } = useTranslation()
  const {
    session,
    isAuthenticated,
    isLoading,
    isAdmin,
    isClient,
    subscription,
    sessionsUsed,
    sessionsLimit,
    sessionsRemaining,
    plan,
    isTrial
  } = useAuth()

  // Admin navigation items - using translation keys
  const ADMIN_NAV_ITEMS = [
    { id: "dashboard", href: "/admin", icon: LayoutDashboard, labelKey: "nav.dashboard", descKey: "nav.dashboardDesc" },
    { id: "users", href: "/admin/users", icon: Users, labelKey: "nav.users", descKey: "nav.usersDesc" },
    { id: "subscriptions", href: "/admin/subscriptions", icon: CreditCard, labelKey: "nav.subscriptions", descKey: "nav.subscriptionsDesc" },
    { id: "command-center", href: "/command-center", icon: Zap, labelKey: "nav.commandCenter", descKey: "nav.commandCenterDesc" },
    { id: "orchestrator", href: "/admin/orchestrator", icon: Cpu, labelKey: "nav.orchestrator", descKey: "nav.orchestratorDesc" },
    { id: "library", href: "/library", icon: FolderOpen, labelKey: "nav.library", descKey: "nav.libraryDesc" },
    { id: "analytics", href: "/analytics", icon: BarChart3, labelKey: "nav.analytics", descKey: "nav.analyticsDesc" },
    { id: "business-profile", href: "/settings/profile", icon: Sparkles, labelKey: "nav.businessProfile", descKey: "nav.businessProfileDesc" },
    { id: "settings", href: "/settings", icon: Settings, labelKey: "nav.settings", descKey: "nav.settingsDesc" },
  ]

  // Client navigation items
  const CLIENT_NAV_ITEMS = [
    { id: "dashboard", href: "/", icon: LayoutDashboard, labelKey: "nav.dashboard", descKey: "nav.mySpace" },
    { id: "command-center", href: "/command-center", icon: Zap, labelKey: "nav.contentStudio", descKey: "nav.contentStudioDesc" },
    { id: "library", href: "/library", icon: FolderOpen, labelKey: "nav.library", descKey: "nav.myContent" },
    { id: "analytics", href: "/analytics", icon: BarChart3, labelKey: "nav.analytics", descKey: "nav.myStats" },
    { id: "subscription", href: "/subscription", icon: CreditCard, labelKey: "nav.subscription", descKey: "nav.subscriptionDesc" },
    { id: "business-profile", href: "/settings/profile", icon: Sparkles, labelKey: "nav.businessProfile", descKey: "nav.businessProfileDesc" },
    { id: "settings", href: "/settings", icon: Sliders, labelKey: "nav.settings", descKey: "nav.myAccount" },
  ]

  // Choose navigation based on role
  const NAV_ITEMS = isAdmin ? ADMIN_NAV_ITEMS : CLIENT_NAV_ITEMS

  const getActiveSection = () => {
    // 1. Most specific rules first
    if (pathname.startsWith("/settings/profile")) return "business-profile"
    if (pathname.startsWith("/admin/orchestrator")) return "orchestrator"
    
    // 2. Generic matches for other specific modules
    if (pathname.startsWith("/admin/users")) return "users"
    if (pathname.startsWith("/admin/subscriptions")) return "subscriptions"
    if (pathname.startsWith("/command-center")) return "command-center"
    if (pathname.startsWith("/library")) return "library"
    if (pathname.startsWith("/analytics")) return "analytics"
    
    // 3. Settings fallback (must be after /settings/profile)
    if (pathname.startsWith("/settings")) return "settings"
    
    // 4. Dashboards
    if (pathname === "/" || pathname === "/admin") return "dashboard"
    
    return "dashboard"
  }

  const activeSection = getActiveSection()

  const getBreadcrumb = () => {
    if (pathname === "/" || pathname === "/admin") return isAdmin ? t("nav.dashboard") : t("nav.mySpace")
    if (pathname.startsWith("/admin/users")) return t("nav.users")
    if (pathname.startsWith("/admin/subscriptions")) return t("nav.subscriptions")
    if (pathname.startsWith("/command-center/content-studio")) return t("nav.contentStudio")
    if (pathname.startsWith("/command-center")) return t("nav.commandCenter")
    if (pathname.startsWith("/admin/orchestrator")) return t("nav.orchestrator")
    if (pathname.startsWith("/library")) return t("nav.library")
    if (pathname.startsWith("/analytics")) return t("nav.analytics")
    if (pathname.startsWith("/subscription")) return t("nav.mySubscription")
    if (pathname.startsWith("/settings/profile")) return t("nav.businessProfile")
    if (pathname.startsWith("/settings")) return t("nav.settings")
    return isAdmin ? t("nav.dashboard") : t("nav.mySpace")
  }

  // Auth pages - don't show sidebar
  const isAuthPage = pathname === '/login' || pathname === '/register'
  if (isAuthPage) {
    return <>{children}</>
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen bg-black items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-400 text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-72"} bg-neutral-900 border-r border-neutral-700 transition-all duration-300 fixed md:relative z-50 md:z-auto h-full`}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className={`${sidebarCollapsed ? "hidden" : "block"}`}>
              <h1 className="text-orange-500 font-bold text-lg tracking-wider">{t("common.appName")}</h1>
              <p className="text-neutral-500 text-xs">
                {isAdmin ? t("common.adminPanel") : `${t("common.plan")} ${plan?.name || 'Free'}`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-neutral-400 hover:text-orange-500"
            >
              <ChevronRight
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </Button>
          </div>

          <nav className="space-y-2 flex-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${activeSection === item.id
                    ? "bg-orange-500 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                  }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <div className="text-left">
                    <span className="text-sm font-medium block">{t(item.labelKey)}</span>
                    <span className={`text-xs ${activeSection === item.id ? "text-orange-100" : "text-neutral-500"}`}>{t(item.descKey)}</span>
                  </div>
                )}
              </Link>
            ))}
          </nav>

          {/* Subscription Info for Clients */}
          {!sidebarCollapsed && isClient && subscription && (
            <div className="mt-auto mb-4 p-4 bg-neutral-800 border border-neutral-700 rounded">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isTrial ? (
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <Crown className="w-4 h-4 text-orange-500" />
                  )}
                  <span className="text-xs text-white font-medium">
                    {isTrial ? t("stats.freeTrial") : plan?.name?.toUpperCase() || t("common.plan")}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">{t("common.sessionsThisMonth")}</span>
                  <span className="text-white font-mono">{sessionsUsed} / {sessionsLimit}</span>
                </div>
                <Progress
                  value={(sessionsUsed / sessionsLimit) * 100}
                  className="h-1.5 bg-neutral-700"
                />
                <div className="text-xs text-neutral-500">
                  {sessionsRemaining} {t("common.sessionsRemaining")}
                </div>
              </div>
            </div>
          )}

          {/* Admin Stats */}
          {!sidebarCollapsed && isAdmin && (
            <div className="mt-auto p-4 bg-neutral-800 border border-neutral-700 rounded">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-white font-medium">{t("stats.systemStats")}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">{t("stats.users")}</span>
                  <span className="text-white font-mono">--</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">{t("stats.sessionsThisMonth")}</span>
                  <span className="text-white font-mono">--</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">{t("stats.revenue")}</span>
                  <span className="text-green-400 font-mono">--</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarCollapsed(true)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-black overflow-hidden">
        {/* Top Toolbar */}
        <div className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-400">
              {t("common.appName")} / <span className="text-orange-500">{getBreadcrumb()}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="w-8 h-8 bg-neutral-700 rounded-full animate-pulse" />
            ) : isAuthenticated ? (
              <>
                {/* Credits/Session indicator for clients */}
                {isClient && (
                  <div className="hidden md:flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 rounded text-orange-400">
                      <Zap className="w-3 h-3" />
                      <span>{sessionsRemaining} {t("common.sessions")}</span>
                    </div>
                  </div>
                )}

                {/* API Status */}
                <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded text-green-400 text-xs">
                  <TrendingUp className="w-3 h-3" />
                  <span>{t("common.apiOk")}</span>
                </div>

                {/* Language Switcher */}
                <LanguageSwitcher />

                <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
                  <Bell className="w-4 h-4" />
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 text-neutral-300 hover:text-white">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="bg-orange-500/20 text-orange-500 text-xs">
                          {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline text-sm">
                        {session?.user?.name || session?.user?.email?.split('@')[0]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-neutral-900 border-neutral-700">
                    <DropdownMenuLabel className="text-neutral-400">
                      {session?.user?.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-neutral-700" />
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer text-neutral-300 hover:text-white">
                        <Settings className="w-4 h-4 mr-2" />
                        {t("auth.settings")}
                      </Link>
                    </DropdownMenuItem>
                    {isClient && (
                      <DropdownMenuItem asChild>
                        <Link href="/subscription" className="cursor-pointer text-neutral-300 hover:text-white">
                          <CreditCard className="w-4 h-4 mr-2" />
                          {t("auth.mySubscription")}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-neutral-700" />
                    <div className="px-1 py-1">
                      <LogoutButton />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : null}
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
