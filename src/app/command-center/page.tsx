"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
    Clapperboard,
    TrendingUp,
    Target,
    FileText,
    Share2,
    ArrowRight,
    Sparkles,
    Zap,
    Loader2,
    Lock,
    LayoutGrid,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/i18n"
import type { AgentCategory } from "@/lib/types"
import { ShoppingCart, GraduationCap, ChevronLeft, Search } from "lucide-react"

interface SubModule {
    id: string
    nameKey: string
    descKey: string
    icon: React.ComponentType<{ className?: string }>
}

// Fallback modules if API fails
const FALLBACK_MODULES = [
    {
        id: "content-studio",
        nameKey: "categories.content-studio",
        descKey: "modules.contentStudio.description",
        icon: Clapperboard,
        color: "orange",
        href: "/command-center/content-studio",
        featureKeys: ["modules.contentStudio.features.thumbnails", "modules.contentStudio.features.seo", "modules.contentStudio.features.social"],
        version: "v1.1",
        subModules: [
            { id: "video-script", nameKey: "modules.content.video-script.name", descKey: "modules.content.video-script.desc", icon: FileText },
            { id: "thumbnail", nameKey: "modules.content.thumbnail-master.name", descKey: "modules.content.thumbnail-master.desc", icon: Sparkles },
            { id: "seo", nameKey: "modules.content.seo-metadata.name", descKey: "modules.content.seo-metadata.desc", icon: Search },
            { id: "voiceover", nameKey: "modules.content.voiceover-pro.name", descKey: "modules.content.voiceover-pro.desc", icon: Zap },
            { id: "storyboard", nameKey: "modules.content.storyboard.name", descKey: "modules.content.storyboard.desc", icon: LayoutGrid },
        ]
    },
    {
        id: "finance-ai",
        nameKey: "categories.finance-ai",
        descKey: "modules.financeAi.description",
        icon: TrendingUp,
        color: "cyan",
        href: "/command-center/finance-ai",
        featureKeys: ["modules.financeAi.features.forecasts", "modules.financeAi.features.reports", "modules.financeAi.features.kpis"],
        version: "v1.0",
        subModules: [
            { id: "expenses", nameKey: "modules.finance.expense-tracker.name", descKey: "modules.finance.expense-tracker.desc", icon: FileText },
            { id: "revenue", nameKey: "modules.finance.revenue-forecast.name", descKey: "modules.finance.revenue-forecast.desc", icon: TrendingUp },
            { id: "tax", nameKey: "modules.finance.tax-assistant.name", descKey: "modules.finance.tax-assistant.desc", icon: Target },
            { id: "investment", nameKey: "modules.finance.investment-analyzer.name", descKey: "modules.finance.investment-analyzer.desc", icon: Sparkles },
            { id: "crypto", nameKey: "modules.finance.crypto-pulse.name", descKey: "modules.finance.crypto-pulse.desc", icon: Zap },
        ]
    },
    {
        id: "marketing-ai",
        nameKey: "categories.marketing-ai",
        descKey: "modules.marketingAi.description",
        icon: Target,
        color: "purple",
        href: "/command-center/marketing-ai",
        featureKeys: ["modules.marketingAi.features.campaigns", "modules.marketingAi.features.targeting", "modules.marketingAi.features.analytics"],
        version: "v1.0",
        subModules: [
            { id: "ad-copy", nameKey: "modules.marketing.ad-copy.name", descKey: "modules.marketing.ad-copy.desc", icon: FileText },
            { id: "seo-opt", nameKey: "modules.marketing.seo-optimizer.name", descKey: "modules.marketing.seo-optimizer.desc", icon: Search },
            { id: "email", nameKey: "modules.marketing.email-campaigner.name", descKey: "modules.marketing.email-campaigner.desc", icon: Zap },
            { id: "brand", nameKey: "modules.marketing.brand-identity.name", descKey: "modules.marketing.brand-identity.desc", icon: Sparkles },
            { id: "persona", nameKey: "modules.marketing.persona-creator.name", descKey: "modules.marketing.persona-creator.desc", icon: Target },
        ]
    },
    {
        id: "business-tools",
        nameKey: "categories.business-tools",
        descKey: "modules.businessTools.description",
        icon: FileText,
        color: "green",
        href: "/command-center/business-tools",
        featureKeys: ["modules.businessTools.features.contracts", "modules.businessTools.features.proposals", "modules.businessTools.features.reports"],
        version: "v1.0",
        subModules: [
            { id: "contract", nameKey: "modules.business.contract-gen.name", descKey: "modules.business.contract-gen.desc", icon: FileText },
            { id: "proposal", nameKey: "modules.business.proposal-gpt.name", descKey: "modules.business.proposal-gpt.desc", icon: Sparkles },
            { id: "strategy", nameKey: "modules.business.strategy-ai.name", descKey: "modules.business.strategy-ai.desc", icon: TrendingUp },
            { id: "legal", nameKey: "modules.business.legal-helper.name", descKey: "modules.business.legal-helper.desc", icon: Target },
            { id: "market", nameKey: "modules.business.market-analyzer.name", descKey: "modules.business.market-analyzer.desc", icon: Search },
        ]
    },
    {
        id: "social-factory",
        nameKey: "categories.social-factory",
        descKey: "modules.socialFactory.description",
        icon: Share2,
        color: "pink",
        href: "/command-center/social-factory",
        featureKeys: ["modules.socialFactory.features.multiplatform", "modules.socialFactory.features.scheduling", "modules.socialFactory.features.analytics"],
        version: "v1.0",
        subModules: [
            { id: "scheduler", nameKey: "modules.social.post-scheduler.name", descKey: "modules.social.post-scheduler.desc", icon: LayoutGrid },
            { id: "hooks", nameKey: "modules.social.viral-hook.name", descKey: "modules.social.viral-hook.desc", icon: Zap },
            { id: "engagement", nameKey: "modules.social.engagement-bot.name", descKey: "modules.social.engagement-bot.desc", icon: Target },
            { id: "bio", nameKey: "modules.social.bio-optimizer.name", descKey: "modules.social.bio-optimizer.desc", icon: FileText },
            { id: "memes", nameKey: "modules.social.meme-gen.name", descKey: "modules.social.meme-gen.desc", icon: Sparkles },
        ]
    },
    {
        id: "ecommerce-studio",
        nameKey: "categories.ecommerce-studio",
        descKey: "modules.ecommerce.product-desc.desc",
        icon: ShoppingCart,
        color: "yellow",
        href: "#",
        featureKeys: ["Shopify", "Amazon", "UX Audit"],
        version: "v1.0",
        subModules: [
            { id: "product", nameKey: "modules.ecommerce.product-desc.name", descKey: "modules.ecommerce.product-desc.desc", icon: FileText },
            { id: "customer", nameKey: "modules.ecommerce.customer-service.name", descKey: "modules.ecommerce.customer-service.desc", icon: Zap },
            { id: "pricing", nameKey: "modules.ecommerce.pricing-strategy.name", descKey: "modules.ecommerce.pricing-strategy.desc", icon: TrendingUp },
            { id: "inventory", nameKey: "modules.ecommerce.inventory-forecast.name", descKey: "modules.ecommerce.inventory-forecast.desc", icon: Target },
            { id: "ux", nameKey: "modules.ecommerce.ux-audit.name", descKey: "modules.ecommerce.ux-audit.desc", icon: Search },
        ]
    },
    {
        id: "academy-ai",
        nameKey: "categories.academy-ai",
        descKey: "modules.academy.course-outliner.desc",
        icon: GraduationCap,
        color: "indigo",
        href: "#",
        featureKeys: ["LMS", "Quizz AI", "Edu GPT"],
        version: "v1.0",
        subModules: [
            { id: "course", nameKey: "modules.academy.course-outliner.name", descKey: "modules.academy.course-outliner.desc", icon: LayoutGrid },
            { id: "quiz", nameKey: "modules.academy.quiz-gen.name", descKey: "modules.academy.quiz-gen.desc", icon: Sparkles },
            { id: "edu-script", nameKey: "modules.academy.edu-script.name", descKey: "modules.academy.edu-script.desc", icon: FileText },
            { id: "tutor", nameKey: "modules.academy.tutor-bot.name", descKey: "modules.academy.tutor-bot.desc", icon: Zap },
            { id: "research", nameKey: "modules.academy.research-helper.name", descKey: "modules.academy.research-helper.desc", icon: Search },
        ]
    },
]

