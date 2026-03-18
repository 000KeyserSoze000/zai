"use client"

import { useState, useEffect } from "react"
import { 
  CreditCard, Search, RefreshCw, Loader2, ArrowLeft,
  Crown, CheckCircle, XCircle, Clock, AlertTriangle, Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n"

interface Subscription {
  id: string
  userId: string
  status: string
  sessionsUsed: number
  sessionsLimit: number
  createdAt: string
  user: {
    email: string
    name: string | null
  }
  plan: {
    id: string
    name: string
    type: string
    priceMonthly: number
  }
}

interface Plan {
  id: string
  name: string
  type: string
  priceMonthly: number
  sessionsIncluded: number
}

interface User {
  id: string
  email: string
  name: string | null
}

export default function AdminSubscriptionsPage() {
  const { t } = useTranslation()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editDialog, setEditDialog] = useState(false)
  const [createDialog, setCreateDialog] = useState(false)
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)
  const [editForm, setEditForm] = useState({ status: "", sessionsLimit: 0, planId: "" })
  const [createForm, setCreateForm] = useState({ userId: "", planId: "", status: "TRIAL" })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [subsRes, plansRes, usersRes] = await Promise.all([
        fetch("/api/admin/subscriptions"),
        fetch("/api/admin/plans"),
        fetch("/api/admin/users"),
      ])
      
      if (subsRes.ok) {
        const data = await subsRes.json()
        setSubscriptions(data.subscriptions || [])
      }
      if (plansRes.ok) {
        const data = await plansRes.json()
        setPlans(data.plans || [])
      }
      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data.users || [])
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

  const handleEdit = (sub: Subscription) => {
    setSelectedSub(sub)
    setEditForm({ 
      status: sub.status, 
      sessionsLimit: sub.sessionsLimit,
      planId: sub.plan.id
    })
    setEditDialog(true)
  }

  const handleCreate = () => {
    setCreateForm({ userId: "", planId: "", status: "TRIAL" })
    setCreateDialog(true)
  }

  const saveEdit = async () => {
    if (!selectedSub) return
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/subscriptions/${selectedSub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (response.ok) {
        setEditDialog(false)
        fetchData()
      } else {
        const data = await response.json()
        alert(data.error || "Erreur lors de la mise à jour")
      }
    } catch (error) {
      console.error("Error updating subscription:", error)
    } finally {
      setSaving(false)
    }
  }

  const saveCreate = async () => {
    if (!createForm.userId || !createForm.planId) {
      alert("Veuillez sélectionner un utilisateur et un plan")
      return
    }
    setSaving(true)
    try {
      const response = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      })
      if (response.ok) {
        setCreateDialog(false)
        fetchData()
      } else {
        const data = await response.json()
        alert(data.error || "Erreur lors de la création")
      }
    } catch (error) {
      console.error("Error creating subscription:", error)
    } finally {
      setSaving(false)
    }
  }

  const filteredSubs = subscriptions.filter(sub => 
    sub.user.email.toLowerCase().includes(search.toLowerCase()) ||
    sub.plan.name.toLowerCase().includes(search.toLowerCase())
  )

  // Filter users without subscription for create dialog
  const usersWithoutSubscription = users.filter(u => 
    !subscriptions.some(s => s.userId === u.id)
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" /> {t("admin.subscriptionsPage.statusActive")}</Badge>
      case "TRIAL":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> {t("admin.subscriptionsPage.statusTrial")}</Badge>
      case "PAST_DUE":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30"><AlertTriangle className="w-3 h-3 mr-1" /> {t("admin.subscriptionsPage.statusPastDue")}</Badge>
      case "CANCELED":
        return <Badge className="bg-neutral-500/20 text-neutral-400 border-neutral-500/30"><XCircle className="w-3 h-3 mr-1" /> {t("admin.subscriptionsPage.statusCanceled")}</Badge>
      case "EXPIRED":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> {t("admin.subscriptionsPage.statusExpired")}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
  }

  const getSubscriptionCount = () => {
    const count = subscriptions.length
    if (count <= 1) {
      return `${count} ${t("admin.subscriptionsPage.subscriptionCount")}`
    }
    return `${count} ${t("admin.subscriptionsPage.subscriptionCountPlural")}`
  }

  const getPlanBadge = (type: string) => {
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
              {t("admin.subscriptionsPage.back")}
            </Button>
          </Link>
          <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t("admin.subscriptionsPage.title")}</h1>
            <p className="text-neutral-400">{getSubscriptionCount()}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-neutral-400">{t("admin.subscriptionsPage.statsActive")}</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {subscriptions.filter(s => s.status === "ACTIVE").length}
            </p>
          </div>
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-neutral-400">{t("admin.subscriptionsPage.statsTrial")}</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {subscriptions.filter(s => s.status === "TRIAL").length}
            </p>
          </div>
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-neutral-400">{t("admin.subscriptionsPage.statsPastDue")}</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {subscriptions.filter(s => s.status === "PAST_DUE").length}
            </p>
          </div>
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-neutral-400">{t("admin.subscriptionsPage.statsCanceled")}</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {subscriptions.filter(s => s.status === "CANCELED" || s.status === "EXPIRED").length}
            </p>
          </div>
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-cyan-500" />
              <span className="text-sm text-neutral-400">{t("admin.subscriptionsPage.statsMrr")}</span>
            </div>
            <p className="text-2xl font-bold text-green-400">
              {formatPrice(
                subscriptions
                  .filter(s => s.status === "ACTIVE" || s.status === "TRIAL")
                  .reduce((sum, s) => sum + (s.plan?.priceMonthly || 0), 0)
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              placeholder={t("admin.subscriptionsPage.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-neutral-900 border-neutral-700 text-white"
            />
          </div>
          <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            {t("admin.subscriptionsPage.createSubscription") || "Créer un abonnement"}
          </Button>
          <Button onClick={fetchData} variant="outline" className="border-neutral-700 text-neutral-300">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("admin.subscriptionsPage.refresh")}
          </Button>
        </div>

        {/* Table */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-700 hover:bg-neutral-800">
                  <TableHead className="text-neutral-400">{t("admin.subscriptionsPage.tableUser")}</TableHead>
                  <TableHead className="text-neutral-400">{t("admin.subscriptionsPage.tablePlan")}</TableHead>
                  <TableHead className="text-neutral-400">{t("admin.subscriptionsPage.tableStatus")}</TableHead>
                  <TableHead className="text-neutral-400">{t("admin.subscriptionsPage.tableSessions")}</TableHead>
                  <TableHead className="text-neutral-400">{t("admin.subscriptionsPage.tablePrice")}</TableHead>
                  <TableHead className="text-neutral-400">{t("admin.subscriptionsPage.tableDate")}</TableHead>
                  <TableHead className="text-neutral-400 text-right">{t("admin.subscriptionsPage.tableActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-neutral-500 py-8">
                      {t("admin.subscriptionsPage.noSubscriptions")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubs.map((sub) => (
                    <TableRow key={sub.id} className="border-neutral-800 hover:bg-neutral-800/50">
                      <TableCell>
                        <div>
                          <p className="text-white font-mono text-sm">{sub.user.email}</p>
                          {sub.user.name && <p className="text-neutral-500 text-xs">{sub.user.name}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-orange-500" />
                          <span className="text-white">{sub.plan.name}</span>
                          {getPlanBadge(sub.plan.type)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono ${sub.sessionsUsed >= sub.sessionsLimit ? 'text-red-400' : 'text-white'}`}>
                            {sub.sessionsUsed}
                          </span>
                          <span className="text-neutral-500">/</span>
                          <span className="text-neutral-300 font-mono">{sub.sessionsLimit}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-green-400 font-mono">
                        {formatPrice(sub.plan.priceMonthly)}
                      </TableCell>
                      <TableCell className="text-neutral-400 text-sm">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleEdit(sub)}
                          className="text-neutral-400 hover:text-white hover:bg-neutral-700"
                        >
                          {t("admin.subscriptionsPage.modify")}
                        </Button>
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
          <DialogContent className="bg-neutral-900 border-neutral-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">{t("admin.subscriptionsPage.createTitle") || "Créer un abonnement"}</DialogTitle>
              <DialogDescription className="text-neutral-400">
                {t("admin.subscriptionsPage.createDesc") || "Attribuez un plan à un utilisateur"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-neutral-300">{t("admin.subscriptionsPage.selectUser") || "Utilisateur"}</Label>
                <Select value={createForm.userId} onValueChange={(v) => setCreateForm({ ...createForm, userId: v })}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder={t("admin.subscriptionsPage.selectUserPlaceholder") || "Sélectionner un utilisateur"} />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {usersWithoutSubscription.length === 0 ? (
                      <SelectItem value="_none" disabled className="text-neutral-500">
                        {t("admin.subscriptionsPage.noUsersWithoutSub") || "Tous les utilisateurs ont un abonnement"}
                      </SelectItem>
                    ) : (
                      usersWithoutSubscription.map((user) => (
                        <SelectItem key={user.id} value={user.id} className="text-white">
                          {user.email} {user.name ? `(${user.name})` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">{t("admin.subscriptionsPage.selectPlan") || "Plan"}</Label>
                <Select value={createForm.planId} onValueChange={(v) => setCreateForm({ ...createForm, planId: v })}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder={t("admin.subscriptionsPage.selectPlanPlaceholder") || "Sélectionner un plan"} />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {plans.filter(p => p.sessionsIncluded > 0).map((plan) => (
                      <SelectItem key={plan.id} value={plan.id} className="text-white">
                        {plan.name} - {formatPrice(plan.priceMonthly)}/mois ({plan.sessionsIncluded} sessions)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">{t("admin.subscriptionsPage.editStatus")}</Label>
                <Select value={createForm.status} onValueChange={(v) => setCreateForm({ ...createForm, status: v })}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="TRIAL" className="text-white">{t("admin.subscriptionsPage.statusTrial")}</SelectItem>
                    <SelectItem value="ACTIVE" className="text-white">{t("admin.subscriptionsPage.statusActive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialog(false)} className="border-neutral-700 text-neutral-300">
                {t("common.cancel")}
              </Button>
              <Button onClick={saveCreate} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {t("common.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="bg-neutral-900 border-neutral-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">{t("admin.subscriptionsPage.editTitle")}</DialogTitle>
              <DialogDescription className="text-neutral-400">
                {t("admin.subscriptionsPage.editDesc")} {selectedSub?.user.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-neutral-300">{t("admin.subscriptionsPage.selectPlan") || "Plan"}</Label>
                <Select value={editForm.planId} onValueChange={(v) => setEditForm({ ...editForm, planId: v })}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id} className="text-white">
                        {plan.name} - {formatPrice(plan.priceMonthly)}/mois ({plan.sessionsIncluded} sessions)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">{t("admin.subscriptionsPage.editStatus")}</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="TRIAL" className="text-white">{t("admin.subscriptionsPage.statusTrial")}</SelectItem>
                    <SelectItem value="ACTIVE" className="text-white">{t("admin.subscriptionsPage.statusActive")}</SelectItem>
                    <SelectItem value="PAST_DUE" className="text-white">{t("admin.subscriptionsPage.statusPastDue")}</SelectItem>
                    <SelectItem value="CANCELED" className="text-white">{t("admin.subscriptionsPage.statusCanceled")}</SelectItem>
                    <SelectItem value="EXPIRED" className="text-white">{t("admin.subscriptionsPage.statusExpired")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">{t("admin.subscriptionsPage.editSessionsLimit")}</Label>
                <Input
                  type="number"
                  value={editForm.sessionsLimit}
                  onChange={(e) => setEditForm({ ...editForm, sessionsLimit: parseInt(e.target.value) || 0 })}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)} className="border-neutral-700 text-neutral-300">
                {t("common.cancel")}
              </Button>
              <Button onClick={saveEdit} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
