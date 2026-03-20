"use client"

import { useState, useEffect } from "react"
import { 
  Zap, Plus, Search, RefreshCw, Loader2,
  Edit, Trash2, Code, FileJson, Sparkles, Layers, Hammer, Box
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
import { useTranslation } from "@/lib/i18n"

interface Agent {
  id: string
  name: string
  color: string
}

interface Skill {
  id: string
  name: string
  slug: string
  description: string | null
  type: string
  promptTemplate: string
  inputSchema: string
  outputSchema: string
  isActive: boolean
  version: number
  agentId: string
  files: any | null
  agent: Agent
  _count: { executions: number; tools: number }
}

export default function AdminSkillsPage() {
  const { t } = useTranslation()
  const [skills, setSkills] = useState<Skill[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [editDialog, setEditDialog] = useState(false)
  const [createDialog, setCreateDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [form, setForm] = useState({
    name: "", slug: "", description: "", type: "GENERATION",
    promptTemplate: "", inputSchema: "{}", outputSchema: "{}",
    agentId: "", isActive: true,
    files: null as any | null
  })
  const [selectedFile, setSelectedFile] = useState<string>("SKILL.md")

  const fetchData = async () => {
    setLoading(true)
    try {
      const [skillsRes, agentsRes] = await Promise.all([
        fetch("/api/admin/orchestrator/skills"),
        fetch("/api/admin/orchestrator/agents")
      ])
      
      if (skillsRes.ok) {
        const data = await skillsRes.json()
        setSkills(data.skills || [])
      }
      
      if (agentsRes.ok) {
        const data = await agentsRes.json()
        setAgents(data.agents || [])
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
    if (!form.name || !form.slug || !form.agentId || !form.promptTemplate) {
      alert(t("orchestrator.skillsPage.fillRequired"))
      return
    }
    
    setSaving(true)
    try {
      const url = isEdit && selectedSkill 
        ? `/api/admin/orchestrator/skills/${selectedSkill.id}`
        : "/api/admin/orchestrator/skills"
        
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
      console.error("Error saving skill:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedSkill) return
    try {
      const response = await fetch(`/api/admin/orchestrator/skills/${selectedSkill.id}`, {
        method: "DELETE"
      })
      if (response.ok) {
        setDeleteDialog(false)
        fetchData()
      }
    } catch (error) {
      console.error("Error deleting skill:", error)
    }
  }

  const openEdit = (skill: Skill) => {
    setSelectedSkill(skill)
    setForm({
      name: skill.name,
      slug: skill.slug,
      description: skill.description || "",
      type: skill.type,
      promptTemplate: skill.promptTemplate,
      inputSchema: skill.inputSchema,
      outputSchema: skill.outputSchema,
      agentId: skill.agentId,
      isActive: skill.isActive,
      files: skill.files
    })
    setSelectedFile("SKILL.md")
    setEditDialog(true)
  }

  const openCreate = () => {
    setForm({
      name: "", slug: "", description: "", type: "GENERATION",
      promptTemplate: "", inputSchema: "{}", outputSchema: "{}",
      agentId: agents[0]?.id || "", isActive: true,
      files: null
    })
    setSelectedFile("SKILL.md")
    setCreateDialog(true)
  }

  const filtered = skills.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 bg-black min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              placeholder={t("orchestrator.skillsPage.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-neutral-900 border-neutral-700 text-white"
            />
          </div>
          <Button onClick={openCreate} className="bg-purple-500 hover:bg-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            {t("orchestrator.skillsPage.newSkill")}
          </Button>
          <Button 
            onClick={() => window.location.href = "/admin/orchestrator/esc-collection"} 
            variant="outline" 
            className="border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
          >
            <Box className="w-4 h-4 mr-2" />
            {t("nav.escCollection")}
          </Button>
          <Button onClick={fetchData} variant="outline" className="border-neutral-700 text-neutral-300">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("orchestrator.skillsPage.refresh")}
          </Button>
        </div>

        {/* Skills Table */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
              <p className="text-neutral-500 font-medium">{t("orchestrator.skillsPage.loading")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-neutral-950/50">
                <TableRow className="border-neutral-800">
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest px-6">{t("orchestrator.skillsPage.tableSkill")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">{t("orchestrator.skillsPage.tableAgent")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest text-center">{t("orchestrator.skillsPage.tableVersion")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest text-center">{t("orchestrator.skillsPage.tableTools")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest text-center">{t("orchestrator.skillsPage.tableExecutions")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">{t("orchestrator.skillsPage.tableStatus")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest text-right px-6">{t("orchestrator.skillsPage.tableActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-neutral-500 py-16">
                      <div className="flex flex-col items-center gap-2">
                        <Zap className="w-12 h-12 text-neutral-800 mb-2" />
                        <p className="text-lg font-medium">{t("orchestrator.skillsPage.noSkill")}</p>
                        <p className="text-sm">{t("orchestrator.skillsPage.noSkillDesc")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((skill) => (
                    <TableRow key={skill.id} className="border-neutral-800 hover:bg-neutral-800/30 transition-colors">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                            <Layers className="w-5 h-5 text-orange-500" />
                          </div>
                          <div>
                            <div className="text-white font-semibold">{skill.name}</div>
                            <div className="text-[10px] text-neutral-500 font-mono italic">/{skill.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`border-${skill.agent?.color || 'blue'}-500/30 text-${skill.agent?.color || 'blue'}-400 bg-${skill.agent?.color || 'blue'}-500/5`}>
                            {skill.agent?.name || t("orchestrator.skillsPage.unassigned")}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-neutral-800 text-neutral-300 hover:bg-neutral-700">v{skill.version}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 text-neutral-400">
                          <Hammer className="w-3 h-3" />
                          <span className="text-sm font-mono">{skill._count?.tools || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-neutral-500 text-sm">
                        {skill._count?.executions || 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${skill.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className={skill.isActive ? 'text-green-400 text-xs' : 'text-red-400 text-xs'}>
                            {skill.isActive ? t("orchestrator.skillsPage.statusActive") : t("orchestrator.skillsPage.statusInactive")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(skill)}
                            className="text-neutral-400 hover:text-white hover:bg-neutral-800"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setSelectedSkill(skill); setDeleteDialog(true) }}
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

        {/* Create/Edit Skill Dialog */}
        <Dialog open={createDialog || editDialog} onOpenChange={(open) => {
          if (!open) { setCreateDialog(false); setEditDialog(false); setSelectedFile("SKILL.md"); }
        }}>
          <DialogContent className="bg-neutral-900 border-neutral-700 max-w-5xl overflow-y-auto max-h-[95vh] no-scrollbar">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-500" />
                {createDialog ? t("orchestrator.skillsPage.dialogCreateTitle") : t("orchestrator.skillsPage.dialogEditTitle")}
              </DialogTitle>
              <DialogDescription className="text-neutral-400">
                {t("orchestrator.skillsPage.dialogDesc")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-12 gap-6 py-4">
              {/* Left Column: Basic Info & Prompt */}
              <div className="col-span-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <Label className="text-neutral-300">{t("orchestrator.skillsPage.formName")}</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => {
                        const name = e.target.value
                        setForm({ ...form, name, slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })
                      }}
                      className="bg-neutral-800 border-neutral-700 text-white"
                      placeholder="ex: Génération de Script"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-300">{t("orchestrator.skillsPage.formSlug")}</Label>
                    <Input
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      className="bg-neutral-800 border-neutral-700 text-white font-mono"
                    />
                  </div>
                </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    {/* File Explorer for Bundles */}
                    {form.files && Object.keys(form.files).length > 0 && (
                      <div className="w-full md:w-48 border border-neutral-800 rounded-md bg-black/20 p-2 overflow-y-auto max-h-[400px]">
                        <div className="text-[10px] uppercase font-bold text-neutral-500 mb-2 px-2">Bundle Files</div>
                        {Object.keys(form.files).map(fileName => (
                          <button
                            key={fileName}
                            type="button"
                            onClick={() => setSelectedFile(fileName)}
                            className={`w-full text-left px-3 py-1.5 text-[10px] rounded transition-colors mb-1 truncate ${
                              selectedFile === fileName ? "bg-purple-600 text-white" : "text-neutral-400 hover:bg-neutral-800"
                            }`}
                          >
                            {fileName}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setSelectedFile("SKILL.md")}
                          className={`w-full text-left px-3 py-1.5 text-[10px] rounded transition-colors ${
                            selectedFile === "SKILL.md" ? "bg-purple-600 text-white" : "text-neutral-400 hover:bg-neutral-800"
                          }`}
                        >
                          Main Prompt (SKILL.md)
                        </button>
                      </div>
                    )}

                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-neutral-300 flex items-center gap-2">
                          <Code className="w-3 h-3" /> {selectedFile === "SKILL.md" ? t("orchestrator.skillsPage.formPromptTemplate") : `Contenu de ${selectedFile}`}
                        </Label>
                        <span className="text-[10px] text-neutral-500 font-mono">{t("orchestrator.skillsPage.formPromptHint")}</span>
                      </div>
                      <Textarea
                        value={selectedFile === "SKILL.md" ? form.promptTemplate : (form.files?.[selectedFile] || "")}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (selectedFile === "SKILL.md") {
                            setForm({ ...form, promptTemplate: val });
                          } else {
                            setForm({ 
                              ...form, 
                              files: { ...form.files, [selectedFile]: val } 
                            });
                          }
                        }}
                        className="bg-neutral-800 border-neutral-700 text-white min-h-[400px] font-mono text-[11px] leading-relaxed"
                        placeholder={t("orchestrator.skillsPage.formPromptPlaceholder")}
                      />
                    </div>
                  </div>
                </div>

              {/* Right Column: Config & Schema */}
              <div className="col-span-4 space-y-6">
                <div className="space-y-2">
                  <Label className="text-neutral-300">{t("orchestrator.skillsPage.formAgent")}</Label>
                  <Select value={form.agentId} onValueChange={(v) => setForm({ ...form, agentId: v })}>
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue placeholder={t("orchestrator.skillsPage.formAgentPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id} className="text-white">
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-neutral-300">{t("orchestrator.skillsPage.formType")}</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      <SelectItem value="GENERATION" className="text-white">{t("orchestrator.skillsPage.typeGeneration")}</SelectItem>
                      <SelectItem value="ANALYSIS" className="text-white">{t("orchestrator.skillsPage.typeAnalysis")}</SelectItem>
                      <SelectItem value="EXTRACTION" className="text-white">{t("orchestrator.skillsPage.typeExtraction")}</SelectItem>
                      <SelectItem value="TRANSFORMATION" className="text-white">{t("orchestrator.skillsPage.typeTransformation")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-neutral-300 flex items-center gap-2">
                      <FileJson className="w-3 h-3" /> {t("orchestrator.skillsPage.formInputSchema")}
                    </Label>
                    <Textarea
                      value={form.inputSchema}
                      onChange={(e) => setForm({ ...form, inputSchema: e.target.value })}
                      className="bg-neutral-800 border-neutral-700 text-white font-mono text-[10px] leading-tight"
                      rows={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-neutral-300 flex items-center gap-2">
                      <FileJson className="w-3 h-3 text-green-400" /> {t("orchestrator.skillsPage.formOutputSchema")}
                    </Label>
                    <Textarea
                      value={form.outputSchema}
                      onChange={(e) => setForm({ ...form, outputSchema: e.target.value })}
                      className="bg-neutral-800 border-neutral-700 text-white font-mono text-[10px] leading-tight"
                      rows={6}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4 border-t border-neutral-800 pt-6">
              <Button variant="outline" onClick={() => { setCreateDialog(false); setEditDialog(false); }} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                {t("orchestrator.skillsPage.btnCancel")}
              </Button>
              <Button 
                onClick={() => handleSave(editDialog)} 
                disabled={saving} 
                className="bg-purple-500 hover:bg-purple-600 text-white px-10"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {editDialog ? t("orchestrator.skillsPage.btnUpdate") : t("orchestrator.skillsPage.btnCreate")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent className="bg-neutral-900 border-neutral-700">
            <DialogHeader>
              <DialogTitle className="text-white">{t("orchestrator.skillsPage.dialogDeleteTitle")}</DialogTitle>
              <DialogDescription className="text-neutral-400">
                {t("orchestrator.skillsPage.dialogDeleteDesc", { name: selectedSkill?.name || "" })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDeleteDialog(false)} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                {t("orchestrator.skillsPage.btnCancel")}
              </Button>
              <Button onClick={handleDelete} variant="destructive" className="bg-red-500 hover:bg-red-600">
                {t("orchestrator.skillsPage.btnConfirmDelete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
