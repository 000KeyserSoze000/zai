"use client"

import { useState, useEffect } from "react"
import { 
  Bot, Plus, Search, RefreshCw, Loader2,
  Edit, Trash2, Sparkles, Brain
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { useTranslation } from "@/lib/i18n"

interface Category {
  id: string
  name: string
  color: string
}

interface Agent {
  id: string
  name: string
  slug: string
  description: string | null
  systemPrompt: string
  modelName: string
  temperature: number
  maxTokens: number
  status: string
  color: string
  categoryId: string
  category: Category
  _count: { skills: number; executions: number }
}

const MODELS = [
  { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "openai/gpt-4o", label: "GPT-4o" },
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "google/gemini-pro-1.5", label: "Gemini 1.5 Pro" },
  { value: "mistralai/mistral-large", label: "Mistral Large" },
]

const COLORS = [
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "red", label: "Red", class: "bg-red-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
  { value: "cyan", label: "Cyan", class: "bg-cyan-500" },
]

export default function AdminAgentsPage() {
  const { t } = useTranslation()
  const [agents, setAgents] = useState<Agent[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [editDialog, setEditDialog] = useState(false)
  const [createDialog, setCreateDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  
  const [form, setForm] = useState({
    name: "", slug: "", description: "", systemPrompt: "",
    modelName: "anthropic/claude-3.5-sonnet", temperature: 0.7,
    maxTokens: 4096, color: "blue", categoryId: "", status: "ACTIVE"
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [agentsRes, catsRes] = await Promise.all([
        fetch("/api/admin/orchestrator/agents"),
        fetch("/api/admin/orchestrator/categories")
      ])
      
      if (agentsRes.ok) {
        const data = await agentsRes.json()
        setAgents(data.agents || [])
      }
      
      if (catsRes.ok) {
        const data = await catsRes.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSave = async (isEdit: boolean) => {
    if (!form.name || !form.slug || !form.categoryId || !form.systemPrompt) {
      alert(t("orchestrator.agentsPage.fillRequired"))
      return
    }
    
    setSaving(true)
    try {
      const url = isEdit && selectedAgent 
        ? `/api/admin/orchestrator/agents/${selectedAgent.id}`
        : "/api/admin/orchestrator/agents"
        
      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      
      if (response.ok) {
        setCreateDialog(false)
        setEditDialog(false)
        fetchData()
      } else {
        const data = await response.json()
        alert(data.error || t("common.error"))
      }
    } catch (error) {
      console.error("Error saving agent:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedAgent) return
    try {
      const response = await fetch(`/api/admin/orchestrator/agents/${selectedAgent.id}`, {
        method: "DELETE"
      })
      if (response.ok) {
        setDeleteDialog(false)
        fetchData()
      }
    } catch (error) {
      console.error("Error deleting agent:", error)
    }
  }

  const openEdit = (agent: Agent) => {
    setSelectedAgent(agent)
    setForm({
      name: agent.name,
      slug: agent.slug,
      description: agent.description || "",
      systemPrompt: agent.systemPrompt,
      modelName: agent.modelName,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      color: agent.color,
      categoryId: agent.categoryId,
      status: agent.status
    })
    setEditDialog(true)
  }

  const openCreate = () => {
    setForm({
      name: "", slug: "", description: "", systemPrompt: "",
      modelName: "anthropic/claude-3.5-sonnet", temperature: 0.7,
      maxTokens: 4096, color: "blue", categoryId: categories[0]?.id || "", status: "ACTIVE"
    })
    setCreateDialog(true)
  }

  const filtered = agents.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 bg-black min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              placeholder={t("orchestrator.agentsPage.searchAgents")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-neutral-900 border-neutral-700 text-white"
            />
          </div>
          <Button onClick={openCreate} className="bg-purple-500 hover:bg-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            {t("orchestrator.agentsPage.newAgent")}
          </Button>
          <Button onClick={fetchData} variant="outline" className="border-neutral-700 text-neutral-300">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("orchestrator.agentsPage.refresh")}
          </Button>
        </div>

        {/* Agents Table */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
              <p className="text-neutral-500 font-medium">{t("orchestrator.agentsPage.loading")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-neutral-950/50">
                <TableRow className="border-neutral-800">
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest px-6">{t("orchestrator.agentsPage.tableAgentCategory")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">{t("orchestrator.agentsPage.tableConfig")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest text-center">{t("orchestrator.agentsPage.tableSkills")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest text-center">{t("orchestrator.agentsPage.tableExecutions")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">{t("orchestrator.agentsPage.tableStatus")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest text-right px-6">{t("orchestrator.agentsPage.tableActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-neutral-500 py-16">
                      <div className="flex flex-col items-center gap-2">
                        <Brain className="w-12 h-12 text-neutral-800 mb-2" />
                        <p className="text-lg font-medium">{t("orchestrator.agentsPage.noAgent")}</p>
                        <p className="text-sm">{t("orchestrator.agentsPage.noAgentDesc")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((agent) => (
                    <TableRow key={agent.id} className="border-neutral-800 hover:bg-neutral-800/30 transition-colors">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl bg-${agent.color}-500/20 flex items-center justify-center border border-${agent.color}-500/30`}>
                            <Bot className={`w-5 h-5 text-${agent.color}-500`} />
                          </div>
                          <div>
                            <div className="text-white font-semibold">{agent.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[9px] border-neutral-700 bg-black/50 text-neutral-400 px-1 py-0">
                                    {agent.category?.name || t("orchestrator.agentsPage.noCategory")}
                                </Badge>
                                <span className="text-neutral-600 text-[10px] font-mono">/{agent.slug}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span className="text-neutral-300 font-medium">{agent.modelName.split('/').pop()}</span>
                          </div>
                          <div className="text-[10px] text-neutral-500 flex gap-3">
                            <span>{t("orchestrator.agentsPage.temperature")}: {agent.temperature}</span>
                            <span>{t("orchestrator.agentsPage.tokens")}: {agent.maxTokens}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-white text-sm">
                        {agent._count?.skills || 0}
                      </TableCell>
                      <TableCell className="text-center font-mono text-neutral-400 text-sm">
                        {agent._count?.executions || 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${agent.status === 'ACTIVE' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                          <span className={agent.status === 'ACTIVE' ? 'text-green-400 text-xs font-medium' : 'text-red-400 text-xs font-medium'}>
                            {agent.status === 'ACTIVE' ? t("orchestrator.agentsPage.statusActive") : t("orchestrator.agentsPage.statusInactive")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(agent)}
                            className="text-neutral-400 hover:text-white hover:bg-neutral-800"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setSelectedAgent(agent); setDeleteDialog(true) }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Create/Edit Agent Dialog */}
        <Dialog open={createDialog || editDialog} onOpenChange={(open) => {
          if (!open) { setCreateDialog(false); setEditDialog(false); }
        }}>
          <DialogContent className="bg-neutral-900 border-neutral-700 max-w-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
            <DialogHeader>
              <DialogTitle className="text-white">
                {createDialog ? t("orchestrator.agentsPage.dialogCreateTitle") : t("orchestrator.agentsPage.dialogEditTitle")}
              </DialogTitle>
              <DialogDescription className="text-neutral-400">
                {t("orchestrator.agentsPage.dialogDesc")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-6 py-4">
              <div className="col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-neutral-300">{t("orchestrator.agentsPage.formName")}</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => {
                        const name = e.target.value
                        setForm({ ...form, name, slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })
                      }}
                      className="bg-neutral-800 border-neutral-700 text-white"
                      placeholder="ex: Script Master"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-300">{t("orchestrator.agentsPage.formSlug")}</Label>
                    <Input
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      className="bg-neutral-800 border-neutral-700 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-neutral-300">{t("orchestrator.agentsPage.formPrompt")}</Label>
                  <Textarea
                    value={form.systemPrompt}
                    onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                    className="bg-neutral-800 border-neutral-700 text-white min-h-[120px]"
                    placeholder={t("orchestrator.agentsPage.formPromptPlaceholder")}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-neutral-300">{t("orchestrator.agentsPage.formCategory")}</Label>
                  <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue placeholder={t("orchestrator.categoriesPage.search")} />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="text-white">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-neutral-300">{t("orchestrator.agentsPage.formModel")}</Label>
                  <Select value={form.modelName} onValueChange={(v) => setForm({ ...form, modelName: v })}>
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      {MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value} className="text-white">
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                    <Label className="text-neutral-300">{t("orchestrator.agentsPage.formStatus")}</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                        <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-700">
                            <SelectItem value="ACTIVE" className="text-white font-medium">{t("orchestrator.agentsPage.statusActive")}</SelectItem>
                            <SelectItem value="INACTIVE" className="text-white font-medium">{t("orchestrator.agentsPage.statusInactive")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label className="text-neutral-300">{t("orchestrator.agentsPage.formTemperature")} ({form.temperature})</Label>
                  </div>
                  <Slider 
                    value={[form.temperature]} 
                    min={0} 
                    max={1} 
                    step={0.1} 
                    onValueChange={([v]) => setForm({ ...form, temperature: v })}
                  />
                  <p className="text-[10px] text-neutral-500">0.0 ({t("orchestrator.agentsPage.precis")}) &rarr; 1.0 ({t("orchestrator.agentsPage.creatif")})</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-neutral-300">{t("orchestrator.agentsPage.formTokens")}</Label>
                  <Input
                    type="number"
                    value={form.maxTokens}
                    onChange={(e) => setForm({ ...form, maxTokens: parseInt(e.target.value) || 0 })}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-neutral-300">{t("orchestrator.agentsPage.formColor")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setForm({ ...form, color: c.value })}
                        className={`w-6 h-6 rounded-full ${c.class} transition-all duration-200 ${
                          form.color === c.value ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-110 shadow-lg shadow-white/10" : "opacity-30 hover:opacity-60"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => { setCreateDialog(false); setEditDialog(false); }} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                {t("orchestrator.agentsPage.btnCancel")}
              </Button>
              <Button 
                onClick={() => handleSave(editDialog)} 
                disabled={saving} 
                className="bg-purple-500 hover:bg-purple-600 text-white px-8"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {editDialog ? t("orchestrator.agentsPage.btnSave") : t("orchestrator.agentsPage.btnLaunch")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent className="bg-neutral-900 border-neutral-700">
            <DialogHeader>
              <DialogTitle className="text-white">{t("orchestrator.agentsPage.dialogDeleteTitle")}</DialogTitle>
              <DialogDescription className="text-neutral-400">
                {t("orchestrator.agentsPage.dialogDeleteDesc", { name: selectedAgent?.name || "" })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDeleteDialog(false)} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                {t("orchestrator.agentsPage.btnCancel")}
              </Button>
              <Button onClick={handleDelete} variant="destructive" className="bg-red-500 hover:bg-red-600">
                {t("orchestrator.agentsPage.btnConfirmDelete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
