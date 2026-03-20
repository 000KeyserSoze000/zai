"use client"

import { useState, useEffect } from "react"
import {
  Zap,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Loader2,
  Box,
  Eye,
  PlusCircle,
  Copy
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTranslation } from "@/lib/i18n"
import { Switch } from "@/components/ui/switch"

interface EscSkill {
  id: string
  name: string
  slug: string
  description: string | null
  category: string
  source: string
  providerUrl: string | null
  version: string
  isActive: boolean
  icon: string
  color: string
  promptContent: string
  files: any | null
  tags: string | null
  updatedAt: string
}

export default function EscCollectionPage() {
  const [skills, setSkills] = useState<EscSkill[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  
  // Dialog states
  const [viewSkill, setViewSkill] = useState<EscSkill | null>(null)
  const [selectedFile, setSelectedFile] = useState<string>("SKILL.md")
  const [installSkill, setInstallSkill] = useState<EscSkill | null>(null)
  const [importUrl, setImportUrl] = useState("")
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState<string>("")
  const [installing, setInstalling] = useState(false)
  const [importing, setImporting] = useState(false)
  
  // Selection & Pagination
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(25) // High density
  
  // Category Manager
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<{oldName: string, newName: string} | null>(null)
  const [newCategoryName, setNewCategoryName] = useState("")

  // Provider Manager
  const [providers, setProviders] = useState<any[]>([])
  const [showProviderDialog, setShowProviderDialog] = useState(false)
  const [editingProvider, setEditingProvider] = useState<any>(null)
  const [newProvider, setNewProvider] = useState({ name: "", url: "" })
  const [providerFilter, setProviderFilter] = useState("all")
  const [savingProvider, setSavingProvider] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [syncingProviderId, setSyncingProviderId] = useState<string | null>(null)

  const { toast } = useToast()
  const { t } = useTranslation()

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== "all") params.append("category", categoryFilter)
      if (providerFilter !== "all") params.append("providerUrl", providerFilter)
      
      const [skillsRes, agentsRes] = await Promise.all([
        fetch(`/api/admin/esc-skills?${params.toString()}`),
        fetch("/api/admin/orchestrator/agents")
      ])
      
      if (skillsRes.ok) {
        const data = await skillsRes.json()
        if (Array.isArray(data)) setSkills(data)
      }
      if (agentsRes.ok) {
        const agentsData = await agentsRes.json()
        const agentList = agentsData.agents || agentsData
        if (Array.isArray(agentList)) setAgents(agentList)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast({
        title: t("common.error"),
        description: "Chargement échoué.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchProviders = async () => {
    try {
      const res = await fetch("/api/admin/esc-skills/providers")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setProviders(data)
      }
    } catch (err) { console.error(err) }
  }
  const handleSync = async (providerId?: string) => {
    if (providerId) setSyncingProviderId(providerId)
    else setSyncing(true)

    try {
      const res = await fetch("/api/admin/esc-skills/import", { 
        method: "POST",
        body: JSON.stringify({ providerId }) 
      })
      if (res.ok) {
        const data = await res.json()
        toast({
          title: "Synchronisation terminée",
          description: data?.results ? `${data.results.added} nouvelles, ${data.results.updated} mises à jour.` : "Effectué.",
        })
        fetchData()
      }
    } catch (error) {
      toast({ title: t("common.error"), variant: "destructive" })
    } finally {
      setSyncing(false)
      setSyncingProviderId(null)
    }
  }

  const handleSaveProvider = async () => {
    if (!newProvider.name || !newProvider.url) return
    setSavingProvider(true)
    try {
      const res = await fetch("/api/admin/esc-skills/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProvider ? { ...newProvider, id: editingProvider.id } : newProvider),
      })
      if (res.ok) {
        toast({ title: "Enregistré", description: "Fournisseur mis à jour." })
        setNewProvider({ name: "", url: "" })
        setEditingProvider(null)
        fetchProviders()
      } else {
        const err = await res.json()
        toast({ title: "Erreur", description: err.error, variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Erreur", variant: "destructive" })
    } finally {
      setSavingProvider(false)
    }
  }

  const handleDeleteProvider = async (id: string, url?: string, action: "REMOVE" | "DELETE_ALL" = "REMOVE") => {
    if (action === "DELETE_ALL") {
      if (!confirm(`ATTENTION: Cela va supprimer TOUTES les skills provenant de ${url}. Continuer ?`)) return
      setBulkDeleting(true)
      try {
        const res = await fetch("/api/admin/esc-skills/bulk", {
          method: "POST",
          body: JSON.stringify({ action: "DELETE_BY_PROVIDER", providerUrl: url })
        })
        if (res.ok) {
          toast({ title: "Nettoyage réussi", description: "Toutes les skills du fournisseur ont été supprimées." })
          fetchData()
        }
      } catch (err) { toast({ title: "Erreur", variant: "destructive" }) }
      finally { setBulkDeleting(false) }
      return
    }

    if (!confirm("Retirer ce fournisseur ?")) return
    try {
      const res = await fetch(`/api/admin/esc-skills/providers?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Supprimé" })
        fetchProviders()
      }
    } catch (err) { toast({ title: "Erreur", variant: "destructive" }) }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Supprimer ces ${selectedIds.length} skills ?`)) return
    try {
      const res = await fetch("/api/admin/esc-skills/bulk", {
        method: "POST",
        body: JSON.stringify({ ids: selectedIds, action: "DELETE" })
      })
      if (res.ok) {
        toast({ title: "Supprimé", description: `${selectedIds.length} skills retirées.` })
        setSelectedIds([])
        fetchData()
      }
    } catch (error) {
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  const handleBulkMove = async (newCategory: string) => {
    if (!selectedIds.length && newCategory !== "new_category") {
       toast({ title: "Sélection requise", description: "Veuillez sélectionner des skills à déplacer.", variant: "destructive" })
       return
    }

    if (newCategory === "new_category") {
      if (!selectedIds.length) {
        toast({ title: "Action impossible", description: "Veuillez d'abord cocher des skills pour créer une nouvelle catégorie et les y déplacer.", variant: "destructive" })
        return
      }
      const name = prompt("Nom de la nouvelle catégorie :")
      if (!name) return
      newCategory = name
    }
    
    try {
      const res = await fetch("/api/admin/esc-skills/bulk", {
        method: "POST",
        body: JSON.stringify({ ids: selectedIds, action: "MOVE", targetCategory: newCategory })
      })
      if (res.ok) {
        toast({ title: "Déplacé", description: `${selectedIds.length} skills déplacées vers ${newCategory}` })
        setSelectedIds([])
        fetchData()
      }
    } catch (error) {
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  const handleCategoryAction = async (action: "RENAME" | "DELETE" | "DELETE_ALL") => {
    if (!editingCategory) return
    let confirmMsg = ""
    if (action === "DELETE") confirmMsg = `Supprimer TOUTES les skills de la catégorie ${editingCategory.oldName} ?`
    else if (action === "DELETE_ALL") confirmMsg = `Voulez-vous vraiment supprimer DÉFINITIVEMENT toutes les skills de la catégorie ${editingCategory.oldName} ? Cette action est irréversible.`
    else confirmMsg = `Renommer ${editingCategory.oldName} en ${editingCategory.newName} ?`
    
    if (!confirm(confirmMsg)) return

    try {
      if (action === "DELETE_ALL") {
        setBulkDeleting(true)
        const res = await fetch("/api/admin/esc-skills/bulk", {
          method: "POST",
          body: JSON.stringify({ action: "DELETE_BY_CATEGORY", category: editingCategory.oldName })
        })
        if (res.ok) {
          toast({ title: "Supprimé", description: "Toute la catégorie a été vidée." })
          setShowCategoryDialog(false)
          fetchData()
        }
      } else {
        const res = await fetch("/api/admin/esc-skills/categories", {
          method: "POST",
          body: JSON.stringify({ action, oldName: editingCategory.oldName, newName: editingCategory.newName })
        })
        if (res.ok) {
          toast({ title: "Fait", description: "Catégorie mise à jour." })
          setShowCategoryDialog(false)
          setEditingCategory(null)
          fetchData()
        }
      }
    } catch (error) {
      toast({ title: t("common.error"), variant: "destructive" })
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleImportByUrl = async () => {
    if (!importUrl) return
    setImporting(true)
    try {
      const res = await fetch("/api/admin/esc-skills/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      })
      
      if (res.ok) {
        toast({ title: "Import réussi", description: "La skill a été ajoutée à la bibliothèque." })
        setImportUrl("")
        setShowImportDialog(false)
        fetchData()
      } else {
        const err = await res.json()
        throw new Error(err.error || "Import failed")
      }
    } catch (error: any) {
      toast({ title: "Erreur d'import", description: error.message, variant: "destructive" })
    } finally {
      setImporting(false)
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/esc-skills/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      if (res.ok) {
        setSkills(prev => Array.isArray(prev) ? prev.map(s => s.id === id ? { ...s, isActive: !currentStatus } : s) : [])
        toast({
          title: !currentStatus ? "Skill activée" : "Skill désactivée",
        })
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "Échec de la mise à jour",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette skill ?")) return
    try {
      const res = await fetch(`/api/admin/esc-skills/${id}`, { method: "DELETE" })
      if (res.ok) {
        setSkills(skills.filter(s => s.id !== id))
        toast({ title: t("common.delete"), description: "Skill retirée." })
      }
    } catch (error) {
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  const handleInstall = async () => {
    if (!installSkill || !selectedAgentId) return
    setInstalling(true)
    try {
      const res = await fetch(`/api/admin/esc-skills/${installSkill.id}/install`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: selectedAgentId }),
      })
      if (res.ok) {
        toast({ title: "Installé", description: "La skill est prête dans l'Orchestrateur." })
        setInstallSkill(null)
        fetchData()
      }
    } catch (error) {
      toast({ title: t("common.error"), variant: "destructive" })
    } finally {
      setInstalling(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [categoryFilter, providerFilter])

  useEffect(() => {
    fetchProviders()
  }, [])

  const filteredSkills = skills.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                         s.slug.toLowerCase().includes(search.toLowerCase()) ||
                         (s.description || "").toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === "all" || s.category === categoryFilter
    const matchesSource = sourceFilter === "all" || s.source === sourceFilter
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" ? s.isActive : !s.isActive)
    return matchesSearch && matchesCategory && matchesSource && matchesStatus
  })

  // Pagination Logic
  const totalPages = Math.ceil(filteredSkills.length / itemsPerPage)
  const paginatedSkills = filteredSkills.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedSkills.length && paginatedSkills.length > 0) setSelectedIds([])
    else setSelectedIds(paginatedSkills.map(s => s.id))
  }

  const categories = Array.isArray(skills) ? Array.from(new Set(skills.map(s => s.category).filter(Boolean))).sort() : []
  const sources = Array.isArray(skills) ? Array.from(new Set(skills.map(s => s.source).filter(Boolean))).sort() : []

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Collection de skills</h2>
            <p className="text-neutral-400 text-sm">Gérez et activez les compétences IA haute performance</p>
          </div>
          
            <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowProviderDialog(true)}
              variant="outline"
              className="border-neutral-800 text-neutral-400 hover:text-white"
            >
              <Box className="w-4 h-4 mr-2" />
              Gérer Fournisseurs
            </Button>
            <Button 
              onClick={() => setShowCategoryDialog(true)}
              variant="outline"
              className="border-neutral-800 text-neutral-400 hover:text-white"
            >
              <Filter className="w-4 h-4 mr-2" />
              Gérer Catégories
            </Button>
            <Button 
              onClick={() => handleSync()} 
              disabled={syncing}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Synchroniser
            </Button>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input 
              placeholder="Rechercher par nom, slug ou description..." 
              className="pl-10 bg-neutral-900/50 border-neutral-800"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] bg-neutral-900/50 border-neutral-800">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                <SelectItem value="all">Toutes Catégories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[140px] bg-neutral-900/50 border-neutral-800">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                <SelectItem value="all">Toutes Sources</SelectItem>
                {sources.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-[160px] bg-neutral-900/50 border-neutral-800 text-orange-400">
                <SelectValue placeholder="Filtrer par Fournisseur" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                <SelectItem value="all">Tous Fournisseurs</SelectItem>
                {providers.map(p => (
                  <SelectItem key={p.id} value={p.url}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-neutral-900/50 border-neutral-800">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                <SelectItem value="all">Tous Statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              className="border-neutral-800 text-white hover:bg-neutral-800"
              onClick={() => setShowImportDialog(true)}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Importer par URL
            </Button>
          </div>
        </div>

        {/* Selection Toolbar */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-neutral-900 border border-orange-500/50 rounded-full px-6 py-3 shadow-2xl z-50 flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-sm font-bold text-white px-2">
              {selectedIds.length} sélectionné(s)
            </div>
            <div className="h-4 w-[1px] bg-neutral-800" />
            
            <Select onValueChange={handleBulkMove}>
              <SelectTrigger className="w-[160px] h-8 bg-neutral-950 border-neutral-800 text-xs">
                <SelectValue placeholder="Déplacer vers..." />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                <div className="p-2 border-b border-neutral-800 mb-1">
                   {categories.map(c => <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>)}
                </div>
                <SelectItem value="new_category" className="text-orange-400 font-bold">+ Nouvelle catégorie</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              size="sm" 
              variant="destructive" 
              onClick={handleBulkDelete}
              className="h-8 rounded-full"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Supprimer
            </Button>
            
            <Button size="sm" variant="ghost" className="h-8 text-neutral-400" onClick={() => setSelectedIds([])}>
              Annuler
            </Button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="text-center py-20 bg-neutral-900/20 rounded-2xl border border-dashed border-neutral-800">
            <Box className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
            <p className="text-neutral-500">Aucune skill trouvée.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                   <Switch checked={selectedIds.length === paginatedSkills.length && paginatedSkills.length > 0} onCheckedChange={toggleSelectAll} />
                   <span className="text-[10px] text-neutral-500 uppercase font-bold">Tout sélectionner (cette page)</span>
                </div>
                <div className="text-[10px] text-neutral-600 font-mono">
                   {filteredSkills.length} SKILLS — PAGE {currentPage}/{totalPages}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {paginatedSkills.map((skill) => (
                <Card 
                  key={skill.id} 
                  onClick={() => toggleSelect(skill.id)}
                  className={`bg-neutral-900/40 border-neutral-800 hover:border-orange-500/30 transition-all cursor-pointer relative group ${
                    selectedIds.includes(skill.id) ? "border-orange-500 bg-orange-500/5 shadow-[0_0_15px_rgba(249,115,22,0.1)]" : ""
                  }`}
                >
                  {/* Selection Indicator */}
                  <div className={`absolute top-2 left-2 w-4 h-4 rounded border flex items-center justify-center transition-all z-10 ${
                    selectedIds.includes(skill.id) ? "bg-orange-500 border-orange-500" : "bg-black/50 border-neutral-700 opacity-0 group-hover:opacity-100"
                  }`}>
                    {selectedIds.includes(skill.id) && <Zap className="w-2.5 h-2.5 text-white fill-current" />}
                  </div>

                  <CardHeader className="p-3 pb-2 space-y-1">
                    <div className="flex items-start justify-between">
                      <div className={`p-1.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20`}>
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={skill.isActive ? "default" : "secondary"} className={skill.isActive ? "bg-green-500/20 text-green-400 border-green-500/10 text-[8px] h-4" : "bg-neutral-800 text-neutral-500 text-[8px] h-4"}>
                          {skill.isActive ? "Actif" : "Brouillon"}
                        </Badge>
                        {(skill as any).isInstalled && (
                          <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/10 text-[8px] h-4">
                            Installé: {(skill as any).installedAgentName || "Oui"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-sm font-bold text-white truncate group-hover:text-orange-400 transition-colors pt-1">
                      {skill.name}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                       <Badge variant="outline" className="text-[8px] px-1 py-0 border-neutral-800 bg-neutral-950 text-neutral-500 uppercase flex-shrink-0">
                          {skill.category}
                       </Badge>
                       <span className="text-[9px] text-neutral-600 truncate">{skill.slug}</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-3 pt-0">
                     <p className="text-neutral-500 text-[10px] line-clamp-2 h-7 group-hover:text-neutral-400 transition-colors">
                        {skill.description || `Skill importée (${skill.slug})`}
                     </p>
                  </CardContent>

                  <CardFooter className="p-2 pt-0 flex items-center justify-end gap-1 border-t border-neutral-800/10 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-neutral-500 hover:text-white"
                      onClick={(e) => { e.stopPropagation(); setViewSkill(skill); }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-neutral-500 hover:text-orange-500"
                      onClick={(e) => { e.stopPropagation(); setInstallSkill(skill); }}
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-neutral-500 hover:text-red-400"
                      onClick={(e) => { e.stopPropagation(); handleDelete(skill.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-8">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:text-white"
                >
                  Précédent
                </Button>
                <div className="flex items-center gap-1 mx-4">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                         setCurrentPage(i + 1);
                         window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${
                        currentPage === i + 1 ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "text-neutral-500 hover:bg-neutral-800"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:text-white"
                >
                  Suivant
                </Button>
              </div>
            )}
          </div>
        )}

        {/* View Content Dialog */}
        <Dialog open={!!viewSkill} onOpenChange={(open) => {
          if (!open) setViewSkill(null)
          setSelectedFile("SKILL.md")
        }}>
          <DialogContent className="max-w-3xl bg-neutral-900 border-neutral-800 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Box className="w-5 h-5 text-orange-500" />
                {viewSkill?.name}
              </DialogTitle>
              <DialogDescription className="text-neutral-400">
                Aperçu du template de prompt (SKILL.md)
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col md:flex-row gap-4 mt-4 h-[500px]">
              {/* File List */}
              {viewSkill?.files && Object.keys(viewSkill.files).length > 0 && (
                <div className="w-full md:w-64 border border-neutral-800 rounded-md bg-black/20 p-2 overflow-y-auto">
                  <div className="text-[10px] uppercase font-bold text-neutral-500 mb-2 px-2">Fichiers</div>
                  {Object.keys(viewSkill.files).map(fileName => (
                    <button
                      key={fileName}
                      onClick={() => setSelectedFile(fileName)}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded transition-colors mb-1 ${
                        selectedFile === fileName ? "bg-orange-600 text-white" : "text-neutral-400 hover:bg-neutral-800"
                      }`}
                    >
                      {fileName}
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedFile("PROMPT_RAW")}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded transition-colors ${
                      selectedFile === "PROMPT_RAW" ? "bg-orange-600 text-white" : "text-neutral-400 hover:bg-neutral-800"
                    }`}
                  >
                    Prompt Brut (DB)
                  </button>
                </div>
              )}

              {/* Content Panel */}
              <ScrollArea className="flex-1 rounded-md border border-neutral-800 bg-black/40 p-4">
                <pre className="text-xs font-mono whitespace-pre-wrap text-neutral-300">
                  {selectedFile === "PROMPT_RAW" 
                    ? viewSkill?.promptContent 
                    : (viewSkill?.files as any)?.[selectedFile] || viewSkill?.promptContent
                  }
                </pre>
              </ScrollArea>
            </div>
            <DialogFooter className="mt-6">
              <Button 
                variant="outline" 
                onClick={() => setViewSkill(null)}
                className="border-neutral-800 text-white hover:bg-neutral-800"
              >
                Fermer
              </Button>
              <Button 
                className="bg-orange-600 hover:bg-orange-700"
                onClick={() => {
                  setInstallSkill(viewSkill)
                  setViewSkill(null)
                }}
              >
                Installer cette skill
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Install Dialog */}
        <Dialog open={!!installSkill} onOpenChange={() => setInstallSkill(null)}>
          <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
            <DialogHeader>
              <DialogTitle>Installer dans l'Orchestrateur</DialogTitle>
              <DialogDescription className="text-neutral-400">
                Choisissez l'agent qui sera responsable de cette compétence.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              {(installSkill as any)?.isInstalled && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-xs text-orange-400 font-medium">
                  ⚠️ Cette skill est déjà installée sur l'agent : {(installSkill as any).installedAgentName}.
                  Vous pouvez la réinstaller sur un autre agent si besoin.
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-400">Agent responsable</label>
                <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                  <SelectTrigger className="bg-neutral-950 border-neutral-800">
                    <SelectValue placeholder="Sélectionner un agent" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                    {agents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} ({agent.category?.name || "Sans catégorie"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setInstallSkill(null)}>Annuler</Button>
              <Button 
                disabled={!selectedAgentId || installing} 
                onClick={handleInstall}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {installing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                Confirmer l'installation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Import URL Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
            <DialogHeader>
              <DialogTitle>Importer via URL</DialogTitle>
              <DialogDescription className="text-neutral-400">
                Collez une URL Smithery Skill ou un lien GitHub Raw (.md) pour l'ajouter à votre bibliothèque.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <Input 
                placeholder="https://smithery.ai/skills/..." 
                className="bg-neutral-950 border-neutral-800"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
              />
              <p className="text-[10px] text-neutral-500 italic">
                Supporte : Smithery.ai (Direct), GitHub Raw (Fichier Markdown), GitHub Tree.
              </p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowImportDialog(false)}>Annuler</Button>
              <Button 
                disabled={!importUrl || importing} 
                onClick={handleImportByUrl}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Importer maintenant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Provider Management Dialog */}
        <Dialog open={showProviderDialog} onOpenChange={setShowProviderDialog}>
          <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Box className="w-5 h-5 text-orange-500" />
                Gérer les Fournisseurs de Skills
              </DialogTitle>
              <DialogDescription className="text-neutral-400">
                Ajoutez des dépôts GitHub ou des URLs pour synchroniser automatiquement vos bibliothèques.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Form */}
              <div className="space-y-4 border-r border-neutral-800 pr-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-neutral-500">Nom du Fournisseur</label>
                  <Input 
                    placeholder="Ex: Skills Officiels" 
                    className="bg-neutral-950 border-neutral-800"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider({...newProvider, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-neutral-500">URL GitHub (Repo ou Folder)</label>
                  <Input 
                    placeholder="https://github.com/..." 
                    className="bg-neutral-950 border-neutral-800"
                    value={newProvider.url}
                    onChange={(e) => setNewProvider({...newProvider, url: e.target.value})}
                  />
                </div>
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={savingProvider || !newProvider.name || !newProvider.url}
                  onClick={handleSaveProvider}
                >
                  {savingProvider ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                  {editingProvider ? "Mettre à jour" : "Ajouter le Fournisseur"}
                </Button>
                {editingProvider && (
                  <Button variant="ghost" className="w-full text-neutral-500" onClick={() => { setEditingProvider(null); setNewProvider({name:"", url:""}); }}>
                    Annuler l'édition
                  </Button>
                )}
              </div>

              {/* List */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                <div className="text-[10px] uppercase font-bold text-neutral-500 mb-2">Fournisseurs Actifs</div>
                {(!Array.isArray(providers) || providers.length === 0) ? (
                  <p className="text-[10px] text-neutral-600 italic">Aucun fournisseur personnalisé. Le système utilise les skills officiels par défaut.</p>
                ) : (
                  providers.map(p => (
                    <div key={p.id} className="p-3 rounded-lg bg-neutral-950/50 border border-neutral-800 flex items-center justify-between group">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{p.name}</div>
                        <div className="text-[9px] text-neutral-500 truncate">{p.url}</div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-orange-500 hover:bg-orange-500/10" 
                          onClick={() => handleSync(p.id)}
                          disabled={!!syncingProviderId || syncing}
                          title="Synchroniser ce fournisseur"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${syncingProviderId === p.id ? "animate-spin" : ""}`} />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-neutral-500 hover:text-white" title="Modifier" onClick={() => { setEditingProvider(p); setNewProvider({name: p.name, url: p.url}); }}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-neutral-500 hover:text-red-500" onClick={() => handleDeleteProvider(p.id, p.url, "DELETE_ALL")}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-neutral-500 hover:text-red-400" onClick={() => handleDeleteProvider(p.id)}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowProviderDialog(false)} className="border-neutral-800">Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Category Management Dialog */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Gérer les Catégories</DialogTitle>
              <DialogDescription className="text-neutral-400">
                Modifiez, renommez ou créez de nouvelles catégories.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[400px] overflow-y-auto pr-2">
              <div className="flex items-center gap-2 mb-4 p-2 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                <Input 
                  placeholder="Nouvelle catégorie..." 
                  className="bg-neutral-950 border-neutral-800 h-8 text-xs"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBulkMove(newCategoryName)}
                />
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700 h-8" onClick={() => handleBulkMove(newCategoryName)}>
                  <PlusCircle className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="text-[10px] uppercase font-bold text-neutral-500 mb-2">Catégories Existantes</div>
              {categories.map(cat => (
                <div key={cat} className="flex items-center gap-2 p-2 rounded-lg bg-neutral-950/50 border border-neutral-800 group">
                   <div className="flex-1">
                      {editingCategory?.oldName === cat ? (
                         <Input 
                            value={editingCategory.newName} 
                            onChange={(e) => setEditingCategory({...editingCategory, newName: e.target.value})}
                            onKeyDown={(e) => e.key === 'Enter' && handleCategoryAction("RENAME")}
                            className="h-8 text-xs bg-neutral-900"
                            autoFocus
                         />
                      ) : (
                        <span className="text-xs font-bold text-neutral-300">{cat}</span>
                      )}
                   </div>
                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingCategory?.oldName === cat ? (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-500" onClick={() => handleCategoryAction("RENAME")}>
                           <Zap className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-neutral-500 hover:text-white" onClick={() => setEditingCategory({oldName: cat, newName: cat})}>
                           <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-neutral-500 hover:text-red-500" title="Vider la catégorie" onClick={() => { setEditingCategory({oldName: cat, newName: ""}); handleCategoryAction("DELETE_ALL"); }}>
                         <Zap className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-neutral-500 hover:text-red-500" onClick={() => { setEditingCategory({oldName: cat, newName: ""}); handleCategoryAction("DELETE"); }}>
                         <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                   </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => { setShowCategoryDialog(false); setEditingCategory(null); }}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