const colorMap: Record<string, { bg: string; text: string; border: string; glow: string; gradient: string }> = {
    orange: { bg: "bg-orange-500/20", text: "text-orange-500", border: "border-orange-500/50 hover:border-orange-500", glow: "shadow-orange-500/10", gradient: "from-orange-500 to-amber-500" },
    cyan: { bg: "bg-cyan-500/20", text: "text-cyan-500", border: "border-cyan-500/50 hover:border-cyan-500", glow: "shadow-cyan-500/10", gradient: "from-cyan-500 to-blue-500" },
    purple: { bg: "bg-purple-500/20", text: "text-purple-500", border: "border-purple-500/50 hover:border-purple-500", glow: "shadow-purple-500/10", gradient: "from-purple-500 to-violet-500" },
    green: { bg: "bg-green-500/20", text: "text-green-500", border: "border-green-500/50 hover:border-green-500", glow: "shadow-green-500/10", gradient: "from-green-500 to-emerald-500" },
    pink: { bg: "bg-pink-500/20", text: "text-pink-500", border: "border-pink-500/50 hover:border-pink-500", glow: "shadow-pink-500/10", gradient: "from-pink-500 to-rose-500" },
    yellow: { bg: "bg-yellow-500/20", text: "text-yellow-500", border: "border-yellow-500/50 hover:border-yellow-500", glow: "shadow-yellow-500/10", gradient: "from-yellow-500 to-orange-500" },
    indigo: { bg: "bg-indigo-500/20", text: "text-indigo-500", border: "border-indigo-500/50 hover:border-indigo-500", glow: "shadow-indigo-500/10", gradient: "from-indigo-500 to-blue-600" },
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Clapperboard,
    TrendingUp,
    Target,
    FileText,
    Share2,
    ShoppingCart,
    GraduationCap,
}

