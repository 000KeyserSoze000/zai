"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  Save,
  Check,
  Building,
  Target,
  Megaphone,
  MessageSquare,
  User,
  Loader2,
  AlertTriangle,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useTranslation } from "@/lib/i18n"

interface BusinessProfile {
  id: string
  brandName: string
  companyName: string
  targetAudience: string
  valueProposition: string
  toneOfVoice: string
}

export default function BusinessProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useTranslation()
  const { toast } = useToast()

  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState("Bonjour {{CLIENTE}}, je suis de {{MARCA}} ({{SOCIETE}}). Ma proposition : {{OFFRE}}.")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    const fetchProfile = async () => {
      // Prevent subsequent re-fetches if already loaded (safety for session updates)
      if (hasLoaded) return; 

      try {
        const response = await fetch("/api/user/profile")
        if (response.ok) {
          const data = await response.json()
          setProfile(data)
          setHasLoaded(true)
        } else {
          throw new Error("Failed to fetch profile")
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast({
          title: "Erreur",
          description: "Impossible de charger votre profil business.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    if (session && !hasLoaded) {
      fetchProfile()
    }
  }, [session, toast, hasLoaded])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      })

      if (response.ok) {
        toast({
          title: "Profil mis à jour",
          description: "Vos informations business ont été sauvegardées.",
        })
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder votre profil.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof BusinessProfile, value: string) => {
    if (profile) {
      setProfile({ ...profile, [field]: value })
    }
  }

  const getSubstitutedPreview = () => {
    if (!profile) return previewTemplate
    let result = previewTemplate
    const substitutions = {
      '{{MARCA}}': profile.brandName || '<span class="text-orange-500 font-bold">[MARCA]</span>',
      '{{SOCIETE}}': profile.companyName || '<span class="text-orange-500 font-bold">[SOCIETE]</span>',
      '{{CLIENTE}}': profile.targetAudience || '<span class="text-orange-500 font-bold">[CLIENTE]</span>',
      '{{AUDIENCE}}': profile.targetAudience || '<span class="text-orange-500 font-bold">[AUDIENCE]</span>',
      '{{OFFRE}}': profile.valueProposition || '<span class="text-orange-500 font-bold">[OFFRE]</span>',
      '{{TON}}': profile.toneOfVoice || '<span class="text-orange-500 font-bold">[TON]</span>',
    }
    
    Object.entries(substitutions).forEach(([tag, value]) => {
      const regex = new RegExp(tag, 'g')
      result = result.replace(regex, value)
    })
    return result
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-black p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <Toaster />
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t("nav.businessProfile")}</h1>
              <p className="text-neutral-400">{t("nav.businessProfileDesc")}</p>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {t("common.save")}
          </Button>
        </div>

        <div className="grid gap-6">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Building className="w-5 h-5 text-orange-500" />
                Identité de l'entreprise
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Ces informations remplaceront les tags comme {"{{MARCA}}"} ou {"{{SOCIETE}}"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white flex items-center gap-2">
                    Nom de la Marque (MARCA)
                  </label>
                  <Input
                    value={profile?.brandName || ""}
                    onChange={(e) => updateField("brandName", e.target.value)}
                    placeholder="Ex: MyAwesomeBrand"
                    className="bg-neutral-800 border-neutral-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Nom de la Société</label>
                  <Input
                    value={profile?.companyName || ""}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    placeholder="Ex: MyAwesome Corp"
                    className="bg-neutral-800 border-neutral-600 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-orange-500" />
                Cible & Audience
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Ces informations remplaceront les tags comme {"{{CLIENTE}}"} ou {"{{AUDIENCE}}"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Public Cible (CLIENTE)</label>
                <Textarea
                  value={profile?.targetAudience || ""}
                  onChange={(e) => updateField("targetAudience", e.target.value)}
                  placeholder="Ex: Jeunes entrepreneurs de 25-35 ans cherchant la liberté financière."
                  className="bg-neutral-800 border-neutral-600 text-white min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Megaphone className="w-5 h-5 text-orange-500" />
                Stratégie de Communication
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Détails sur ce que vous vendez et comment vous parlez
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Proposition de Valeur</label>
                <Textarea
                  value={profile?.valueProposition || ""}
                  onChange={(e) => updateField("valueProposition", e.target.value)}
                  placeholder="Ex: Nous aidons les créateurs à automatiser leur production vidéo avec l'IA."
                  className="bg-neutral-800 border-neutral-600 text-white min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Ton de Voix</label>
                <Input
                  value={profile?.toneOfVoice || ""}
                  onChange={(e) => updateField("toneOfVoice", e.target.value)}
                  placeholder="Ex: Professionnel, dynamique, accessible"
                  className="bg-neutral-800 border-neutral-600 text-white"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-orange-500/30 border-dashed">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-orange-500" />
                Live Preview : Remplacement des Tags
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Visualisez comment l'IA verra vos informations dans ses prompts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-400">Testez un texte avec des tags :</label>
                <Input
                  value={previewTemplate}
                  onChange={(e) => setPreviewTemplate(e.target.value)}
                  className="bg-neutral-800/50 border-neutral-700 text-neutral-300 text-sm"
                />
              </div>

              <div className="p-4 bg-black rounded-lg border border-neutral-800 min-h-[100px]">
                <div className="text-xs font-bold text-neutral-500 uppercase mb-2 tracking-wider">Simulation de Prompt</div>
                <div 
                  className="text-white text-lg leading-relaxed italic"
                  dangerouslySetInnerHTML={{ __html: getSubstitutedPreview() }}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {['{{MARCA}}', '{{SOCIETE}}', '{{CLIENTE}}', '{{OFFRE}}', '{{TON}}'].map(tag => (
                  <Badge 
                    key={tag} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-orange-500/10 border-orange-500/30 text-orange-500"
                    onClick={() => setPreviewTemplate(prev => prev + " " + tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg flex gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <div className="text-sm text-neutral-400">
              <p className="text-orange-200 font-medium mb-1">Astuce d'Expert</p>
              Plus ces champs sont détaillés, plus les agents IA seront précis dans leurs réponses et adaptés à votre identité réelle.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
