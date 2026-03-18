"use client"

import { useState, useEffect } from "react"
import { 
  Calendar, Plus, Search, RefreshCw, Loader2,
  Edit, Trash2, Clock, Play, Pause, AlertCircle
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

interface Skill {
  id: string
  name: string
  agent: { name: string }
}

interface ScheduledTask {
  id: string
  name: string
  description: string | null
  cron: string
  skillId: string
  inputData: string | null
  lastRunAt: string | null
  nextRunAt: string | null
  status: string
  isActive: boolean
  skill: Skill
}

export default function AdminSchedulerPage() {
  const { t } = useTranslation()
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [editDialog, setEditDialog] = useState(false)
  const [createDialog, setCreateDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null)
  
  const [form, setForm] = useState({
    name: "", description: "", cron: "0 0 * * *",
    skillId: "", inputData: "{}", status: "ACTIVE", isActive: true
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tasksRes, skillsRes] = await Promise.all([
        fetch("/api/admin/orchestrator/scheduler"),
        fetch("/api/admin/orchestrator/skills")
      ])
      
      if (tasksRes.ok) {
        const data = await tasksRes.json()
        setTasks(data.tasks || [])
      }
      
      if (skillsRes.ok) {
        const data = await skillsRes.json()
        setSkills(data.skills || [])
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
    if (!form.name || !form.cron || !form.skillId) {
      alert(t("orchestrator.schedulerPage.fillRequired"))
      return
    }
    
    setSaving(true)
    try {
      const url = isEdit && selectedTask 
        ? `/api/admin/orchestrator/scheduler/${selectedTask.id}`
        : "/api/admin/orchestrator/scheduler"
        
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
      console.error("Error saving task:", error)
    } finally {
      setSaving(false)
    }
  }

  const toggleTask = async (task: ScheduledTask) => {
    try {
      await fetch(`/api/admin/orchestrator/scheduler/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !task.isActive })
      })
      fetchData()
    } catch (error) {
      console.error("Error toggling task:", error)
    }
  }

  const handleDelete = async () => {
    if (!selectedTask) return
    try {
      const response = await fetch(`/api/admin/orchestrator/scheduler/${selectedTask.id}`, {
        method: "DELETE"
      })
      if (response.ok) {
        setDeleteDialog(false)
        fetchData()
      }
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  const openEdit = (task: ScheduledTask) => {
    setSelectedTask(task)
    setForm({
      name: task.name,
      description: task.description || "",
      cron: task.cron,
      skillId: task.skillId,
      inputData: task.inputData || "{}",
      status: task.status,
      isActive: task.isActive
    })
    setEditDialog(true)
  }

  const openCreate = () => {
    setForm({
      name: "", description: "", cron: "0 0 * * *",
      skillId: skills[0]?.id || "", inputData: "{}", status: "ACTIVE", isActive: true
    })
    setCreateDialog(true)
  }

  const filtered = tasks.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 bg-black min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              placeholder={t("orchestrator.schedulerPage.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-neutral-900 border-neutral-700 text-white"
            />
          </div>
          <Button onClick={openCreate} className="bg-purple-500 hover:bg-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            {t("orchestrator.schedulerPage.newTask")}
          </Button>
          <Button onClick={fetchData} variant="outline" className="border-neutral-700 text-neutral-300">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("orchestrator.schedulerPage.refresh")}
          </Button>
        </div>

        {/* Scheduler Table */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
              <p className="text-neutral-500 font-medium">{t("orchestrator.schedulerPage.loading")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-neutral-950/50">
                <TableRow className="border-neutral-800">
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest px-6">{t("orchestrator.schedulerPage.tableTaskSkill")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">{t("orchestrator.schedulerPage.tableRecurrence")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">{t("orchestrator.schedulerPage.tableExecutions")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">{t("orchestrator.schedulerPage.tableStatus")}</TableHead>
                  <TableHead className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest text-right px-6">{t("orchestrator.schedulerPage.tableActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-neutral-500 py-16">
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="w-12 h-12 text-neutral-800 mb-2" />
                        <p className="text-lg font-medium">{t("orchestrator.schedulerPage.noTask")}</p>
                        <p className="text-sm">{t("orchestrator.schedulerPage.noTaskDesc")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((task) => (
                    <TableRow key={task.id} className="border-neutral-800 hover:bg-neutral-800/30 transition-colors">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center border border-pink-500/20`}>
                            <Clock className={`w-5 h-5 text-pink-500`} />
                          </div>
                          <div>
                            <div className="text-white font-semibold">{task.name}</div>
                            <div className="text-[10px] text-neutral-500 mt-1">
                                <span className="text-neutral-400 font-medium">{task.skill?.name}</span>
                                <span className="mx-1">•</span>
                                <span className="italic">{task.skill?.agent?.name}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-neutral-800 text-neutral-300 px-2 py-1 rounded text-xs font-mono">
                          {task.cron}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-[10px]">
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-500 w-12">{t("orchestrator.schedulerPage.lastRun")}</span>
                            <span className="text-neutral-300">{task.lastRunAt ? new Date(task.lastRunAt).toLocaleString() : t("orchestrator.schedulerPage.never")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-500 w-12">{t("orchestrator.schedulerPage.nextRun")}</span>
                            <span className="text-cyan-400">{task.nextRunAt ? new Date(task.nextRunAt).toLocaleString() : t("orchestrator.schedulerPage.calculating")}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <button 
                            onClick={() => toggleTask(task)}
                            className="flex items-center gap-2"
                        >
                          <div className={`w-2 h-2 rounded-full ${task.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                          <span className={task.isActive ? 'text-green-400 text-xs' : 'text-red-400 text-xs'}>
                            {task.isActive ? t("orchestrator.schedulerPage.statusActive") : t("orchestrator.schedulerPage.statusPaused")}
                          </span>
                        </button>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(task)}
                            className="text-neutral-400 hover:text-white hover:bg-neutral-800"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            onClick={() => toggleTask(task)}
                            size="sm"
                            variant="ghost"
                            className="hover:bg-neutral-800"
                          >
                            {task.isActive ? <Pause className="w-4 h-4 text-yellow-500" /> : <Play className="w-4 h-4 text-green-500" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setSelectedTask(task); setDeleteDialog(true) }}
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

        {/* Create/Edit Task Dialog */}
        <Dialog open={createDialog || editDialog} onOpenChange={(open) => {
          if (!open) { setCreateDialog(false); setEditDialog(false); }
        }}>
          <DialogContent className="bg-neutral-900 border-neutral-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-pink-500" />
                {createDialog ? t("orchestrator.schedulerPage.dialogCreateTitle") : t("orchestrator.schedulerPage.dialogEditTitle")}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-neutral-300">{t("orchestrator.schedulerPage.formName")}</Label>
                        <Input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="bg-neutral-800 border-neutral-700 text-white"
                            placeholder={t("orchestrator.schedulerPage.formNamePlaceholder")}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-neutral-300">{t("orchestrator.schedulerPage.formCron")}</Label>
                        <Input
                            value={form.cron}
                            onChange={(e) => setForm({ ...form, cron: e.target.value })}
                            className="bg-neutral-800 border-neutral-700 text-white font-mono"
                            placeholder={t("orchestrator.schedulerPage.formCronPlaceholder")}
                        />
                        <p className="text-[10px] text-neutral-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {t("orchestrator.schedulerPage.formCronHint")}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-neutral-300">{t("orchestrator.schedulerPage.formDescription")}</Label>
                    <Input
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="bg-neutral-800 border-neutral-700 text-white"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-neutral-300">{t("orchestrator.schedulerPage.formSkill")}</Label>
                    <Select value={form.skillId} onValueChange={(v) => setForm({ ...form, skillId: v })}>
                        <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                            <SelectValue placeholder={t("orchestrator.schedulerPage.formSkillPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-700">
                            {skills.map((skill) => (
                                <SelectItem key={skill.id} value={skill.id} className="text-white">
                                    {skill.name} ({skill.agent?.name})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="text-neutral-300">{t("orchestrator.schedulerPage.formInputData")}</Label>
                    <Textarea
                        value={form.inputData}
                        onChange={(e) => setForm({ ...form, inputData: e.target.value })}
                        className="bg-neutral-800 border-neutral-700 text-white font-mono text-xs"
                        rows={5}
                    />
                </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => { setCreateDialog(false); setEditDialog(false); }} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                {t("orchestrator.schedulerPage.btnCancel")}
              </Button>
              <Button 
                onClick={() => handleSave(editDialog)} 
                disabled={saving} 
                className="bg-purple-500 hover:bg-purple-600 text-white px-10"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Clock className="w-4 h-4 mr-2" />}
                {editDialog ? t("orchestrator.schedulerPage.btnSave") : t("orchestrator.schedulerPage.btnStart")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent className="bg-neutral-900 border-neutral-700">
            <DialogHeader>
              <DialogTitle className="text-white">{t("orchestrator.schedulerPage.dialogDeleteTitle")}</DialogTitle>
              <DialogDescription className="text-neutral-400">
                {t("orchestrator.schedulerPage.dialogDeleteDesc", { name: selectedTask?.name || "" })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog(false)} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                {t("orchestrator.schedulerPage.btnKeep")}
              </Button>
              <Button onClick={handleDelete} variant="destructive" className="bg-red-500 hover:bg-red-600">
                {t("orchestrator.schedulerPage.btnDelete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