interface ModuleConfig {
    id: string
    nameKey: string
    descKey: string
    icon: React.ComponentType<{ className?: string }>
    color: string
    href: string
    featureKeys: string[]
    version: string
    enabled: boolean
    subModules: SubModule[]
}

export default function CommandCenterPage() {
    const { t } = useTranslation()
    const [modules, setModules] = useState<ModuleConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch('/api/orchestrator')
                if (response.ok) {
                    const config = await response.json()
                    const categories: AgentCategory[] = config.categories || []
                    
                    // Map categories to modules
                    const mappedModules: ModuleConfig[] = FALLBACK_MODULES.map(fallback => {
                        const category = categories.find(c => c.id === fallback.id)
                        return {
                            ...fallback,
                            enabled: category?.isActive ?? true,
                        }
                    })
                    
                    console.log('[CommandCenter] Loaded modules:', mappedModules.map(m => ({ id: m.id, enabled: m.enabled })))
                    setModules(mappedModules)
                } else {
                    // Use fallback if API fails
                    setModules(FALLBACK_MODULES.map(m => ({ ...m, enabled: true })))
                }
            } catch (error) {
                console.error('[CommandCenter] Failed to fetch config:', error)
                // Use fallback on error
                setModules(FALLBACK_MODULES.map(m => ({ ...m, enabled: true })))
            } finally {
                setLoading(false)
            }
        }
        
        fetchConfig()
    }, [])

    const enabledModules = modules.filter(m => m.enabled)
    const disabledModules = modules.filter(m => !m.enabled)

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-orange-500/20 rounded-lg flex items-center justify-center">
                            <LayoutGrid className="w-4 h-4 text-orange-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">{t("commandCenter.title")}</h1>
                            <p className="text-sm text-neutral-400">{t("commandCenter.subtitle")}</p>
                        </div>
                    </div>
                </div>

                {/* Enabled Categories / Modules */}
                {selectedCategoryId ? (
                    <div>
                        <div className="flex items-center gap-4 mb-6">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-neutral-400 hover:text-white"
                                onClick={() => setSelectedCategoryId(null)}
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                {t("common.back")}
                            </Button>
                            <div className="h-4 w-px bg-neutral-800" />
                            <h2 className="text-lg font-bold text-white">
                                {t(modules.find(m => m.id === selectedCategoryId)?.nameKey || "")}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
                            {modules.find(m => m.id === selectedCategoryId)?.subModules.map((sub) => {
                                const parent = modules.find(m => m.id === selectedCategoryId)!
                                const colors = colorMap[parent.color]
                                return (
                                    <div key={sub.id} className="group relative bg-neutral-900 border border-neutral-800 rounded-xl p-4 transition-all hover:border-neutral-700 hover:shadow-lg h-full flex flex-col">
                                        <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center mb-4`}>
                                            <sub.icon className={`w-5 h-5 ${colors.text}`} />
                                        </div>
                                        <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-orange-400 transition-colors">
                                            {t(sub.nameKey)}
                                        </h3>
                                        <p className="text-xs text-neutral-500 mb-4 line-clamp-2 leading-relaxed flex-1">
                                            {t(sub.descKey)}
                                        </p>
                                        <Button size="sm" className={`w-full h-8 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700`}>
                                            {t("common.launch")}
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : enabledModules.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 mb-8">
                        {enabledModules.map((module) => {
                            const colors = colorMap[module.color]
                            return (
                                <div 
                                    key={module.id} 
                                    className="block group cursor-pointer"
                                    onClick={() => setSelectedCategoryId(module.id)}
                                >
                                    <div className={`relative bg-neutral-900 border ${colors.border} rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg ${colors.glow} hover:-translate-y-1 h-full`}>
                                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.gradient}`} />

                                        <div className="p-4 flex flex-col h-full">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
                                                    <module.icon className={`w-5 h-5 ${colors.text}`} />
                                                </div>
                                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0">
                                                    {module.version}
                                                </Badge>
                                            </div>

                                            <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-orange-400 transition-colors">
                                                {t(module.nameKey)}
                                            </h3>
                                            <p className="text-xs text-neutral-500 mb-3 line-clamp-2 leading-relaxed flex-1">
                                                {t(module.descKey)}
                                            </p>

                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {module.featureKeys.slice(0, 2).map((featureKey) => (
                                                    <span
                                                        key={featureKey}
                                                        className="px-1.5 py-0.5 bg-neutral-800/80 rounded text-[10px] text-neutral-400 border border-neutral-700/50"
                                                    >
                                                        {t(featureKey)}
                                                    </span>
                                                ))}
                                            </div>

                                            <Button size="sm" className={`w-full h-8 text-[10px] bg-gradient-to-r ${colors.gradient} hover:opacity-90 text-white transition-all`}>
                                                Explorer
                                                <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-8 text-center mb-8">
                        <Lock className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">Aucun module actif</h3>
                        <p className="text-sm text-neutral-400 mb-4">
                            Activez des modules dans l'Orchestrator pour les voir apparaître ici.
                        </p>
                        <Link href="/orchestrator">
                            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                                Aller à l'Orchestrator
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Disabled Modules */}
                {disabledModules.length > 0 && (
                    <>
                        <div className="flex items-center gap-2 mb-4">
                            <Lock className="w-4 h-4 text-neutral-500" />
                            <h2 className="text-sm font-semibold text-neutral-500">Modules désactivés</h2>
                            <Badge className="bg-neutral-700 text-neutral-400 border-neutral-600 text-[10px]">
                                {disabledModules.length}
                            </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 opacity-50">
                            {disabledModules.map((module) => {
                                const colors = colorMap[module.color]
                                return (
                                    <div key={module.id} className="block group cursor-not-allowed">
                                        <div className={`relative bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden h-full`}>
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-700" />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <Lock className="w-8 h-8 text-neutral-600" />
                                            </div>

                                            <div className="p-4 flex flex-col h-full">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center opacity-50`}>
                                                        <module.icon className={`w-5 h-5 ${colors.text}`} />
                                                    </div>
                                                    <Badge className="bg-neutral-700 text-neutral-500 text-[10px] px-1.5 py-0">
                                                        {module.version}
                                                    </Badge>
                                                </div>

                                                <h3 className="text-sm font-semibold text-neutral-500 mb-1">
                                                    {t(module.nameKey)}
                                                </h3>
                                                <p className="text-xs text-neutral-600 mb-3 line-clamp-2 leading-relaxed flex-1">
                                                    {t(module.descKey)}
                                                </p>

                                                <Button size="sm" disabled className="w-full h-8 text-xs bg-neutral-700 text-neutral-500 cursor-not-allowed">
                                                    Désactivé
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        
                        <div className="mt-4 text-center">
                            <Link href="/orchestrator" className="text-sm text-orange-500 hover:text-orange-400 underline">
                                Activer des modules dans l'Orchestrator
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
