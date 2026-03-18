"use client"

// Command Center - Main module selection page
import Link from "next/link"
import { 
  Clapperboard,
  TrendingUp,
  Target,
  FileText,
  Share2,
  Lock,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"

const MODULES = [
  {
    id: "content-studio",
    nameKey: "modules.contentStudio.name",
    descKey: "modules.contentStudio.description",
    featureKeys: ["modules.contentStudio.features.thumbnails", "modules.contentStudio.features.seo", "modules.contentStudio.features.social"],
    icon: Clapperboard,
    color: "orange",
    href: "/command-center/content-studio",
    status: "active" as const,
  },
  {
    id: "finance-ai",
    nameKey: "modules.financeAi.name",
    descKey: "modules.financeAi.description",
    featureKeys: ["modules.financeAi.features.forecasts", "modules.financeAi.features.reports", "modules.financeAi.features.kpis"],
    icon: TrendingUp,
    color: "cyan",
    href: "/command-center/finance-ai",
    status: "coming" as const,
  },
  {
    id: "marketing-ai",
    nameKey: "modules.marketingAi.name",
    descKey: "modules.marketingAi.description",
    featureKeys: ["modules.marketingAi.features.campaigns", "modules.marketingAi.features.targeting", "modules.marketingAi.features.analytics"],
    icon: Target,
    color: "purple",
    href: "/command-center/marketing-ai",
    status: "coming" as const,
  },
  {
    id: "business-tools",
    nameKey: "modules.businessTools.name",
    descKey: "modules.businessTools.description",
    featureKeys: ["modules.businessTools.features.contracts", "modules.businessTools.features.proposals", "modules.businessTools.features.reports"],
    icon: FileText,
    color: "green",
    href: "/command-center/business-tools",
    status: "coming" as const,
  },
  {
    id: "social-factory",
    nameKey: "modules.socialFactory.name",
    descKey: "modules.socialFactory.description",
    featureKeys: ["modules.socialFactory.features.multiplatform", "modules.socialFactory.features.scheduling", "modules.socialFactory.features.analytics"],
    icon: Share2,
    color: "pink",
    href: "/command-center/social-factory",
    status: "coming" as const,
  },
]

export default function CommandCenterPage() {
  const { t } = useTranslation()

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">{t("home.title")}</h1>
          <p className="text-neutral-400">{t("home.subtitle")}</p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULES.map((module) => (
            <div
              key={module.id}
              className={`relative bg-neutral-900 border rounded-lg overflow-hidden transition-all duration-300 ${
                module.status === "active"
                  ? "border-orange-500/50 hover:border-orange-500"
                  : "border-neutral-700 opacity-60"
              }`}
            >
              {module.status === "coming" && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-400">
                  <Lock className="w-3 h-3" />
                  {t("home.comingSoon")}
                </div>
              )}

              <div className="p-6">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                  module.color === "orange" ? "bg-orange-500/20" :
                  module.color === "cyan" ? "bg-cyan-500/20" :
                  module.color === "purple" ? "bg-purple-500/20" :
                  module.color === "green" ? "bg-green-500/20" :
                  "bg-pink-500/20"
                }`}>
                  <module.icon className={`w-6 h-6 ${
                    module.color === "orange" ? "text-orange-500" :
                    module.color === "cyan" ? "text-cyan-500" :
                    module.color === "purple" ? "text-purple-500" :
                    module.color === "green" ? "text-green-500" :
                    "text-pink-500"
                  }`} />
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">{t(module.nameKey)}</h3>
                <p className="text-sm text-neutral-400 mb-4">{t(module.descKey)}</p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {module.featureKeys.map((featureKey) => (
                    <span
                      key={featureKey}
                      className="px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-300"
                    >
                      {t(featureKey)}
                    </span>
                  ))}
                </div>

                {module.status === "active" ? (
                  <Link href={module.href}>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                      {t("common.launchModule")}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    {t("home.comingSoonBtn")}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

