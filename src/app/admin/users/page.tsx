"use client"

import { useState, useEffect } from "react"
import { 
  Users, Search, RefreshCw, Loader2, Crown, ArrowLeft,
  Edit, Trash2, User, UserPlus
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
import Link from "next/link"
import { useTranslation } from "@/lib/i18n"

interface UserItem {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  subscription?: {
    status: string
    plan: { name: string }
  }
}

interface Plan {
  id: string
  name: string
  type: string
  priceMonthly: number
  sessionsIncluded: number
}

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<UserItem[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editDialog, setEditDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [createDialog, setCreateDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "" })
  const [createForm, setCreateForm] = useState({ email: "", name: "", password: "", role: "CLIENT", planId: "" })
  const [creating, setCreating] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/admin/plans")
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error("Error fetching plans:", error)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchPlans()
  }, [])

  const handleEdit = (user: UserItem) => {
    setSelectedUser(user)
    setEditForm({ name: user.name || "", email: user.email, role: user.role })
    setEditDialog(true)
  }

  const handleDelete = (user: UserItem) => {
    setSelectedUser(user)
    setDeleteDialog(true)
  }

  const saveEdit = async () => {
    if (!selectedUser) return
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (response.ok) {
        setEditDialog(false)
        fetchUsers()
      }
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  const confirmDelete = async () => {
    if (!selectedUser) return
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setDeleteDialog(false)
        fetchUsers()
      }
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const handleCreate = async () => {
    if (!createForm.email) return
    setCreating(true)
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      })
      if (response.ok) {
        setCreateDialog(false)
        setCreateForm({ email: "", name: "", password: "", role: "CLIENT", planId: "" })
        fetchUsers()
      } else {
        const data = await response.json()
        alert(data.error || "Erreur lors de la création")
      }
    } catch (error) {
      console.error("Error creating user:", error)
    } finally {
      setCreating(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    (user.name?.toLowerCase().includes(search.toLowerCase()))
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{t("admin.usersPage.statusActive")}</Badge>
      case "TRIAL":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{t("admin.usersPage.statusTrial")}</Badge>
      case "PAST_DUE":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">{t("admin.usersPage.statusPastDue")}</Badge>
      case "CANCELED":
        return <Badge className="bg-neutral-500/20 text-neutral-400 border-neutral-500/30">{t("admin.usersPage.statusCanceled")}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getUserCount = () => {
    const count = users.length
    if (count <= 1) {
      return `${count} ${t("admin.usersPage.userCount")}`
    }
    return `${count} ${t("admin.usersPage.userCountPlural")}`
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
          <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t("admin.usersPage.title")}</h1>
            <p className="text-neutral-400">{getUserCount()}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              placeholder={t("admin.usersPage.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-neutral-900 border-neutral-700 text-white"
            />
          </div>
          <Button onClick={() => setCreateDialog(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
            <UserPlus className="w-4 h-4 mr-2" />
            {t("admin.usersPage.createUser") || "Créer un utilisateur"}
          </Button>
          <Button onClick={fetchUsers} variant="outline" className="border-neutral-700 text-neutral-300">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("admin.usersPage.refresh")}
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
                  <TableHead className="text-neutral-400">{t("admin.usersPage.tableUser")}</TableHead>
                  <TableHead className="text-neutral-400">{t("admin.usersPage.tableEmail")}</TableHead>
                  <TableHead className="text-neutral-400">{t("admin.usersPage.tableRole")}</TableHead>
                  <TableHead className="text-neutral-400">{t("admin.usersPage.tableSubscription")}</TableHead>
                  <TableHead className="text-neutral-400">{t("admin.usersPage.tableCreatedAt")}</TableHead>
                  <TableHead className="text-neutral-400 text-right">{t("admin.usersPage.tableActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-neutral-500 py-8">
                      {t("admin.usersPage.noUsers")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-neutral-800 hover:bg-neutral-800/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-neutral-400" />
                          </div>
                          <span className="text-white">{user.name || t("admin.usersPage.noName")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-neutral-300 font-mono text-sm">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          user.role === "ADMIN" 
                            ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                            : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                        }>
                          {user.role === "ADMIN" ? (
                            <><Crown className="w-3 h-3 mr-1" /> {t("admin.usersPage.roleAdmin")}</>
                          ) : (
                            <><User className="w-3 h-3 mr-1" /> {t("admin.usersPage.roleClient")}</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.subscription ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-neutral-600 text-neutral-300">
                              {user.subscription.plan.name}
                            </Badge>
                            {getStatusBadge(user.subscription.status)}
                          </div>
                        ) : (
                          <span className="text-neutral-500">{t("admin.usersPage.noSubscription")}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-neutral-400 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleEdit(user)}
                            className="text-neutral-400 hover:text-white hover:bg-neutral-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDelete(user)}
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

        {/* Edit Dialog */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="bg-neutral-900 border-neutral-700">
            <DialogHeader>
              <DialogTitle className="text-white">{t("admin.usersPage.editTitle")}</DialogTitle>
              <DialogDescription className="text-neutral-400">
                {t("admin.usersPage.editDesc")} {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-neutral-300">{t("admin.usersPage.editName")}</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">{t("admin.usersPage.editEmail")}</Label>
                <Input
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">{t("admin.usersPage.editRole")}</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="ADMIN" className="text-white">{t("admin.usersPage.roleAdmin")}</SelectItem>
                    <SelectItem value="CLIENT" className="text-white">{t("admin.usersPage.roleClient")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)} className="border-neutral-700 text-neutral-300">
                {t("common.cancel")}
              </Button>
              <Button onClick={saveEdit} className="bg-orange-500 hover:bg-orange-600 text-white">
                {t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent className="bg-neutral-900 border-neutral-700">
            <DialogHeader>
              <DialogTitle className="text-white">{t("admin.usersPage.deleteTitle")}</DialogTitle>
              <DialogDescription className="text-neutral-400">
                {t("admin.usersPage.deleteDesc")} {selectedUser?.email} ? {t("admin.usersPage.deleteWarning")}
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

        {/* Create User Dialog */}
        <Dialog open={createDialog} onOpenChange={setCreateDialog}>
          <DialogContent className="bg-neutral-900 border-neutral-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">{t("admin.usersPage.createUserTitle") || "Créer un utilisateur"}</DialogTitle>
              <DialogDescription className="text-neutral-400">
                {t("admin.usersPage.createUserDesc") || "Créez un nouveau compte utilisateur"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-neutral-300">Email *</Label>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="bg-neutral-800 border-neutral-700 text-white"
                  placeholder="email@exemple.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">{t("admin.usersPage.editName")}</Label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">Mot de passe *</Label>
                <Input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="bg-neutral-800 border-neutral-700 text-white"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">{t("admin.usersPage.editRole")}</Label>
                <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v })}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="ADMIN" className="text-white">{t("admin.usersPage.roleAdmin")}</SelectItem>
                    <SelectItem value="CLIENT" className="text-white">{t("admin.usersPage.roleClient")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">{t("admin.usersPage.selectPlan") || "Plan (optionnel)"}</Label>
                <Select value={createForm.planId || "none"} onValueChange={(v) => setCreateForm({ ...createForm, planId: v === "none" ? "" : v })}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="Sélectionner un plan..." />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="none" className="text-neutral-400">
                      -- Aucun plan --
                    </SelectItem>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id} className="text-white">
                        {plan.name} - {plan.priceMonthly}€/mois ({plan.sessionsIncluded} sessions)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialog(false)} className="border-neutral-700 text-neutral-300">
                {t("common.cancel")}
              </Button>
              <Button onClick={handleCreate} disabled={creating} className="bg-orange-500 hover:bg-orange-600 text-white">
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                {t("common.create") || "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
