"use client"

import { useState, useEffect } from "react"
import { 
  CreditCard, Search, RefreshCw, Loader2, ArrowLeft,
  Edit, Trash2, Plus, Check, X, Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n"

interface Plan {
  id: string
  name: string
  type: string
  priceMonthly: number
  sessionsIncluded: number
  pricePerExtraSession: number
  maxUsers: number
  features: string
  isActive: boolean
  createdAt: string
  _count?: {
    subscriptions: number
  }
}

const PLAN_TYPES = [
  { value: "STARTER", label: "Starter" },
  { value: "CREATOR", label: "Creator" },
  { value: "BUSINESS", label: "Business" },
  { value: "AGENCY", label: "Agency" },
  { value: "ENTERPRISE", label: "Enterprise" },
]

export default function AdminPlansPage() {
  const { t } = useTranslation()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editDialog, setEditDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [createDialog, setCreateDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [editForm, setEditForm] = useState({
    name: "", type: "STARTER", priceMonthly: 0, sessionsIncluded: 0,
    pricePerExtraSession: 0, maxUsers: 1, features: "{}", isActive: true
  })
  const [createForm, setCreateForm] = useState({
    name: "", type: "STARTER", priceMonthly: 0, sessionsIncluded: 0,
    pricePerExtraSession: 0, maxUsers: 1, features: "{}", isActive: true
  })
  const [saving, setSaving] = useState(false)

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/plans")
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error("Error fetching plans:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handleEdit = (plan: Plan) => {
    setSelectedPlan(plan)
    setEditForm({
      name: plan.name,
      type: plan.type,
      priceMonthly: plan.priceMonthly,
      sessionsIncluded: plan.sessionsIncluded,
      pricePerExtraSession: plan.pricePerExtraSession,
      maxUsers: plan.maxUsers,
      features: plan.features,
      isActive: plan.isActive
    })
    setEditDialog(true)
  }

  const handleDelete = (plan: Plan) => {
    setSelectedPlan(plan)
    setDeleteDialog(true)
  }

  const saveEdit = async () => {
    if (!selectedPlan) return
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/plans/${selectedPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (response.ok) {
        setEditDialog(false)
        fetchPlans()
      } else {
        const data = await response.json()
        alert(data.error || "Erreur lors de la mise à jour")
      }
    } catch (error) {
      console.error("Error updating plan:", error)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedPlan) return
    try {
      const response = await fetch(`/api/admin/plans/${selectedPlan.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setDeleteDialog(false)
        fetchPlans()
      } else {
        const data = await response.json()
        alert(data.error || "Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Error deleting plan:", error)
    }
  }

  const handleCreate = async () => {
    if (!createForm.name || !createForm.type) return
    setSaving(true)
    try {
      const response = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      })
      if (response.ok) {
        setCreateDialog(false)
        setCreateForm({
          name: "", type: "STARTER", priceMonthly: 0, sessionsIncluded: 0,
          pricePerExtraSession: 0, maxUsers: 1, features: "{}", isActive: true
        })
        fetchPlans()
      } else {
        const data = await response.json()
        alert(data.error || "Erreur lors de la création")
      }
    } catch (error) {
      console.error("Error creating plan:", error)
    } finally {
      setSaving(false)
    }
  }

  const filteredPlans = plans.filter(plan => 
    plan.name.toLowerCase().includes(search.toLowerCase()) ||
    plan.type.toLowerCase().includes(search.toLowerCase())
  )

  const getPlanTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      STARTER: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30",
      CREATOR: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      BUSINESS: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      AGENCY: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      ENTERPRISE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    }
    return <Badge className={colors[type] || "bg-neutral-500/20 text-neutral-400"}>{type}</Badge>
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("admin.usersPage.back")}
            </Button>
          </Link>
          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t("admin.plansPage.title") || "Gestion des Plans"}</h1>
            <p className="text-neutral-400">{plans.length} plans</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              placeholder={t("admin.plansPage.searchPlaceholder") || "Rechercher un plan..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-neutral-900 border-neutral-700 text-white"
            />
          </div>
          <Button onClick={() => setCreateDialog(true)} className="bg-purple-500 hover:bg-purple-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            {t("admin.plansPage.createPlan") || "Créer un plan"}
          </Button>
          <Button onClick={fetchPlans} variant="outline" className="border-neutral-700 text-neutral-300">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("admin.usersPage.refresh")}
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
                  <TableHead className="text-neutral-400">Plan</TableHead>
                  <TableHead className="text-neutral-400">Type</TableHead>
                  <TableHead className="text-neutral-400">Prix/mois</TableHead>
                  <TableHead className="text-neutral-400">Sessions</TableHead>
                  <TableHead className="text-neutral-400">Max Users</TableHead>
                  <TableHead className="text-neutral-400">Abonnés</TableHead>
                  <TableHead className="text-neutral-400">Statut</TableHead>
                  <TableHead className="text-neutral-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-neutral-500 py-8">
                      {t("admin.plansPage.noPlans") || "Aucun plan trouvé"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlans.map((plan) => (
                    <TableRow key={plan.id} className="border-neutral-800 hover:bg-neutral-800/50">
                      <TableCell className="text-white font-medium">{plan.name}</TableCell>
                      <TableCell>{getPlanTypeBadge(plan.type)}</TableCell>
                      <TableCell className="text-green-400 font-mono">{plan.priceMonthly.toFixed(2)} €</TableCell>
                      <TableCell className="text-neutral-300">{plan.sessionsIncluded}</TableCell>
                      <TableCell className="text-neutral-300">{plan.maxUsers}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-neutral-400">
                          <Users className="w-4 h-4" />
                          {plan._count?.subscriptions || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {plan.isActive ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <Check className="w-3 h-3 mr-1" /> Actif
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            <X className="w-3 h-3 mr-1" /> Inactif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleEdit(plan)}
                            className="text-neutral-400 hover:text-white hover:bg-neutral-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDelete(plan)}
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
              <DialogTitle className="text-white">{t("admin.plansPage.createTitle") || "Créer un plan"}</DialogTitle>
              <DialogDescription className="text-neutral-400">
                {t("admin.plansPage.createDesc") || "Définissez un nouveau plan d'abonnement"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-neutral-300">Nom *</Label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="bg-neutral-800 border-neutral-700 text-white"
                  placeholder="Plan Pro"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">Type *</Label>
                <Select value={createForm.type} onValueChange={(v) => setCreateForm({ ...createForm, type: v })}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {PLAN_TYPES.map((pt) => (
                      <SelectItem key={pt.value} value={pt.value} className="text-white">{pt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">Prix mensuel (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={createForm.priceMonthly}
                  onChange={(e) => setCreateForm({ ...createForm, priceMonthly: parseFloat(e.target.value) || 0 })}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">Sessions incluses</Label>
                <Input
                  type="number"
                  value={createForm.sessionsIncluded}
                  onChange={(e) => setCreateForm({ ...createForm, sessionsIncluded: parseInt(e.target.value) || 0 })}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">Prix session extra (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={createForm.pricePerExtraSession}
                  onChange={(e) => setCreateForm({ ...createForm, pricePerExtraSession: parseFloat(e.target.value) || 0 })}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">Max utilisateurs</Label>
                <Input
                  type="number"
                  value={createForm.maxUsers}
                  onChange={(e) => setCreateForm({ ...createForm, maxUsers: parseInt(e.target.value) || 1 })}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Switch
                  checked={createForm.isActive}
                  onCheckedChange={(v) => setCreateForm({ ...createForm, isActive: v })}
                />
                <Label className="text-neutral-300">Plan actif</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialog(false)} className="border-neutral-700 text-neutral-300">
                {t("common.cancel")}
              </Button>
              <Button onClick={handleCreate} disabled={saving} className="bg-purple-500 hover:bg-purple-600 text-white">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {t("common.create") || "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="bg-neutral-900 border-neutral-700 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">{t("admin.plansPage.editTitle") || "Modifier le plan"}</DialogTitle>
              <DialogDescription className="text-neutral-400">
                {selectedPlan?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-neutral-300">Nom</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">Type</Label>
                <Select value={editForm.type} onValueChange={(v) => setEditForm({ ...editForm, type: v })}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {PLAN_TYPES.map((pt) => (
                      <SelectItem key={pt.value} value={pt.value} className="text-white">{pt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">Prix mensuel (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.priceMonthly}
                  onChange={(e) => setEditForm({ ...editForm, priceMonthly: parseFloat(e.target.value) || 0 })}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">Sessions incluses</Label>
                <Input
                  type="number"
                  value={editForm.sessionsIncluded}
                  onChange={(e) => setEditForm({ ...editForm, sessionsIncluded: parseInt(e.target.value) || 0 })}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">Prix session extra (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.pricePerExtraSession}
                  onChange={(e) => setEditForm({ ...editForm, pricePerExtraSession: parseFloat(e.target.value) || 0 })}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">Max utilisateurs</Label>
                <Input
                  type="number"
                  value={editForm.maxUsers}
                  onChange={(e) => setEditForm({ ...editForm, maxUsers: parseInt(e.target.value) || 1 })}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Switch
                  checked={editForm.isActive}
                  onCheckedChange={(v) => setEditForm({ ...editForm, isActive: v })}
                />
                <Label className="text-neutral-300">Plan actif</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)} className="border-neutral-700 text-neutral-300">
                {t("common.cancel")}
              </Button>
              <Button onClick={saveEdit} disabled={saving} className="bg-purple-500 hover:bg-purple-600 text-white">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent className="bg-neutral-900 border-neutral-700">
            <DialogHeader>
              <DialogTitle className="text-white">{t("admin.plansPage.deleteTitle") || "Supprimer le plan"}</DialogTitle>
              <DialogDescription className="text-neutral-400">
                {t("admin.plansPage.deleteDesc") || "Êtes-vous sûr de vouloir supprimer"} {selectedPlan?.name} ?
                {selectedPlan?._count?.subscriptions && selectedPlan._count.subscriptions > 0 && (
                  <p className="text-red-400 mt-2">
                    Ce plan a {selectedPlan._count.subscriptions} abonnement(s) actif(s).
                  </p>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog(false)} className="border-neutral-700 text-neutral-300">
                {t("common.cancel")}
              </Button>
              <Button onClick={confirmDelete} variant="destructive" className="bg-red-500 hover:bg-red-600">
                {t("common.delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
