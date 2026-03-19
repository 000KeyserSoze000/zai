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
  version: string
  isActive: boolean
  icon: string
  color: string
  promptContent: string
  updatedAt: string
}

export default function EscCollectionPage() {
  const [skills, setSkills] = useState<EscSkill[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  
  // Dialog states
  const [viewSkill, setViewSkill] = useState<EscSkill | null>(null)
  const [installSkill, setInstallSkill] = useState<EscSkill | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useState<string>("")
  const [installing, setInstalling] = useState(false)

  const { toast } = useToast()
  const { t } = useTranslation()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [skillsRes, agentsRes] = await Promise.all([
        fetch("/api/admin/esc-skills"),
        fetch("/api/admin/orchestrator/agents")
      ])
      
      if (skillsRes.ok) setSkills(await skillsRes.json())
      if (agentsRes.ok) {
        const agentsData = await agentsRes.json()
        setAgents(agentsData.agents || agentsData)
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

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch("/api/admin/esc-skills/import", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        if (data.results.added === 0 && data.results.updated === 0) {
          toast({
            title: "Sync OK (0)",
            description: "Aucun changement détecté.",
          })
          if (data.logs) console.log("ESC Sync Logs:", data.logs)
        } else {
          toast({
            title: t("common.success"),
            description: `${data.results.added} ajoutés, ${data.results.updated} mis à jour.`,
          })
        }
        fetchData()
      } else {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Sync failed")
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "Échec de la synchronisation GitHub",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
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
        setSkills(skills.map(s => s.id === id ? { ...s, isActive: !currentStatus } : s))
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
  }, [])

  const filteredSkills = skills.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                         s.slug.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === "all" || s.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(skills.map(s => s.category)))

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">ESC Skills Collection</h2>
            <p className="text-neutral-400 text-sm">Gérez et activez les compétences IA haute performance</p>
          </div>
          
          <Button 
            onClick={handleSync} 
            disabled={syncing}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Synchroniser GitHub
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input 
              placeholder="Rechercher une skill..." 
              className="pl-10 bg-neutral-900/50 border-neutral-800"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-neutral-900/50 border-neutral-800">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
              <SelectItem value="all">Toutes</SelectItem>
              {categories.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSkills.map((skill) => (
              <Card key={skill.id} className="bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 transition-all overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500">
                      <Zap className="w-5 h-5" />
                    </div>
                    <Badge variant={skill.isActive ? "default" : "secondary"} className={skill.isActive ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-neutral-800 text-neutral-500"}>
                      {skill.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4 text-lg font-bold text-white">
                    {skill.name}
                    <span className="ml-2 text-[10px] text-neutral-600 font-mono">{skill.version}</span>
                  </CardTitle>
                  <CardDescription className="text-neutral-400 line-clamp-2 text-xs">
                    {skill.description || `Skill importée (${skill.slug})`}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-3 border-t border-neutral-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={skill.isActive} 
                      onCheckedChange={() => toggleActive(skill.id, skill.isActive)}
                    />
                    <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-tighter">
                      {skill.isActive ? "Activé" : "Désactivé"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-neutral-600 hover:text-white"
                      onClick={() => setViewSkill(skill)}
                      title="Voir le prompt"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-neutral-600 hover:text-orange-500"
                      onClick={() => {
                        setInstallSkill(skill)
                        setSelectedAgentId("")
                      }}
                      title="Installer / Utiliser"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-neutral-600 hover:text-red-400"
                      onClick={() => handleDelete(skill.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* View Content Dialog */}
        <Dialog open={!!viewSkill} onOpenChange={() => setViewSkill(null)}>
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
            <ScrollArea className="max-h-[500px] mt-4 rounded-md border border-neutral-800 bg-black/40 p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap text-neutral-300">
                {viewSkill?.promptContent}
              </pre>
            </ScrollArea>
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
      </div>
    </div>
  )
}
