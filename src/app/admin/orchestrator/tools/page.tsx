"use client"

import { useState, useEffect } from "react"
import { 
  Hammer, Plus, Search, RefreshCw, Loader2,
  Edit, Trash2, Globe, Lock, Code, Coins
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

interface Tool {
  id: string
  name: string
  slug: string
  description: string | null
  type: string
  endpoint: string | null
  method: string
  costPerCall: number
  isActive: boolean
  _count: { skills: number; executions: number }
}

export default function AdminToolsPage() {
  const { t } = useTranslation()
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [editDialog, setEditDialog] = useState(false)
  const [createDialog, setCreateDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  
  const [form, setForm] = useState({
    name: "", slug: "", description: "", type: "API",
    endpoint: "", method: "POST", headers: "{}",
    authentication: "{}", inputSchema: "{}", outputSchema: "{}",
    costPerCall: 0, isActive: true
  })

  const fetchTools = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/orchestrator/tools")
      if (response.ok) {
        const data = await response.json()
        setTools(data.tools || [])
      }
    } catch (error) {
      console.error("Error fetching tools:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTools()
  }, [])

  const handleSave = async (isEdit: boolean) => {
    if (!form.name || !form.slug || (form.type === 'API' && !form.endpoint)) {
      alert(t("orchestrator.toolsPage.fillRequired"))
      return
    }
    
    setSaving(true)
    try {
      const url = isEdit && selectedTool 
        ? `/api/admin/orchestrator/tools/${selectedTool.id}`
        : "/api/admin/orchestrator/tools"
        
      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      
      if (response.ok) {
        setCreateDialog(false)
        setEditDialog(false)
        fetchTools()
      } else {
        const data = await response.json()
        alert(data.error || t("common.error"))
      }
    } catch (error) {
      console.error("Error saving tool:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedTool) return
    try {
      const response = await fetch(`/api/admin/orchestrator/tools/${selectedTool.id}`, {
        method: "DELETE"
      })
      if (response.ok) {
        setDeleteDialog(false)
        fetchTools()
      }
    } catch (error) {
      console.error("Error deleting tool:", error)
    }
  }

  const openEdit = (tool: Tool) => {
    setSelectedTool(tool)
    setForm({
      name: tool.name,
      slug: tool.slug,
      description: tool.description || "",
      type: tool.type,
      endpoint: tool.endpoint || "",
      method: tool.method,
      headers: "{}", 
      authentication: "{}",
      inputSchema: "{}",
      outputSchema: "{}",
      costPerCall: tool.costPerCall,
      isActive: tool.isActive
    })
    setEditDialog(true)
  }

  const openCreate = () => {
    setForm({
      name: "", slug: "", description: "", type: "API",
      endpoint: "", method: "POST", headers: "{}",
      authentication: "{}", inputSchema: "{}", outputSchema: "{}",
      costPerCall: 0, isActive: true
    })
    setCreateDialog(true)
  }

  const filtered = tools.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 bg-black min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              placeholder={t("orchestrator.toolsPage.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-neutral-900 border-neutral-700 text-white"
            />
          </div>
          <Button onClick={openCreate} className="bg-purple-500 hover:bg-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            {t("orchestrator.toolsPage.newTool")}
          </Button>
          <Button onClick={fetchTools} variant="outline" className="border-neutral-700 text-neutral-300">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("orchestrator.toolsPage.refresh")}
          </Button>
        </div>

        {/* Tools Table */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
              <p className="text-neutral-500 font-medium">{t("orchestrator.toolsPage.loading")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-neutral-950/50">
                <TableRow className="border-neutral-800">
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest px-6">{t("orchestrator.toolsPage.tableToolType")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">{t("orchestrator.toolsPage.tableConfig")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest text-center">{t("orchestrator.toolsPage.tableUsedBy")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest text-center">{t("orchestrator.toolsPage.tableCost")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">{t("orchestrator.toolsPage.tableStatus")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest text-right px-6">{t("orchestrator.toolsPage.tableActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-neutral-500 py-16">
                      <div className="flex flex-col items-center gap-2">
                        <Hammer className="w-12 h-12 text-neutral-800 mb-2" />
                        <p className="text-lg font-medium">{t("orchestrator.toolsPage.noTool")}</p>
                        <p className="text-sm">{t("orchestrator.toolsPage.noToolDesc")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((tool) => (
                    <TableRow key={tool.id} className="border-neutral-800 hover:bg-neutral-800/30 transition-colors">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
                            <Globe className="w-5 h-5 text-green-500" />
                          </div>
                          <div>
                            <div className="text-white font-semibold">{tool.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[9px] border-neutral-700 bg-black/50 text-neutral-400 px-1 py-0">
                                    {tool.type}
                                </Badge>
                                <span className="text-neutral-600 text-[10px] font-mono">/{tool.slug}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 max-w-[200px]">
                          {tool.endpoint ? (
                            <div className="text-xs text-neutral-400 truncate font-mono">
                              {tool.method} {tool.endpoint}
                            </div>
                          ) : (
                            <span className="text-[10px] text-neutral-600 italic">{t("orchestrator.toolsPage.internalFunction")}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-neutral-800 text-neutral-300">
                          {tool._count?.skills || 0} skills
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-yellow-500/80 items-center justify-center gap-1 text-yellow-500/80">
                          <Coins className="w-3 h-3" />
                          <span className="text-sm font-mono">${tool.costPerCall.toFixed(3)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${tool.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-neutral-700'}`} />
                          <span className={tool.isActive ? 'text-green-400 text-xs font-medium' : 'text-neutral-500 text-xs font-medium'}>
                            {tool.isActive ? t("orchestrator.toolsPage.statusActive") : t("orchestrator.toolsPage.statusInactive")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(tool)}
                            className="text-neutral-400 hover:text-white hover:bg-neutral-800"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setSelectedTool(tool); setDeleteDialog(true) }}
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

        {/* Create/Edit Tool Dialog */}
        <Dialog open={createDialog || editDialog} onOpenChange={(open) => {
          if (!open) { setCreateDialog(false); setEditDialog(false); }
        }}>
          <DialogContent className="bg-neutral-900 border-neutral-700 max-w-3xl overflow-y-auto max-h-[90vh] no-scrollbar">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Hammer className="w-5 h-5 text-green-500" />
                {createDialog ? t("orchestrator.toolsPage.dialogCreateTitle") : t("orchestrator.toolsPage.dialogEditTitle")}
              </DialogTitle>
              <DialogDescription className="text-neutral-400">
                {t("orchestrator.toolsPage.dialogDesc")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-6 py-4">
              <div className="col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-neutral-300">{t("orchestrator.toolsPage.formName")}</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => {
                        const name = e.target.value
                        setForm({ ...form, name, slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })
                      }}
                      className="bg-neutral-800 border-neutral-700 text-white"
                      placeholder="ex: Google Search"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-300">{t("orchestrator.toolsPage.formSlug")}</Label>
                    <Input
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      className="bg-neutral-800 border-neutral-700 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-neutral-300">{t("orchestrator.toolsPage.formDescription")}</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="bg-neutral-800 border-neutral-700 text-white"
                    placeholder={t("orchestrator.toolsPage.formDescriptionPlaceholder")}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-neutral-300">{t("orchestrator.toolsPage.formType")}</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      <SelectItem value="API" className="text-white">{t("orchestrator.toolsPage.formTypeApi")}</SelectItem>
                      <SelectItem value="FUNCTION" className="text-white">{t("orchestrator.toolsPage.formTypeFunction")}</SelectItem>
                      <SelectItem value="SCRAPER" className="text-white">{t("orchestrator.toolsPage.formTypeScraper")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.type === 'API' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-neutral-300">{t("orchestrator.toolsPage.formEndpoint")}</Label>
                      <Input
                        value={form.endpoint}
                        onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
                        className="bg-neutral-800 border-neutral-700 text-white font-mono text-sm"
                        placeholder="https://api.example.com/v1/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-300">{t("orchestrator.toolsPage.formMethod")}</Label>
                      <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                        <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-700">
                          <SelectItem value="GET" className="text-white font-bold">GET</SelectItem>
                          <SelectItem value="POST" className="text-white font-bold">POST</SelectItem>
                          <SelectItem value="PUT" className="text-white font-bold">PUT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-neutral-300 flex items-center gap-2">
                    <Lock className="w-3 h-3" /> {t("orchestrator.toolsPage.formHeaders")}
                  </Label>
                  <Textarea
                    value={form.headers}
                    onChange={(e) => setForm({ ...form, headers: e.target.value })}
                    className="bg-neutral-800 border-neutral-700 text-white font-mono text-[10px]"
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-300 flex items-center gap-2">
                    <Coins className="w-3 h-3" /> {t("orchestrator.toolsPage.formCost")}
                  </Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={form.costPerCall}
                    onChange={(e) => setForm({ ...form, costPerCall: parseFloat(e.target.value) || 0 })}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4 border-t border-neutral-800 pt-6">
              <Button variant="outline" onClick={() => { setCreateDialog(false); setEditDialog(false); }} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                {t("orchestrator.toolsPage.btnCancel")}
              </Button>
              <Button 
                onClick={() => handleSave(editDialog)} 
                disabled={saving} 
                className="bg-purple-500 hover:bg-purple-600 text-white px-10"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {editDialog ? t("orchestrator.toolsPage.btnUpdate") : t("orchestrator.toolsPage.btnCreate")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent className="bg-neutral-900 border-neutral-700">
            <DialogHeader>
              <DialogTitle className="text-white">{t("orchestrator.toolsPage.dialogDeleteTitle")}</DialogTitle>
              <DialogDescription className="text-neutral-400">
                {t("orchestrator.toolsPage.dialogDeleteDesc", { name: selectedTool?.name || "" })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDeleteDialog(false)} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                {t("orchestrator.toolsPage.btnCancel")}
              </Button>
              <Button onClick={handleDelete} variant="destructive" className="bg-red-500 hover:bg-red-600">
                {t("orchestrator.toolsPage.btnConfirmDelete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
