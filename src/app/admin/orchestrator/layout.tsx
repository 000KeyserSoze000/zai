"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { 
  FolderOpen, Bot, Zap, Hammer, 
  LayoutDashboard, History, Calendar, Terminal,
  Box
} from "lucide-react"
import { cn } from "@/lib/utils"

import { useTranslation } from "@/lib/i18n"

export default function OrchestratorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { t } = useTranslation()

  const NAV_ITEMS = [
    {
      name: t("nav.categories"),
      href: "/admin/orchestrator/categories",
      icon: FolderOpen,
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
    {
      name: t("nav.playground"),
      href: "/admin/orchestrator/playground",
      icon: Terminal,
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    },
    {
      name: t("nav.agents"),
      href: "/admin/orchestrator/agents",
      icon: Bot,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      name: t("nav.skills"),
      href: "/admin/orchestrator/skills",
      icon: Zap,
      color: "text-orange-500",
      bg: "bg-orange-500/10"
    },
    {
      name: t("nav.escCollection"),
      href: "/admin/orchestrator/esc-collection",
      icon: Box,
      color: "text-orange-400",
      bg: "bg-orange-400/10"
    },
    {
      name: t("nav.tools"),
      href: "/admin/orchestrator/tools",
      icon: Hammer,
      color: "text-green-500",
      bg: "bg-green-500/10"
    },
    {
      name: t("nav.scheduler"),
      href: "/admin/orchestrator/scheduler",
      icon: Calendar,
      color: "text-pink-500",
      bg: "bg-pink-500/10"
    },
    {
      name: t("nav.observability"),
      href: "/admin/orchestrator/observability",
      icon: History,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10"
    }
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="bg-black border-b border-neutral-800 px-6 pt-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{t("orchestrator.adminTitle")}</h1>
              <p className="text-xs text-neutral-500 uppercase tracking-widest font-medium">{t("orchestrator.professionalMode")}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-t-lg text-sm font-medium transition-all duration-200 border-b-2",
                    isActive 
                      ? "text-white border-purple-500 bg-neutral-900" 
                      : "text-neutral-500 border-transparent hover:text-neutral-300 hover:bg-neutral-900/50"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? item.color : "text-neutral-500")} />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-black">
        {children}
      </div>
    </div>
  )
}
