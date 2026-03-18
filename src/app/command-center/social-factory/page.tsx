"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Share2, ArrowLeft, Sparkles, Loader2,
  Download, RefreshCw, Flame, CalendarDays,
  Zap, Copy, Check, BarChart3, FlaskConical,
  Clock, Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n"

interface SocialBatchData {
  hooks: { text: string; platform: string; viralScore: number; type: string }[]
  posts: { platform: string; content: string; hashtags: string[]; bestTime: string; estimatedReach: string; type: string }[]
  calendar: { day: string; posts: { time: string; platform: string; content_summary: string }[] }[]
  trends: { trend: string; relevance: string; suggestion: string }[]
  abTests: { variant_a: string; variant_b: string; metric: string }[]
}

export default function SocialFactoryPage() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [context, setContext] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [data, setData] = useState<SocialBatchData | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const generate = async () => {
    if (!context.trim()) return
    setIsGenerating(true)
    setProgress(0)
    const interval = setInterval(() => setProgress(prev => Math.min(prev + 7, 85)), 200)
    try {
      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "social_batch", context }) })
      if (!res.ok) throw new Error("API Error")
      const result = await res.json()
      clearInterval(interval)
      setProgress(100)
      setData(result.data)
      toast({ title: t("modules.socialFactory.generated"), description: `${result.data.hooks?.length || 0} ${t("modules.socialFactory.hooksAndPosts")}` })
    } catch (error) {
      clearInterval(interval)
      console.error(error)
      toast({ title: t("common.error"), description: t("common.error"), variant: "destructive" })
    }
    setIsGenerating(false)
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
    toast({ title: t("common.copied"), description: t("common.copied") })
  }

  const platformColors: Record<string, string> = {
    tiktok: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    instagram: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30",
    linkedin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    x: "bg-neutral-500/20 text-neutral-300 border-neutral-500/30",
    youtube: "bg-red-500/20 text-red-400 border-red-500/30",
  }

  const scoreColor = (score: number) => {
    if (score >= 90) return "from-green-500 to-emerald-500"
    if (score >= 80) return "from-cyan-500 to-blue-500"
    if (score >= 70) return "from-yellow-500 to-orange-500"
    return "from-orange-500 to-red-500"
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/command-center"><Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white"><ArrowLeft className="w-4 h-4 mr-2" />{t("commandCenter.modules")}</Button></Link>
          <div className="w-px h-6 bg-neutral-700" />
          <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center"><Share2 className="w-4 h-4 text-pink-500" /></div>
          <h1 className="text-lg font-semibold text-white">{t("modules.socialFactory.name")}</h1>
          <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">v1.0</Badge>
        </div>

        {!data ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center"><Flame className="w-5 h-5 text-pink-500" /></div>
                <div><h3 className="text-lg font-semibold text-white">{t("modules.socialFactory.title")}</h3><p className="text-sm text-neutral-400">{t("modules.socialFactory.subtitle")}</p></div>
              </div>
              <Textarea placeholder="Ex: Tech/AI content creator with 50K YouTube subscribers..." value={context} onChange={(e) => setContext(e.target.value)} className="min-h-[180px] bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 focus:border-pink-500" />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-neutral-500">{context.length} {t("common.characters")}</span>
                <Button onClick={generate} disabled={!context.trim() || isGenerating} className="bg-pink-500 hover:bg-pink-600 text-white">
                  {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("modules.socialFactory.generating")}</> : <><Sparkles className="w-4 h-4 mr-2" />{t("modules.socialFactory.generateContent")}</>}
                </Button>
              </div>
              {isGenerating && <Progress value={progress} className="mt-4 h-2" />}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { icon: Flame, title: t("modules.socialFactory.viralHooks"), desc: t("modules.socialFactory.viralHooksDesc") },
                { icon: Share2, title: t("modules.socialFactory.multiPosts"), desc: t("modules.socialFactory.multiPostsDesc") },
                { icon: CalendarDays, title: t("modules.socialFactory.calendar"), desc: t("modules.socialFactory.calendarDesc") },
                { icon: FlaskConical, title: t("modules.socialFactory.abTests"), desc: t("modules.socialFactory.abTestsDesc") },
              ].map((f, i) => (
                <div key={i} className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4"><f.icon className="w-6 h-6 text-pink-500 mb-2" /><h4 className="font-medium text-white text-sm">{f.title}</h4><p className="text-xs text-neutral-500">{f.desc}</p></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-neutral-400">{data.hooks?.length || 0} hooks • {data.posts?.length || 0} posts • {data.calendar?.length || 0} {t("modules.socialFactory.daysPlanning")}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setData(null)} className="border-neutral-600 text-neutral-300"><RefreshCw className="w-4 h-4 mr-2" />{t("modules.socialFactory.newBatch")}</Button>
                <Button variant="outline" size="sm" className="border-pink-600 text-pink-400 hover:bg-pink-500/10"><Download className="w-4 h-4 mr-2" />{t("modules.socialFactory.exportAll")}</Button>
              </div>
            </div>

            <Tabs defaultValue="hooks" className="w-full">
              <TabsList className="bg-neutral-800 border border-neutral-700 p-1 h-auto flex-wrap gap-1">
                <TabsTrigger value="hooks" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white"><Flame className="w-3 h-3 mr-1" />{t("modules.socialFactory.hooks")} ({data.hooks?.length || 0})</TabsTrigger>
                <TabsTrigger value="posts" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white"><Share2 className="w-3 h-3 mr-1" />{t("modules.socialFactory.posts")} ({data.posts?.length || 0})</TabsTrigger>
                <TabsTrigger value="calendar" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white"><CalendarDays className="w-3 h-3 mr-1" />{t("modules.socialFactory.calendar")}</TabsTrigger>
                <TabsTrigger value="trends" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white"><Zap className="w-3 h-3 mr-1" />{t("modules.socialFactory.trends")}</TabsTrigger>
                <TabsTrigger value="abtests" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white"><FlaskConical className="w-3 h-3 mr-1" />{t("modules.socialFactory.abTests")}</TabsTrigger>
              </TabsList>

              <TabsContent value="hooks" className="mt-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.hooks?.map((hook, i) => (
                  <div key={i} className="bg-neutral-900 border border-neutral-700 rounded-lg p-5 group relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2"><Badge className={`text-xs ${platformColors[hook.platform] || 'bg-neutral-800 text-neutral-300'}`}>{hook.platform}</Badge><Badge variant="outline" className="text-xs border-neutral-600 text-neutral-400">{hook.type}</Badge></div>
                      <button onClick={() => copyToClipboard(hook.text, i)} className="opacity-0 group-hover:opacity-100 transition-opacity">{copiedIndex === i ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-neutral-400 hover:text-white" />}</button>
                    </div>
                    <p className="text-white font-medium text-lg leading-snug mb-4">&ldquo;{hook.text}&rdquo;</p>
                    <div className="flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500" /><span className="text-xs text-neutral-400">{t("modules.socialFactory.viralScore")}</span>
                      <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden"><div className={`h-full rounded-full bg-gradient-to-r ${scoreColor(hook.viralScore)}`} style={{ width: `${hook.viralScore}%` }} /></div>
                      <span className="text-sm font-bold text-white">{hook.viralScore}</span>
                    </div>
                  </div>
                ))}
              </div></TabsContent>

              <TabsContent value="posts" className="mt-4 space-y-4">
                {data.posts?.map((post, i) => (
                  <div key={i} className="bg-neutral-900 border border-neutral-700 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2"><Badge className={`${platformColors[post.platform] || 'bg-neutral-800 text-neutral-300'}`}>{post.platform}</Badge><Badge variant="outline" className="text-xs border-neutral-600 text-neutral-400">{post.type}</Badge></div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs text-neutral-400"><Clock className="w-3 h-3" />{post.bestTime}</div>
                        <div className="flex items-center gap-1 text-xs text-neutral-400"><Eye className="w-3 h-3" />{post.estimatedReach}</div>
                        <button onClick={() => copyToClipboard(post.content + '\n\n' + post.hashtags.join(' '), 100 + i)}>{copiedIndex === 100 + i ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-neutral-400 hover:text-white" />}</button>
                      </div>
                    </div>
                    <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-line mb-3">{post.content}</p>
                    <div className="flex flex-wrap gap-1">{post.hashtags.map((h, j) => <Badge key={j} className="text-xs bg-pink-500/10 text-pink-300 border-pink-500/20">{h}</Badge>)}</div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="calendar" className="mt-4">
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-5 border-b border-neutral-700">
                    {data.calendar?.map((day, i) => (
                      <div key={i} className="border-r last:border-r-0 border-neutral-700">
                        <div className="p-3 bg-neutral-800/50 border-b border-neutral-700 text-center"><span className="font-semibold text-white text-sm">{day.day}</span></div>
                        <div className="p-2 space-y-2">
                          {day.posts.map((post, j) => (
                            <div key={j} className="p-2 rounded-md bg-neutral-800 hover:bg-neutral-700/50 transition-colors cursor-pointer">
                              <div className="flex items-center gap-1 mb-1"><Clock className="w-3 h-3 text-neutral-500" /><span className="text-xs text-neutral-400 font-mono">{post.time}</span></div>
                              <Badge className={`text-[10px] mb-1 ${platformColors[post.platform.toLowerCase()] || 'bg-neutral-700 text-neutral-300'}`}>{post.platform}</Badge>
                              <p className="text-xs text-neutral-300 line-clamp-2">{post.content_summary}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="trends" className="mt-4"><div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.trends?.map((trend, i) => (
                  <div key={i} className="bg-neutral-900 border border-neutral-700 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-pink-500" /><span className="font-semibold text-white">{trend.trend}</span></div>
                      <Badge className={`text-xs ${trend.relevance === 'high' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>{trend.relevance}</Badge>
                    </div>
                    <p className="text-sm text-neutral-400">{trend.suggestion}</p>
                  </div>
                ))}
              </div></TabsContent>

              <TabsContent value="abtests" className="mt-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.abTests?.map((test, i) => (
                  <div key={i} className="bg-neutral-900 border border-neutral-700 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-4"><FlaskConical className="w-4 h-4 text-pink-500" /><span className="text-sm text-neutral-400">{t("modules.socialFactory.test")} #{i + 1}</span><Badge variant="outline" className="text-xs border-neutral-600 text-neutral-400 ml-auto"><BarChart3 className="w-3 h-3 mr-1" />{test.metric}</Badge></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"><p className="text-xs text-blue-400 uppercase mb-1">{t("modules.socialFactory.variantA")}</p><p className="text-sm text-white">{test.variant_a}</p></div>
                      <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20"><p className="text-xs text-purple-400 uppercase mb-1">{t("modules.socialFactory.variantB")}</p><p className="text-sm text-white">{test.variant_b}</p></div>
                    </div>
                  </div>
                ))}
              </div></TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
