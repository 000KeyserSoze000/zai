"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Target, ArrowLeft, Sparkles, Loader2,
  Users, Megaphone, CalendarDays, TrendingUp,
  Download, RefreshCw, GitBranch, DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n"

interface MarketingData {
  strategy: { positioning: string; uniqueValue: string; targetMarket: string }
  personas: { name: string; age: string; occupation: string; painPoints: string[]; goals: string[]; channels: string[] }[]
  campaigns: { name: string; channel: string; objective: string; budget: string; duration: string; expectedROI: string; tactics: string[] }[]
  contentPlan: { week: number; theme: string; content: string[]; platforms: string[] }[]
  funnels: Record<string, { tactics: string[]; metrics: string[] }>
  budget: { total: string; breakdown: { channel: string; amount: string; percentage: string }[] }
  timeline: { phase: string; duration: string; goals: string[] }[]
}

export default function MarketingAIPage() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [context, setContext] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [data, setData] = useState<MarketingData | null>(null)

  const generate = async () => {
    if (!context.trim()) return
    setIsGenerating(true)
    setProgress(0)
    const interval = setInterval(() => setProgress(prev => Math.min(prev + 6, 85)), 200)
    try {
      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "marketing", context }) })
      if (!res.ok) throw new Error("API Error")
      const result = await res.json()
      clearInterval(interval)
      setProgress(100)
      setData(result.data)
      toast({ title: t("modules.marketingAi.generated"), description: t("modules.marketingAi.planReady") })
    } catch (error) {
      clearInterval(interval)
      console.error(error)
      toast({ title: t("common.error"), description: t("common.error"), variant: "destructive" })
    }
    setIsGenerating(false)
  }

  const funnelColors: Record<string, string> = {
    awareness: "text-blue-400 bg-blue-500/20 border-blue-500/30",
    consideration: "text-purple-400 bg-purple-500/20 border-purple-500/30",
    conversion: "text-green-400 bg-green-500/20 border-green-500/30",
    retention: "text-orange-400 bg-orange-500/20 border-orange-500/30",
  }
  const funnelLabelKeys: Record<string, string> = {
    awareness: "modules.marketingAi.awareness",
    consideration: "modules.marketingAi.consideration",
    conversion: "modules.marketingAi.conversion",
    retention: "modules.marketingAi.retention",
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/command-center">
            <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white"><ArrowLeft className="w-4 h-4 mr-2" />{t("commandCenter.modules")}</Button>
          </Link>
          <div className="w-px h-6 bg-neutral-700" />
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center"><Target className="w-4 h-4 text-purple-500" /></div>
          <h1 className="text-lg font-semibold text-white">{t("modules.marketingAi.name")}</h1>
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">v1.0</Badge>
        </div>

        {!data ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center"><Megaphone className="w-5 h-5 text-purple-500" /></div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{t("modules.marketingAi.title")}</h3>
                  <p className="text-sm text-neutral-400">{t("modules.marketingAi.subtitle")}</p>
                </div>
              </div>
              <Textarea placeholder="Ex: SaaS project management app for SMBs, 29€/month..." value={context} onChange={(e) => setContext(e.target.value)} className="min-h-[180px] bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 focus:border-purple-500" />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-neutral-500">{context.length} {t("common.characters")}</span>
                <Button onClick={generate} disabled={!context.trim() || isGenerating} className="bg-purple-500 hover:bg-purple-600 text-white">
                  {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("modules.marketingAi.analyzing")}</> : <><Sparkles className="w-4 h-4 mr-2" />{t("modules.marketingAi.generateStrategy")}</>}
                </Button>
              </div>
              {isGenerating && <Progress value={progress} className="mt-4 h-2" />}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { icon: Users, title: t("modules.marketingAi.personas"), desc: t("modules.marketingAi.buyerProfiles") },
                { icon: Megaphone, title: t("modules.marketingAi.campaigns"), desc: t("modules.marketingAi.actionPlans") },
                { icon: GitBranch, title: t("modules.marketingAi.funnel"), desc: t("modules.marketingAi.customerJourney") },
                { icon: CalendarDays, title: t("modules.marketingAi.calendar"), desc: t("modules.marketingAi.contentPlanning") },
              ].map((f, i) => (
                <div key={i} className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
                  <f.icon className="w-6 h-6 text-purple-500 mb-2" /><h4 className="font-medium text-white text-sm">{f.title}</h4><p className="text-xs text-neutral-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-neutral-400">{t("modules.marketingAi.generated")}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setData(null)} className="border-neutral-600 text-neutral-300"><RefreshCw className="w-4 h-4 mr-2" />{t("modules.marketingAi.newStrategy")}</Button>
                <Button variant="outline" size="sm" className="border-purple-600 text-purple-400 hover:bg-purple-500/10"><Download className="w-4 h-4 mr-2" />{t("common.export")}</Button>
              </div>
            </div>

            <Tabs defaultValue="strategy" className="w-full">
              <TabsList className="bg-neutral-800 border border-neutral-700 p-1 h-auto flex-wrap gap-1">
                <TabsTrigger value="strategy" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">{t("modules.marketingAi.strategy")}</TabsTrigger>
                <TabsTrigger value="personas" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">{t("modules.marketingAi.personas")}</TabsTrigger>
                <TabsTrigger value="campaigns" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">{t("modules.marketingAi.campaigns")}</TabsTrigger>
                <TabsTrigger value="funnel" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">{t("modules.marketingAi.funnel")}</TabsTrigger>
                <TabsTrigger value="calendar" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">{t("modules.marketingAi.calendar")}</TabsTrigger>
                <TabsTrigger value="budget" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">{t("modules.marketingAi.budget")}</TabsTrigger>
              </TabsList>

              <TabsContent value="strategy" className="mt-4 space-y-4">
                <div className="bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">{t("modules.marketingAi.positioning")}</h3>
                  <div className="space-y-4">
                    {[
                      { label: t("modules.marketingAi.positioningLabel"), value: data.strategy.positioning },
                      { label: t("modules.marketingAi.valueProposition"), value: data.strategy.uniqueValue },
                      { label: t("modules.marketingAi.targetMarket"), value: data.strategy.targetMarket },
                    ].map((s, i) => (<div key={i}><p className="text-xs text-purple-400 uppercase tracking-wider mb-1">{s.label}</p><p className="text-neutral-300">{s.value}</p></div>))}
                  </div>
                </div>
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">{t("modules.marketingAi.timeline")}</h3>
                  <div className="space-y-4">
                    {data.timeline.map((tl, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-sm font-bold text-purple-400 shrink-0">{i + 1}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1"><span className="font-semibold text-white">{tl.phase}</span><Badge className="bg-neutral-800 text-neutral-400 border-neutral-700 text-xs">{tl.duration}</Badge></div>
                          <div className="flex flex-wrap gap-2">{tl.goals.map((g, j) => <Badge key={j} variant="outline" className="text-xs border-purple-500/30 text-purple-300">{g}</Badge>)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="personas" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.personas.map((p, i) => (
                    <div key={i} className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center"><Users className="w-6 h-6 text-purple-400" /></div>
                        <div><h4 className="font-semibold text-white">{p.name}</h4><p className="text-sm text-neutral-400">{p.occupation} • {p.age}</p></div>
                      </div>
                      <div className="space-y-3">
                        <div><p className="text-xs text-red-400 uppercase mb-1">{t("modules.marketingAi.painPoints")}</p><div className="flex flex-wrap gap-1">{p.painPoints.map((pp, j) => <Badge key={j} className="text-xs bg-red-500/10 text-red-300 border-red-500/20">{pp}</Badge>)}</div></div>
                        <div><p className="text-xs text-green-400 uppercase mb-1">{t("modules.marketingAi.goals")}</p><div className="flex flex-wrap gap-1">{p.goals.map((g, j) => <Badge key={j} className="text-xs bg-green-500/10 text-green-300 border-green-500/20">{g}</Badge>)}</div></div>
                        <div><p className="text-xs text-blue-400 uppercase mb-1">{t("modules.marketingAi.channels")}</p><div className="flex flex-wrap gap-1">{p.channels.map((c, j) => <Badge key={j} variant="outline" className="text-xs border-blue-500/30 text-blue-300">{c}</Badge>)}</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="campaigns" className="mt-4 space-y-4">
                {data.campaigns.map((c, i) => (
                  <div key={i} className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3"><Megaphone className="w-5 h-5 text-purple-400" /><h4 className="font-semibold text-white">{c.name}</h4></div>
                      <div className="flex gap-2"><Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">{c.channel}</Badge><Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">ROI: {c.expectedROI}</Badge></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div><p className="text-xs text-neutral-500">{t("modules.marketingAi.objective")}</p><p className="text-sm text-white">{c.objective}</p></div>
                      <div><p className="text-xs text-neutral-500">{t("modules.marketingAi.budget")}</p><p className="text-sm text-white">{c.budget}</p></div>
                      <div><p className="text-xs text-neutral-500">{t("modules.marketingAi.duration")}</p><p className="text-sm text-white">{c.duration}</p></div>
                    </div>
                    <div className="flex flex-wrap gap-2">{c.tactics.map((tac, j) => <Badge key={j} variant="outline" className="text-xs border-neutral-600 text-neutral-300">{tac}</Badge>)}</div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="funnel" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(data.funnels).map(([key, funnel]) => (
                    <div key={key} className={`rounded-lg border p-5 ${funnelColors[key] || 'bg-neutral-800 border-neutral-700'}`}>
                      <h4 className="font-semibold text-white mb-3">{t(funnelLabelKeys[key] || key)}</h4>
                      <div className="mb-3"><p className="text-xs uppercase text-neutral-400 mb-2">{t("modules.marketingAi.tactics")}</p><div className="space-y-1">{funnel.tactics.map((tac, i) => <p key={i} className="text-sm text-neutral-300">• {tac}</p>)}</div></div>
                      <div><p className="text-xs uppercase text-neutral-400 mb-2">{t("modules.marketingAi.metrics")}</p><div className="flex flex-wrap gap-1">{funnel.metrics.map((m, i) => <Badge key={i} variant="outline" className="text-xs border-neutral-600 text-neutral-300">{m}</Badge>)}</div></div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="calendar" className="mt-4">
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-neutral-700 bg-neutral-800/50">
                      <th className="text-left text-neutral-400 py-3 px-4">{t("modules.marketingAi.week")}</th>
                      <th className="text-left text-neutral-400 py-3 px-4">{t("modules.marketingAi.theme")}</th>
                      <th className="text-left text-neutral-400 py-3 px-4">{t("modules.marketingAi.content")}</th>
                      <th className="text-left text-neutral-400 py-3 px-4">{t("modules.marketingAi.platforms")}</th>
                    </tr></thead>
                    <tbody>
                      {data.contentPlan.map((w, i) => (
                        <tr key={i} className="border-b border-neutral-800 hover:bg-neutral-800/30">
                          <td className="py-3 px-4"><Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">S{w.week}</Badge></td>
                          <td className="py-3 px-4 text-white font-medium">{w.theme}</td>
                          <td className="py-3 px-4"><div className="flex flex-wrap gap-1">{w.content.map((c, j) => <span key={j} className="text-xs text-neutral-300 bg-neutral-800 px-2 py-0.5 rounded">{c}</span>)}</div></td>
                          <td className="py-3 px-4"><div className="flex flex-wrap gap-1">{w.platforms.map((p, j) => <Badge key={j} variant="outline" className="text-xs border-neutral-600">{p}</Badge>)}</div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="budget" className="mt-4 space-y-4">
                <div className="bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/30 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><DollarSign className="w-6 h-6 text-purple-500" /><span className="text-lg font-semibold text-white">{t("modules.marketingAi.totalBudget")}</span></div>
                    <span className="text-2xl font-bold text-purple-400 font-mono">{data.budget.total}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.budget.breakdown.map((b, i) => (
                    <div key={i} className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2"><span className="text-white font-medium">{b.channel}</span><span className="text-purple-400 font-mono font-semibold">{b.amount}</span></div>
                      <div className="w-full bg-neutral-800 rounded-full h-2"><div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: b.percentage }} /></div>
                      <p className="text-xs text-neutral-500 mt-1">{b.percentage} {t("modules.marketingAi.ofBudget")}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
