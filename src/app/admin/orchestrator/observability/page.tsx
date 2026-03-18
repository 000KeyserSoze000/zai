"use client"

import { useState, useEffect } from "react"
import { 
  History, Search, RefreshCw, Loader2,
  CheckCircle2, XCircle, Clock, Database,
  Eye, Filter, Zap, Bot, Coins
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface ExecutionLog {
  id: string
  status: string
  durationMs: number | null
  tokensUsed: number | null
  cost: number | null
  createdAt: string
  agent: { name: string; color: string } | null
  skill: { name: string } | null
  tool: { name: string } | null
  input: string | null
  output: string | null
  error: string | null
}

export default function ObservabilityPage() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<ExecutionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [liveMode, setLiveMode] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedLog, setSelectedLog] = useState<ExecutionLog | null>(null)
  const [detailDialog, setDetailDialog] = useState(false)

  const fetchLogs = async (isInitial = false) => {
    if (isInitial) setLoading(true)
    try {
      const response = await fetch("/api/admin/orchestrator/observability")
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(true)
  }, [])

  // Live polling
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (liveMode) {
      interval = setInterval(() => {
        fetchLogs()
      }, 5000) // Poll every 5s
    }
    return () => clearInterval(interval)
  }, [liveMode])

  const filtered = logs.filter(l => {
    const matchesSearch = l.agent?.name?.toLowerCase().includes(search.toLowerCase()) ||
                          l.skill?.name?.toLowerCase().includes(search.toLowerCase()) ||
                          l.id.includes(search)
    const matchesStatus = statusFilter === "all" || l.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 bg-black min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-1 shadow-lg shadow-purple-500/5">
            <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Database className="w-3 h-3" /> {t("orchestrator.observabilityPage.totalExecutions")}
            </span>
            <span className="text-2xl font-bold text-white">{logs.length}</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-1 shadow-lg shadow-green-500/5">
            <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" /> {t("orchestrator.observabilityPage.success")}
            </span>
            <span className="text-2xl font-bold text-green-400">
                {logs.filter(l => l.status === 'SUCCESS').length}
            </span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-1 shadow-lg shadow-red-500/5">
            <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-500" /> {t("orchestrator.observabilityPage.failed")}
            </span>
            <span className="text-2xl font-bold text-red-400">
                {logs.filter(l => l.status === 'FAILED').length}
            </span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-1 shadow-lg shadow-yellow-500/5">
            <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Coins className="w-3 h-3 text-yellow-500" /> {t("orchestrator.observabilityPage.estimatedCost")}
            </span>
            <span className="text-2xl font-bold text-yellow-400">
                ${logs.reduce((sum, l) => sum + (l.cost || 0), 0).toFixed(4)}
            </span>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              placeholder={t("orchestrator.observabilityPage.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-neutral-900 border-neutral-700 text-white"
            />
          </div>
          <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-neutral-900/50 border border-neutral-800 rounded-lg">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">{t("orchestrator.observabilityPage.livePolling")}</span>
                  <button 
                    onClick={() => setLiveMode(!liveMode)}
                    className={cn(
                        "w-8 h-4 rounded-full relative transition-colors",
                        liveMode ? "bg-green-500" : "bg-neutral-700"
                    )}
                  >
                      <div className={cn(
                          "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                          liveMode ? "left-[18px]" : "left-0.5"
                      )} />
                  </button>
              </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-neutral-900 border-neutral-700 text-white w-[140px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="all" className="text-white">{t("orchestrator.observabilityPage.statusAll")}</SelectItem>
                    <SelectItem value="SUCCESS" className="text-green-400">{t("orchestrator.observabilityPage.statusSuccess")}</SelectItem>
                    <SelectItem value="FAILED" className="text-red-400">{t("orchestrator.observabilityPage.statusFailed")}</SelectItem>
                    <SelectItem value="RUNNING" className="text-blue-400">{t("orchestrator.observabilityPage.statusRunning")}</SelectItem>
                </SelectContent>
            </Select>
              <Button onClick={() => fetchLogs(true)} variant="outline" className="border-neutral-700 text-neutral-300">
                <RefreshCw className={cn("w-4 h-4 mr-2", liveMode && "animate-spin")} />
                {t("orchestrator.observabilityPage.refresh")}
              </Button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
              <p className="text-neutral-500 font-medium tracking-wide">{t("orchestrator.observabilityPage.loading")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-neutral-950/50">
                <TableRow className="border-neutral-800">
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest px-6">{t("orchestrator.observabilityPage.tableDateTime")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">{t("orchestrator.observabilityPage.tableActor")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest text-center">{t("orchestrator.observabilityPage.tablePerformance")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">{t("orchestrator.observabilityPage.tableStatus")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest text-right px-6">{t("orchestrator.observabilityPage.tableDetails")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-neutral-500 py-16">
                      <div className="flex flex-col items-center gap-2">
                        <History className="w-12 h-12 text-neutral-800 mb-2" />
                        <p className="text-lg font-medium">{t("orchestrator.observabilityPage.noLog")}</p>
                        <p className="text-sm">{t("orchestrator.observabilityPage.noLogDesc")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((log) => (
                    <TableRow key={log.id} className="border-neutral-800 hover:bg-neutral-800/30 transition-colors">
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="text-white text-xs font-medium">{new Date(log.createdAt).toLocaleDateString()}</span>
                            <span className="text-neutral-500 text-[10px] font-mono">{new Date(log.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <Bot className={cn("w-3 h-3", `text-${log.agent?.color || 'blue'}-400`)} />
                                <span className="text-neutral-200 text-xs font-semibold">{log.agent?.name || t("orchestrator.observabilityPage.system")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="w-3 h-3 text-orange-400" />
                                <span className="text-neutral-500 text-[10px]">{log.skill?.name || t("orchestrator.observabilityPage.directTask")}</span>
                            </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col gap-1 items-center">
                            <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                                <Clock className="w-2 h-2" /> {log.durationMs ? `${log.durationMs}ms` : '-'}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-cyan-400/70">
                                <span className="font-mono">{log.tokensUsed || 0} tks</span>
                            </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                            "text-[10px] px-2 py-0 border-0 flex items-center gap-1 w-fit",
                            log.status === 'SUCCESS' ? 'bg-green-500/10 text-green-400' :
                            log.status === 'RUNNING' ? 'bg-blue-500/10 text-blue-400 animate-pulse' :
                            'bg-red-500/10 text-red-400'
                        )}>
                          {log.status === 'RUNNING' && <Loader2 className="w-2 h-2 animate-spin" />}
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setSelectedLog(log); setDetailDialog(true); }}
                          className="text-neutral-400 hover:text-white hover:bg-neutral-800"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Log Details Dialog */}
        <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
            <DialogContent className="bg-neutral-900 border-neutral-700 max-w-4xl overflow-y-auto max-h-[90vh] no-scrollbar">
                <DialogHeader className="border-b border-neutral-800 pb-4">
                    <DialogTitle className="text-white flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <History className="w-5 h-5 text-cyan-500" />
                            {t("orchestrator.observabilityPage.dialogTitle")}
                        </span>
                        <Badge variant="outline" className="border-neutral-700 text-neutral-500 font-mono text-[10px]">
                            ID: {selectedLog?.id}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-6 py-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest">{t("orchestrator.observabilityPage.formInput")}</Label>
                            <div className="bg-black/40 border border-neutral-800 rounded-lg p-4 font-mono text-xs text-neutral-300 min-h-[150px] whitespace-pre-wrap overflow-auto max-h-[300px] no-scrollbar">
                                {selectedLog?.input || t("orchestrator.observabilityPage.noInput")}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest">{t("orchestrator.observabilityPage.formOutput")}</Label>
                            <div className={`bg-black/40 border ${selectedLog?.status === 'FAILED' ? 'border-red-900/50' : 'border-neutral-800'} rounded-lg p-4 font-mono text-xs text-neutral-300 min-h-[150px] whitespace-pre-wrap overflow-auto max-h-[300px] no-scrollbar`}>
                                {selectedLog?.status === 'FAILED' ? selectedLog?.error : selectedLog?.output || t("orchestrator.observabilityPage.noOutput")}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-4 grid grid-cols-3 gap-8">
                    <div className="flex flex-col">
                        <span className="text-neutral-500 text-[9px] uppercase font-bold tracking-tighter mb-1">{t("orchestrator.observabilityPage.targets")}</span>
                        <div className="flex gap-2">
                            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">{selectedLog?.agent?.name}</Badge>
                            <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">{selectedLog?.skill?.name}</Badge>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-neutral-500 text-[9px] uppercase font-bold tracking-tighter mb-1">{t("orchestrator.observabilityPage.chronometry")}</span>
                        <span className="text-white text-sm font-mono">{selectedLog?.durationMs}ms</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-neutral-500 text-[9px] uppercase font-bold tracking-tighter mb-1">{t("orchestrator.observabilityPage.resources")}</span>
                        <div className="flex flex-col group">
                            <span className="text-cyan-400 text-sm font-mono">{selectedLog?.tokensUsed || 0} tokens used</span>
                            <span className="text-neutral-600 text-[10px] group-hover:text-yellow-500/50 transition-colors">Est. Cost: ${selectedLog?.cost?.toFixed(5)}</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
