"use client"

import { useState, useEffect } from "react"
import { CreditCard, Crown, Sparkles, Check, Loader2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useTranslation } from "@/lib/i18n"
import { useAuth } from "@/hooks/use-auth"

interface Plan {
  id: string
  name: string
  type: string
  priceMonthly: number
  sessionsIncluded: number
  pricePerExtraSession: number
  features: string
  isActive: boolean
}

interface Subscription {
  id: string
  status: string
  sessionsUsed: number
  sessionsLimit: number
  trialEndsAt?: string
  plan: {
    name: string
    type: string
  }
}

export default function SubscriptionPage() {
  const { t } = useTranslation()
  const { session, isAdmin } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch plans
        const plansRes = await fetch("/api/plans")
        if (plansRes.ok) {
          const plansData = await plansRes.json()
          setPlans(plansData.plans || [])
        }

        // Fetch subscription
        const subRes = await fetch("/api/subscription")
        if (subRes.ok) {
          const subData = await subRes.json()
          setSubscription(subData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      TRIAL: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      ACTIVE: "bg-green-500/20 text-green-400 border-green-500/30",
      PAST_DUE: "bg-red-500/20 text-red-400 border-red-500/30",
      CANCELED: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30",
      EXPIRED: "bg-red-500/20 text-red-400 border-red-500/30",
    }
    return (
      <Badge className={styles[status] || styles.ACTIVE}>
        {status === "TRIAL" ? "Essai gratuit" : status}
      </Badge>
    )
  }

  const getPlanColor = (type: string) => {
    const colors: Record<string, string> = {
      STARTER: "from-neutral-600 to-neutral-800",
      CREATOR: "from-cyan-600 to-cyan-800",
      BUSINESS: "from-purple-600 to-purple-800",
      AGENCY: "from-orange-600 to-orange-800",
      ENTERPRISE: "from-yellow-600 to-yellow-800",
    }
    return colors[type] || colors.STARTER
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  // Admin message
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-orange-500" />
                Accès Administrateur
              </CardTitle>
              <CardDescription>
                En tant qu'administrateur, vous avez accès à toutes les fonctionnalités sans abonnement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-400">
                Gérez les abonnements des utilisateurs depuis le{" "}
                <a href="/admin/subscriptions" className="text-orange-500 hover:underline">
                  panneau d'administration
                </a>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t("subscription.title") || "Mon Abonnement"}</h1>
            <p className="text-neutral-400">{t("subscription.subtitle") || "Gérez votre plan et vos sessions"}</p>
          </div>
        </div>

        {/* Current Subscription */}
        {subscription && (
          <Card className="bg-neutral-900 border-neutral-700 mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  {subscription.status === "TRIAL" ? (
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Crown className="w-5 h-5 text-orange-500" />
                  )}
                  {subscription.plan?.name || "Plan actuel"}
                </CardTitle>
                {getStatusBadge(subscription.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Sessions Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-neutral-400">{t("common.sessionsThisMonth") || "Sessions ce mois"}</span>
                    <span className="text-white font-mono">
                      {subscription.sessionsUsed} / {subscription.sessionsLimit}
                    </span>
                  </div>
                  <Progress
                    value={(subscription.sessionsUsed / subscription.sessionsLimit) * 100}
                    className="h-2 bg-neutral-700"
                  />
                  <p className="text-sm text-neutral-500 mt-1">
                    {subscription.sessionsLimit - subscription.sessionsUsed} {t("common.sessionsRemaining") || "sessions restantes"}
                  </p>
                </div>

                {/* Trial Info */}
                {subscription.status === "TRIAL" && subscription.trialEndsAt && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-400 text-sm">
                      ⏰ {t("subscription.trialEnds") || "Votre essai gratuit se termine le"}{" "}
                      {new Date(subscription.trialEndsAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Plans */}
        <h2 className="text-xl font-bold text-white mb-4">{t("subscription.availablePlans") || "Plans disponibles"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const features = JSON.parse(plan.features || "[]")
            const isCurrentPlan = subscription?.plan?.type === plan.type

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden bg-neutral-900 border-neutral-700 ${
                  isCurrentPlan ? "ring-2 ring-orange-500" : ""
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs px-3 py-1 rounded-bl-lg">
                    {t("subscription.currentPlan") || "Plan actuel"}
                  </div>
                )}
                <div className={`h-2 bg-gradient-to-r ${getPlanColor(plan.type)}`} />
                <CardHeader>
                  <CardTitle className="text-white">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-white">{plan.priceMonthly}€</span>
                    <span className="text-neutral-400">/{t("common.month") || "mois"}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4 text-neutral-300">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <span>{plan.sessionsIncluded} {t("common.sessions") || "sessions"}</span>
                  </div>

                  {features.length > 0 && (
                    <ul className="space-y-2 mb-6">
                      {features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-neutral-400">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button
                    className={`w-full ${
                      isCurrentPlan
                        ? "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                        : "bg-orange-500 hover:bg-orange-600 text-white"
                    }`}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan
                      ? t("subscription.currentPlan") || "Plan actuel"
                      : t("subscription.selectPlan") || "Choisir ce plan"}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
