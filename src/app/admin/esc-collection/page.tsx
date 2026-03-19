"use client"

import { useState, useEffect } from "react"
import {
  Zap,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Settings2,
  Trash2,
  Download,
  ExternalLink,
  ChevronRight,
  Loader2,
  Box,
  LayoutGrid,
  Menu
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  updatedAt: string
}

export default function EscCollectionPage() {
  const [skills, setSkills] = useState<EscSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const { toast } = useToast()

  const fetchSkills = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/esc-skills")
      if (res.ok) {
        const data = await res.json()
        setSkills(data)
      }
    } catch (error) {
      console.error("Failed to fetch skills:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger la collection de skills",
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
            title: "Synchronisation terminée (0 skills)",
            description: "Le manifeste a été lu mais aucun nouveau skill n'a été trouvé ou mis à jour.",
          })
          if (data.logs) console.log("ESC Sync Logs:", data.logs)
        } else {
          toast({
            title: "Synchronisation réussie",
            description: `${data.results.added} nouvelles skills, ${data.results.updated} mises à jour.`,
          })
        }
        fetchSkills()
      } else {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Sync failed")
      }
    } catch (error) {
      toast({
        title: "Erreur de sync",
        description: "Impossible de synchroniser avec GitHub",
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
          description: "Le statut a été mis à jour avec succès.",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette skill de la collection ?")) return
    try {
      const res = await fetch(`/api/admin/esc-skills/${id}`, { method: "DELETE" })
      if (res.ok) {
        setSkills(skills.filter(s => s.id !== id))
        toast({ title: "Supprimé", description: "La skill a été retirée." })
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Échec de la suppression", variant: "destructive" })
    }
  }

  useEffect(() => {
    fetchSkills()
  }, [])

  const filteredSkills = skills.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                         s.slug.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === "all" || s.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(skills.map(s => s.category)))

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/30">
              <Box className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Collection ESC Skills</h1>
              <p className="text-neutral-400">Gérez et activez les compétences IA pour vos utilisateurs</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleSync} 
              disabled={syncing}
              className="bg-orange-600 hover:bg-orange-700 text-white border-none"
            >
              {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Synchroniser GitHub
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input 
              placeholder="Rechercher une skill (nom, slug...)" 
              className="pl-10 bg-neutral-900 border-neutral-800 focus:border-orange-500/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-48 bg-neutral-900 border-neutral-800">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
              <SelectItem value="all">Toutes les catégories</SelectItem>
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
            <p className="text-neutral-500">Chargement de la collection...</p>
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="text-center py-20 bg-neutral-900/30 rounded-2xl border border-dashed border-neutral-800">
            <Box className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-300">Aucune skill trouvée</h3>
            <p className="text-neutral-500 mb-6">Importez la collection depuis GitHub pour commencer.</p>
            <Button onClick={handleSync} variant="outline" className="border-neutral-700">
              Importer maintenant
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSkills.map((skill) => (
              <Card key={skill.id} className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 transition-all overflow-hidden group">
                <CardHeader className="pb-3 text-white">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg bg-orange-500/10 border border-orange-500/20`}>
                      <Zap className="w-5 h-5 text-orange-500" />
                    </div>
                    <Badge variant={skill.isActive ? "default" : "secondary"} className={skill.isActive ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-neutral-800 text-neutral-500 border-neutral-700"}>
                      {skill.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4 flex items-center gap-2">
                    {skill.name}
                    <span className="text-[10px] uppercase tracking-widest text-neutral-600 font-mono">{skill.version}</span>
                  </CardTitle>
                  <CardDescription className="text-neutral-400 line-clamp-2 min-h-[40px]">
                    {skill.description || `Skill ESC importée (${skill.slug})`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3 text-white">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline" className="border-neutral-800 text-neutral-500">
                      {skill.category}
                    </Badge>
                    <Badge variant="outline" className="border-neutral-800 text-neutral-500">
                      Slug: {skill.slug}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="pt-3 border-t border-neutral-800 bg-black/20 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={skill.isActive} 
                      onCheckedChange={() => toggleActive(skill.id, skill.isActive)}
                    />
                    <span className="text-xs font-medium text-neutral-400">
                      {skill.isActive ? "Activé" : "Désactivé"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-white" title="Voir SKILL.md">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-neutral-500 hover:text-red-400"
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
      </div>
    </div>
  )
}
