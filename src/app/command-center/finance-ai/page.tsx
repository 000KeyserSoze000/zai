"use client"

import { useState } from "react"
import Link from "next/link"
import {
  TrendingUp, ArrowLeft, Sparkles, Loader2,
  DollarSign, BarChart3, AlertTriangle, Lightbulb,
  ArrowUpRight, ArrowDownRight, Minus, Shield,
  Download, RefreshCw, PiggyBank, Target,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n"

interface FinanceData {
  summary: string
  revenue: { current: number; projected: number; growth: string }
  expenses: { current: number; projected: number; optimization: string }
  profitMargin: string
  cashflow: {
    monthly: { month: string; income: number; expenses: number; net: number }[]
    runway: string
  }
  kpis: { name: string; value: string; trend: string; description: string }[]
  recommendations: string[]
  risks: { risk: string; impact: string; mitigation: string }[]
  forecast: { optimistic: number; realistic: number; pessimistic: number }
}

export default function FinanceAIPage() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [context, setContext] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [data, setData] = useState<FinanceData | null>(null)

  const generate = async () => {
    if (!context.trim()) return
    setIsGenerating(true)
    setProgress(0)
    const interval = setInterval(() => setProgress(prev => Math.min(prev + 8, 85)), 200)

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "finance", context }),
      })
      if (!res.ok) throw new Error("API Error")
      const result = await res.json()
      clearInterval(interval)
      setProgress(100)
      setData(result.data)
      toast({ title: t("modules.financeAi.generated"), description: t("modules.financeAi.reportReady") })
    } catch (error) {
      clearInterval(interval)
      console.error(error)
      toast({ title: t("common.error"), description: t("common.error"), variant: "destructive" })
    }
    setIsGenerating(false)
  }

  const trendIcon = (trend: string) => {
    if (trend === "up") return <ArrowUpRight className="w-4 h-4 text-green-400" />
    if (trend === "down") return <ArrowDownRight className="w-4 h-4 text-red-400" />
    return <Minus className="w-4 h-4 text-neutral-400" />
  }

  const impactColor = (impact: string) => {
    if (impact === "high") return "text-red-400 bg-red-500/20 border-red-500/30"
    if (impact === "medium") return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30"
    return "text-green-400 bg-green-500/20 border-green-500/30"
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/command-center">
            <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />{t("commandCenter.modules")}
            </Button>
          </Link>
          <div className="w-px h-6 bg-neutral-700" />
          <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-cyan-500" />
          </div>
          <h1 className="text-lg font-semibold text-white">{t("modules.financeAi.name")}</h1>
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">v1.0</Badge>
        </div>

        {!data ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 text-cyan-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{t("modules.financeAi.title")}</h3>
                  <p className="text-sm text-neutral-400">{t("modules.financeAi.subtitle")}</p>
                </div>
              </div>
              <Textarea
                placeholder="Ex: SaaS B2B, 200 clients, MRR 15K€, 8% monthly growth..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="min-h-[180px] bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 focus:border-cyan-500"
              />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-neutral-500">{context.length} {t("common.characters")}</span>
                <Button onClick={generate} disabled={!context.trim() || isGenerating} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("modules.financeAi.analyzing")}</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />{t("modules.financeAi.generateAnalysis")}</>
                  )}
                </Button>
              </div>
              {isGenerating && <Progress value={progress} className="mt-4 h-2" />}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { icon: DollarSign, title: t("modules.financeAi.revenuesCosts"), desc: t("modules.financeAi.projections") },
                { icon: BarChart3, title: t("modules.financeAi.kpis"), desc: t("modules.financeAi.keyMetrics") },
                { icon: Target, title: t("modules.financeAi.cashflow"), desc: t("modules.financeAi.monthlyCash") },
                { icon: Shield, title: t("modules.financeAi.risksCard"), desc: t("modules.financeAi.riskAnalysis") },
              ].map((f, i) => (
                <div key={i} className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
                  <f.icon className="w-6 h-6 text-cyan-500 mb-2" />
                  <h4 className="font-medium text-white text-sm">{f.title}</h4>
                  <p className="text-xs text-neutral-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-neutral-400">{t("modules.financeAi.generated")}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setData(null)} className="border-neutral-600 text-neutral-300">
                  <RefreshCw className="w-4 h-4 mr-2" />{t("modules.financeAi.newAnalysis")}
                </Button>
                <Button variant="outline" size="sm" className="border-cyan-600 text-cyan-400 hover:bg-cyan-500/10">
                  <Download className="w-4 h-4 mr-2" />{t("common.exportPdf")}
                </Button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">{t("modules.financeAi.executiveSummary")}</h3>
              <p className="text-neutral-300 leading-relaxed">{data.summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-5">
                <div className="flex items-center gap-2 text-neutral-400 mb-3">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">{t("modules.financeAi.revenue")}</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{data.revenue.projected.toLocaleString()}€</div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    <ArrowUpRight className="w-3 h-3 mr-1" />{data.revenue.growth}
                  </Badge>
                  <span className="text-xs text-neutral-500">vs {data.revenue.current.toLocaleString()}€</span>
                </div>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-5">
                <div className="flex items-center gap-2 text-neutral-400 mb-3">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">{t("modules.financeAi.expenses")}</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{data.expenses.projected.toLocaleString()}€</div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    <ArrowDownRight className="w-3 h-3 mr-1" />-{data.expenses.optimization}
                  </Badge>
                  <span className="text-xs text-neutral-500">{t("modules.financeAi.optimization")}</span>
                </div>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-5">
                <div className="flex items-center gap-2 text-neutral-400 mb-3">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">{t("modules.financeAi.profitMargin")}</span>
                </div>
                <div className="text-2xl font-bold text-cyan-400 mb-1">{data.profitMargin}</div>
                <span className="text-xs text-neutral-500">Runway: {data.cashflow.runway}</span>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-500" />{t("modules.financeAi.mainKpis")}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.kpis.map((kpi, i) => (
                  <div key={i} className="bg-neutral-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-neutral-400 uppercase">{kpi.name}</span>
                      {trendIcon(kpi.trend)}
                    </div>
                    <div className="text-xl font-bold text-white">{kpi.value}</div>
                    <p className="text-xs text-neutral-500 mt-1">{kpi.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-cyan-500" />{t("modules.financeAi.monthlyCashflow")}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-neutral-700">
                    <th className="text-left text-neutral-400 py-2 px-3">{t("modules.financeAi.month")}</th>
                    <th className="text-right text-neutral-400 py-2 px-3">{t("modules.financeAi.income")}</th>
                    <th className="text-right text-neutral-400 py-2 px-3">{t("modules.financeAi.expensesCol")}</th>
                    <th className="text-right text-neutral-400 py-2 px-3">{t("modules.financeAi.net")}</th>
                  </tr></thead>
                  <tbody>
                    {data.cashflow.monthly.map((m, i) => (
                      <tr key={i} className="border-b border-neutral-800 hover:bg-neutral-800/50">
                        <td className="py-2 px-3 text-white font-medium">{m.month}</td>
                        <td className="py-2 px-3 text-right text-green-400 font-mono">+{m.income.toLocaleString()}€</td>
                        <td className="py-2 px-3 text-right text-red-400 font-mono">-{m.expenses.toLocaleString()}€</td>
                        <td className={`py-2 px-3 text-right font-mono font-semibold ${m.net >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                          {m.net >= 0 ? '+' : ''}{m.net.toLocaleString()}€
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{t("modules.financeAi.forecasts")}</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: t("modules.financeAi.pessimistic"), value: data.forecast.pessimistic, color: "text-red-400", bg: "bg-red-500/10" },
                  { label: t("modules.financeAi.realistic"), value: data.forecast.realistic, color: "text-cyan-400", bg: "bg-cyan-500/10" },
                  { label: t("modules.financeAi.optimistic"), value: data.forecast.optimistic, color: "text-green-400", bg: "bg-green-500/10" },
                ].map((f, i) => (
                  <div key={i} className={`${f.bg} border border-neutral-700 rounded-lg p-4 text-center`}>
                    <p className="text-xs text-neutral-400 uppercase mb-2">{f.label}</p>
                    <p className={`text-2xl font-bold font-mono ${f.color}`}>{f.value.toLocaleString()}€</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />{t("modules.financeAi.recommendations")}
                </h3>
                <div className="space-y-3">
                  {data.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-neutral-800 rounded-lg">
                      <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center text-xs text-cyan-400 font-bold shrink-0 mt-0.5">{i + 1}</div>
                      <p className="text-sm text-neutral-300">{r}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />{t("modules.financeAi.risks")}
                </h3>
                <div className="space-y-3">
                  {data.risks.map((r, i) => (
                    <div key={i} className="p-3 bg-neutral-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white font-medium">{r.risk}</span>
                        <Badge className={`text-xs ${impactColor(r.impact)}`}>{r.impact}</Badge>
                      </div>
                      <p className="text-xs text-neutral-400">{r.mitigation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
