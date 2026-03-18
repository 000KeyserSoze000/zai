"use client"

import { useState } from "react"
import Link from "next/link"
import {
  FileText, ArrowLeft, Sparkles, Loader2,
  Download, RefreshCw, ClipboardList, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp, Briefcase,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n"

interface Section { title: string; content: string; subsections?: { title: string; content: string }[] }
interface BusinessData {
  document: { type: string; title: string; sections: Section[] }
  executiveSummary: string
  keyMetrics: { label: string; value: string; description: string }[]
  actionItems: { task: string; priority: string; deadline: string; owner: string }[]
  appendix: { title: string; content: string }[]
}

export default function BusinessToolsPage() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [context, setContext] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [data, setData] = useState<BusinessData | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]))

  const generate = async () => {
    if (!context.trim()) return
    setIsGenerating(true)
    setProgress(0)
    const interval = setInterval(() => setProgress(prev => Math.min(prev + 5, 85)), 200)
    try {
      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "business", context }) })
      if (!res.ok) throw new Error("API Error")
      const result = await res.json()
      clearInterval(interval)
      setProgress(100)
      setData(result.data)
      setExpandedSections(new Set([0]))
      toast({ title: t("modules.businessTools.generated"), description: t("modules.businessTools.planReady") })
    } catch (error) {
      clearInterval(interval)
      console.error(error)
      toast({ title: t("common.error"), description: t("common.error"), variant: "destructive" })
    }
    setIsGenerating(false)
  }

  const toggleSection = (index: number) => {
    setExpandedSections(prev => { const next = new Set(prev); if (next.has(index)) next.delete(index); else next.add(index); return next })
  }

  const priorityStyle = (p: string) => {
    if (p === "high") return "bg-red-500/20 text-red-400 border-red-500/30"
    if (p === "medium") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    return "bg-green-500/20 text-green-400 border-green-500/30"
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/command-center"><Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white"><ArrowLeft className="w-4 h-4 mr-2" />{t("commandCenter.modules")}</Button></Link>
          <div className="w-px h-6 bg-neutral-700" />
          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center"><FileText className="w-4 h-4 text-green-500" /></div>
          <h1 className="text-lg font-semibold text-white">{t("modules.businessTools.name")}</h1>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">v1.0</Badge>
        </div>

        {!data ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center"><Briefcase className="w-5 h-5 text-green-500" /></div>
                <div><h3 className="text-lg font-semibold text-white">{t("modules.businessTools.title")}</h3><p className="text-sm text-neutral-400">{t("modules.businessTools.subtitle")}</p></div>
              </div>
              <Textarea placeholder="Ex: Business plan for a digital marketing agency..." value={context} onChange={(e) => setContext(e.target.value)} className="min-h-[180px] bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 focus:border-green-500" />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-neutral-500">{context.length} {t("common.characters")}</span>
                <Button onClick={generate} disabled={!context.trim() || isGenerating} className="bg-green-500 hover:bg-green-600 text-white">
                  {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("modules.businessTools.generating")}</> : <><Sparkles className="w-4 h-4 mr-2" />{t("modules.businessTools.generateDocument")}</>}
                </Button>
              </div>
              {isGenerating && <Progress value={progress} className="mt-4 h-2" />}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { icon: FileText, title: t("modules.businessTools.businessPlans"), desc: t("modules.businessTools.businessPlansDesc") },
                { icon: ClipboardList, title: t("modules.businessTools.quotesContracts"), desc: t("modules.businessTools.quotesContractsDesc") },
                { icon: Briefcase, title: t("modules.businessTools.proposals"), desc: t("modules.businessTools.proposalsDesc") },
                { icon: CheckCircle2, title: t("modules.businessTools.reports"), desc: t("modules.businessTools.reportsDesc") },
              ].map((f, i) => (
                <div key={i} className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4"><f.icon className="w-6 h-6 text-green-500 mb-2" /><h4 className="font-medium text-white text-sm">{f.title}</h4><p className="text-xs text-neutral-500">{f.desc}</p></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div><h2 className="text-xl font-bold text-white">{data.document.title}</h2><Badge className="bg-green-500/20 text-green-400 border-green-500/30 mt-1">{data.document.type.replace('_', ' ')}</Badge></div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setData(null)} className="border-neutral-600 text-neutral-300"><RefreshCw className="w-4 h-4 mr-2" />{t("modules.businessTools.new")}</Button>
                <Button variant="outline" size="sm" className="border-green-600 text-green-400 hover:bg-green-500/10"><Download className="w-4 h-4 mr-2" />{t("common.exportPdf")}</Button>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/30 rounded-lg p-6">
              <h3 className="text-sm font-medium text-green-400 uppercase tracking-wider mb-2">{t("modules.businessTools.executiveSummary")}</h3>
              <p className="text-neutral-300 leading-relaxed">{data.executiveSummary}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.keyMetrics.map((m, i) => (<div key={i} className="bg-neutral-900 border border-neutral-700 rounded-lg p-4"><p className="text-xs text-neutral-500 uppercase mb-1">{m.label}</p><p className="text-xl font-bold text-white mb-1">{m.value}</p><p className="text-xs text-neutral-400">{m.description}</p></div>))}
            </div>
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-neutral-700 bg-neutral-800/50"><h3 className="font-semibold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-green-500" />{t("modules.businessTools.documentContent")}</h3></div>
              <div className="divide-y divide-neutral-800">
                {data.document.sections.map((section, i) => (
                  <div key={i}>
                    <button onClick={() => toggleSection(i)} className="w-full flex items-center justify-between p-4 hover:bg-neutral-800/30 transition-colors">
                      <div className="flex items-center gap-3"><div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-sm font-bold text-green-400">{i + 1}</div><span className="font-medium text-white">{section.title}</span></div>
                      {expandedSections.has(i) ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                    </button>
                    {expandedSections.has(i) && (
                      <div className="px-4 pb-4 pl-16">
                        <p className="text-neutral-300 text-sm leading-relaxed mb-3">{section.content}</p>
                        {section.subsections && section.subsections.length > 0 && (
                          <div className="space-y-3 ml-4 border-l-2 border-green-500/20 pl-4">
                            {section.subsections.map((sub, j) => (<div key={j}><h5 className="text-sm font-medium text-white mb-1">{sub.title}</h5><p className="text-xs text-neutral-400">{sub.content}</p></div>))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" />{t("modules.businessTools.actionPlan")}</h3>
              <div className="space-y-3">
                {data.actionItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-neutral-800 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${item.priority === 'high' ? 'bg-red-500' : item.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <div className="flex-1"><p className="text-sm text-white font-medium">{item.task}</p></div>
                    <Badge className={`text-xs ${priorityStyle(item.priority)}`}>{item.priority}</Badge>
                    <span className="text-xs text-neutral-500">{item.deadline}</span>
                    <Badge variant="outline" className="text-xs border-neutral-600 text-neutral-400">{item.owner}</Badge>
                  </div>
                ))}
              </div>
            </div>
            {data.appendix.length > 0 && (
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-neutral-400" />{t("modules.businessTools.appendix")}</h3>
                <div className="space-y-3">{data.appendix.map((a, i) => (<div key={i} className="p-3 bg-neutral-800 rounded-lg"><p className="text-sm font-medium text-white mb-1">{a.title}</p><p className="text-xs text-neutral-400">{a.content}</p></div>))}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
