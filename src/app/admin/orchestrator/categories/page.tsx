"use client"

import { useState, useEffect } from "react"
import { 
  FolderOpen, Plus, Search, RefreshCw, Loader2, ArrowLeft,
  Edit, Trash2, GripVertical, ToggleLeft, ToggleRight, Eye, EyeOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
import Link from "next/link"
import { useTranslation } from "@/lib/i18n"

interface Category {
  id: string
  name: string
  nameEn: string | null
  nameEs: string | null
  slug: string
  description: string | null
  descriptionEn: string | null
  descriptionEs: string | null
  icon: string
  color: string
  isActive: boolean
  accessLevel: string
  displayOrder: number
  createdAt: string
  _count: { agents: number }
}

const ICONS = [
  { value: "Bot", label: "🤖 Bot" },
  { value: "Brain", label: "🧠 Brain" },
  { value: "Sparkles", label: "✨ Sparkles" },
  { value: "Zap", label: "⚡ Zap" },
  { value: "Pen", label: "✏️ Pen" },
  { value: "Image", label: "🖼️ Image" },
  { value: "Code", label: "💻 Code" },
  { value: "TrendingUp", label: "📈 TrendingUp" },
  { value: "Mail", label: "📧 Mail" },
  { value: "Globe", label: "🌐 Globe" },
]

const COLORS = [
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "cyan", label: "Cyan", class: "bg-cyan-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
  { value: "yellow", label: "Yellow", class: "bg-yellow-500" },
  { value: "red", label: "Red", class: "bg-red-500" },
]

const ACCESS_LEVELS = [
  { value: "ALL", label: "Tous les plans" },
  { value: "BUSINESS_PLUS", label: "Business+" },
  { value: "AGENCY_PLUS", label: "Agency+" },
  { value: "ENTERPRISE_ONLY", label: "Enterprise uniquement" },
]

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CategoriesPage() {
  const { t } = useTranslation()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [createDialog, setCreateDialog] = useState(false)
  const [editDialog, setEditDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [createForm, setCreateForm] = useState({
    name: "", nameEn: "", nameEs: "",
    slug: "",
    description: "", descriptionEn: "", descriptionEs: "",
    icon: "Bot", color: "orange",
    accessLevel: "ALL", displayOrder: 0
  })
  const [editForm, setEditForm] = useState({
    name: "", nameEn: "", nameEs: "",
    slug: "",
    description: "", descriptionEn: "", descriptionEs: "",
    icon: "Bot", color: "orange",
    accessLevel: "ALL", displayOrder: 0
  })

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/orchestrator/categories?includeInactive=true")
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleCreate = async () => {
    if (!createForm.name || !createForm.slug) return
    setSaving(true)
    try {
      const response = await fetch("/api/admin/orchestrator/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm)
      })
      if (response.ok) {
        setCreateDialog(false)
        setCreateForm({
          name: "", nameEn: "", nameEs: "",
          slug: "",
          description: "", descriptionEn: "", descriptionEs: "",
          icon: "Bot", color: "orange",
          accessLevel: "ALL", displayOrder: 0
        })
        fetchCategories()
      } else {
        const data = await response.json()
        alert(data.error || "Erreur")
      }
    } catch (error) {
      console.error("Error creating category:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedCategory) return
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/orchestrator/categories/${selectedCategory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      })
      if (response.ok) {
        setEditDialog(false)
        fetchCategories()
      } else {
        const data = await response.json()
        alert(data.error || "Erreur")
      }
    } catch (error) {
      console.error("Error updating category:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedCategory) return
    try {
      const response = await fetch(`/api/admin/orchestrator/categories/${selectedCategory.id}`, {
        method: "DELETE"
      })
      if (response.ok) {
        setDeleteDialog(false)
        fetchCategories()
      } else {
        const data = await response.json()
        alert(data.error || "Erreur")
      }
    } catch (error) {
      console.error("Error deleting category:", error)
    }
  }

  const toggleActive = async (category: Category) => {
    try {
      await fetch(`/api/admin/orchestrator/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !category.isActive })
      })
      fetchCategories()
    } catch (error) {
      console.error("Error toggling category:", error)
    }
  }

  const openEdit = (category: Category) => {
    setSelectedCategory(category)
    setEditForm({
      name: category.name,
      nameEn: category.nameEn || "",
      nameEs: category.nameEs || "",
      slug: category.slug,
      description: category.description || "",
      descriptionEn: category.descriptionEn || "",
      descriptionEs: category.descriptionEs || "",
      icon: category.icon,
      color: category.color,
      accessLevel: category.accessLevel,
      displayOrder: category.displayOrder
    })
    setEditDialog(true)
  }

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  )

  const getColorClass = (color: string) => {
    return COLORS.find(c => c.value === color)?.class || "bg-orange-500"
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("common.back")}
            </Button>
          </Link>
          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <FolderOpen className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t("orchestrator.categoriesPage.title")}</h1>
            <p className="text-neutral-400">{categories.length} {t("orchestrator.categoriesPage.count")}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <div className="text-sm text-neutral-400">{t("orchestrator.categoriesPage.total")}</div>
            <div className="text-2xl font-bold text-white">{categories.length}</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <div className="text-sm text-neutral-400">{t("orchestrator.categoriesPage.active")}</div>
            <div className="text-2xl font-bold text-green-400">
              {categories.filter(c => c.isActive).length}
            </div>
          </div>
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <div className="text-sm text-neutral-400">{t("orchestrator.categoriesPage.inactive")}</div>
            <div className="text-2xl font-bold text-red-400">
              {categories.filter(c => !c.isActive).length}
            </div>
          </div>
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <div className="text-sm text-neutral-400">{t("orchestrator.categoriesPage.agents")}</div>
            <div className="text-2xl font-bold text-orange-400">
              {categories.reduce((sum, c) => sum + c._count.agents, 0)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              placeholder={t("orchestrator.categoriesPage.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-neutral-900 border-neutral-700 text-white"
            />
          </div>
          <Button onClick={() => setCreateDialog(true)} className="bg-purple-500 hover:bg-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            {t("orchestrator.categoriesPage.newCategory")}
          </Button>
          <Button onClick={fetchCategories} variant="outline" className="border-neutral-700 text-neutral-300">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("orchestrator.categoriesPage.refresh")}
          </Button>
        </div>

        {/* Table */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-700 hover:bg-neutral-800">
                  <TableHead className="text-neutral-400 w-12"></TableHead>
                  <TableHead className="text-neutral-400">{t("orchestrator.categoriesPage.tableCategory")}</TableHead>
                  <TableHead className="text-neutral-400">{t("orchestrator.categoriesPage.tableSlug")}</TableHead>
                  <TableHead className="text-neutral-400">{t("orchestrator.categoriesPage.tableAccess")}</TableHead>
                  <TableHead className="text-neutral-400">{t("orchestrator.categoriesPage.tableAgents")}</TableHead>
                  <TableHead className="text-neutral-400">{t("orchestrator.categoriesPage.tableStatus")}</TableHead>
                  <TableHead className="text-neutral-400 text-right">{t("orchestrator.categoriesPage.tableActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-neutral-500 py-8">
                      {t("orchestrator.categoriesPage.noCategory")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((category) => (
                    <TableRow key={category.id} className="border-neutral-800 hover:bg-neutral-800/50">
                      <TableCell>
                        <GripVertical className="w-4 h-4 text-neutral-500 cursor-move" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 ${getColorClass(category.color)} rounded-lg flex items-center justify-center text-white text-sm`}>
                            {ICONS.find(i => i.value === category.icon)?.label.split(" ")[0] || "🤖"}
                          </div>
                          <div>
                            <div className="text-white font-medium">{category.name}</div>
                            {category.description && (
                              <div className="text-neutral-500 text-xs truncate max-w-xs">
                                {category.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-neutral-300 text-sm bg-neutral-800 px-2 py-1 rounded">
                          {category.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-neutral-600 text-neutral-300">
                          {ACCESS_LEVELS.find(l => l.value === category.accessLevel)?.label || category.accessLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-neutral-300">
                        {category._count.agents}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleActive(category)}
                          className="flex items-center gap-2"
                        >
                          {category.isActive ? (
                            <>
                              <ToggleRight className="w-5 h-5 text-green-500" />
                              <span className="text-green-400 text-sm">{t("orchestrator.categoriesPage.statusActive")}</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-5 h-5 text-neutral-500" />
                              <span className="text-neutral-500 text-sm">{t("orchestrator.categoriesPage.statusInactive")}</span>
                            </>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(category)}
                            className="text-neutral-400 hover:text-white hover:bg-neutral-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setSelectedCategory(category); setDeleteDialog(true) }}
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

        {/* Create Dialog */}
        <Dialog open={createDialog} onOpenChange={setCreateDialog}>
          <DialogContent className="bg-neutral-900 border-neutral-700 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">{t("orchestrator.categoriesPage.dialogCreateTitle")}</DialogTitle>
              <DialogDescription className="text-neutral-400">
                {t("orchestrator.categoriesPage.dialogCreateDesc")}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="fr" className="w-full">
              <TabsList className="bg-black border border-neutral-800 w-full justify-start p-1 h-auto mb-4">
                <TabsTrigger value="fr" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">Français</TabsTrigger>
                <TabsTrigger value="en" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">English</TabsTrigger>
                <TabsTrigger value="es" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">Español</TabsTrigger>
              </TabsList>

              <TabsContent value="fr" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-neutral-300">Nom (Français)</Label>
                  <Input
                    value={createForm.name}
                    onChange={(e) => {
                      const name = e.target.value
                      setCreateForm({ ...createForm, name, slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })
                    }}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-300">Description (Français)</Label>
                  <Textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="bg-neutral-800 border-neutral-700 text-white"
                    rows={2}
                  />
                </div>
              </TabsContent>

              <TabsContent value="en" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-neutral-300">Name (English)</Label>
                  <Input
                    value={createForm.nameEn}
                    onChange={(e) => setCreateForm({ ...createForm, nameEn: e.target.value })}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-300">Description (English)</Label>
                  <Textarea
                    value={createForm.descriptionEn}
                    onChange={(e) => setCreateForm({ ...createForm, descriptionEn: e.target.value })}
                    className="bg-neutral-800 border-neutral-700 text-white"
                    rows={2}
                  />
                </div>
              </TabsContent>

              <TabsContent value="es" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-neutral-300">Nombre (Español)</Label>
                  <Input
                    value={createForm.nameEs}
                    onChange={(e) => setCreateForm({ ...createForm, nameEs: e.target.value })}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-300">Descripción (Español)</Label>
                  <Textarea
                    value={createForm.descriptionEs}
                    onChange={(e) => setCreateForm({ ...createForm, descriptionEs: e.target.value })}
                    className="bg-neutral-800 border-neutral-700 text-white"
                    rows={2}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-4 pt-4 border-t border-neutral-800 mt-4">
              <div className="space-y-2">
                <Label className="text-neutral-300">{t("orchestrator.categoriesPage.formSlug")}</Label>
                <Input
                  value={createForm.slug}
                  onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
                  className="bg-neutral-800 border-neutral-700 text-white font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-neutral-300">{t("orchestrator.categoriesPage.formIcon")}</Label>
                  <Select value={createForm.icon} onValueChange={(v) => setCreateForm({ ...createForm, icon: v })}>
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      {ICONS.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value} className="text-white">
                          {icon.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-300">{t("orchestrator.categoriesPage.formColor")}</Label>
                  <Select value={createForm.color} onValueChange={(v) => setCreateForm({ ...createForm, color: v })}>
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      {COLORS.map((color) => (
                        <SelectItem key={color.value} value={color.value} className="text-white">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 ${color.class} rounded`} />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">{t("orchestrator.categoriesPage.formAccess")}</Label>
                <Select value={createForm.accessLevel} onValueChange={(v) => setCreateForm({ ...createForm, accessLevel: v })}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {ACCESS_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value} className="text-white">
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-6 pt-6 border-t border-neutral-800">
              <Button variant="outline" onClick={() => setCreateDialog(false)} className="border-neutral-700 text-neutral-300">
                {t("orchestrator.categoriesPage.btnCancel")}
              </Button>
              <Button onClick={handleCreate} disabled={saving} className="bg-purple-500 hover:bg-purple-600 text-white">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {t("orchestrator.categoriesPage.btnCreate")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="bg-neutral-900 border-neutral-700 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">{t("orchestrator.categoriesPage.dialogEditTitle")}</DialogTitle>
              <DialogDescription className="text-neutral-400">
                {selectedCategory?.name}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="fr" className="w-full">
              <TabsList className="bg-black border border-neutral-800 w-full justify-start p-1 h-auto mb-4">
                <TabsTrigger value="fr" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">Français</TabsTrigger>
                <TabsTrigger value="en" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">English</TabsTrigger>
                <TabsTrigger value="es" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">Español</TabsTrigger>
              </TabsList>

              <TabsContent value="fr" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-neutral-300">Nom (Français)</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-300">Description (Français)</Label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="bg-neutral-800 border-neutral-700 text-white"
                    rows={2}
                  />
                </div>
              </TabsContent>

              <TabsContent value="en" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-neutral-300">Name (English)</Label>
                  <Input
                    value={editForm.nameEn}
                    onChange={(e) => setEditForm({ ...editForm, nameEn: e.target.value })}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-300">Description (English)</Label>
                  <Textarea
                    value={editForm.descriptionEn}
                    onChange={(e) => setEditForm({ ...editForm, descriptionEn: e.target.value })}
                    className="bg-neutral-800 border-neutral-700 text-white"
                    rows={2}
                  />
                </div>
              </TabsContent>

              <TabsContent value="es" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-neutral-300">Nombre (Español)</Label>
                  <Input
                    value={editForm.nameEs}
                    onChange={(e) => setEditForm({ ...editForm, nameEs: e.target.value })}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-300">Descripción (Español)</Label>
                  <Textarea
                    value={editForm.descriptionEs}
                    onChange={(e) => setEditForm({ ...editForm, descriptionEs: e.target.value })}
                    className="bg-neutral-800 border-neutral-700 text-white"
                    rows={2}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-4 pt-4 border-t border-neutral-800 mt-4">
              <div className="space-y-2">
                <Label className="text-neutral-300">{t("orchestrator.categoriesPage.formSlug")}</Label>
                <Input
                  value={editForm.slug}
                  onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                  className="bg-neutral-800 border-neutral-700 text-white font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-neutral-300">{t("orchestrator.categoriesPage.formIcon")}</Label>
                  <Select value={editForm.icon} onValueChange={(v) => setEditForm({ ...editForm, icon: v })}>
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      {ICONS.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value} className="text-white">
                          {icon.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-300">{t("orchestrator.categoriesPage.formColor")}</Label>
                  <Select value={editForm.color} onValueChange={(v) => setEditForm({ ...editForm, color: v })}>
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      {COLORS.map((color) => (
                        <SelectItem key={color.value} value={color.value} className="text-white">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 ${color.class} rounded`} />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">{t("orchestrator.categoriesPage.formAccess")}</Label>
                <Select value={editForm.accessLevel} onValueChange={(v) => setEditForm({ ...editForm, accessLevel: v })}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {ACCESS_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value} className="text-white">
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">{t("orchestrator.categoriesPage.formOrder")}</Label>
                <Input
                  type="number"
                  value={editForm.displayOrder}
                  onChange={(e) => setEditForm({ ...editForm, displayOrder: parseInt(e.target.value) || 0 })}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
            </div>
            <DialogFooter className="mt-6 pt-6 border-t border-neutral-800">
              <Button variant="outline" onClick={() => setEditDialog(false)} className="border-neutral-700 text-neutral-300">
                {t("orchestrator.categoriesPage.btnCancel")}
              </Button>
              <Button onClick={handleEdit} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("orchestrator.categoriesPage.btnSave")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent className="bg-neutral-900 border-neutral-700">
            <DialogHeader>
              <DialogTitle className="text-white">{t("orchestrator.categoriesPage.dialogDeleteTitle")}</DialogTitle>
              <DialogDescription className="text-neutral-400">
                {t("orchestrator.categoriesPage.dialogDeleteDesc", { name: selectedCategory?.name || "" })}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-sm text-red-400">
              {selectedCategory?._count?.agents ? (
                <p>{t("orchestrator.categoriesPage.deleteWarningAgents", { count: selectedCategory._count.agents || 0 })}</p>
              ) : (
                <p>{t("orchestrator.categoriesPage.deleteWarningIrreversible")}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog(false)} className="border-neutral-700 text-neutral-300">
                {t("orchestrator.categoriesPage.btnCancel")}
              </Button>
              <Button
                onClick={handleDelete}
                disabled={(selectedCategory?._count?.agents || 0) > 0}
                variant="destructive"
                className="bg-red-500 hover:bg-red-600"
              >
                {t("orchestrator.categoriesPage.btnDelete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
