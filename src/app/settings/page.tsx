"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Sliders,
  Link2,
  Key,
  Mail,
  Shield,
  Wrench,
  Save,
  Check,
  Eye,
  EyeOff,
  Globe,
  Clock,
  Users,
  AlertCircle,
  Copy,
  CheckCircle,
  Zap,
  Scale,
  FileText,
  Cookie,
  Languages,
  Plus,
  X,
  Euro,
  Cloud,
  CloudOff,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Edit
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

// Types
interface SiteSettings {
  id: string
  siteName: string
  siteUrl: string
  siteEmail: string
  timezone: string
  defaultUserGroup: string
  enableRecaptcha: boolean
  recaptchaSiteKey: string | null
  recaptchaSecretKey: string | null
  enableAnalytics: boolean
  analyticsId: string | null
  oauthEnabled: boolean
  facebookOAuth: string | null
  twitterOAuth: string | null
  linkedinOAuth: string | null
  googleOAuth: string | null
  zaiApiKey: string | null
  openaiApiKey: string | null
  anthropicApiKey: string | null
  googleAiApiKey: string | null
  mistralApiKey: string | null
  replicateApiKey: string | null
  stabilityApiKey: string | null
  // Email settings
  emailEnabled: boolean
  emailProvider: string
  // SMTP settings
  smtpEnabled: boolean
  smtpHost: string | null
  smtpPort: number | null
  smtpUser: string | null
  smtpPassword: string | null
  smtpFromEmail: string | null
  smtpFromName: string | null
  smtpEncryption: string
  // Provider API keys
  sendgridApiKey: string | null
  brevoApiKey: string | null
  mailchimpApiKey: string | null
  amazonSesApiKey: string | null
  amazonSesSecretKey: string | null
  mailgunApiKey: string | null
  mailgunDomain: string | null
  postmarkApiKey: string | null
  // Security settings
  twoFactorEnabled: boolean
  rateLimitEnabled: boolean
  rateLimitRequests: number
  rateLimitWindow: number
  maintenanceMode: boolean
  maintenanceMessage: string | null
  gdprEnabled: boolean
  cookieValidityDays: number
  defaultLanguage: string
  availableLanguages: string
  defaultCurrency: string
  updatedAt: string
}

type SyncStatus = 'synced' | 'syncing' | 'error' | 'pending'

interface LegalPage {
  id: string
  type: string
  title: string
  content: string
  updatedAt: string
}

interface EmailTemplate {
  id: string
  type: string
  subject: string
  body: string
  variables: string | null
  isActive: boolean
  updatedAt: string
}

interface OAuthProvider {
  enabled: boolean
  apiKey: string
  apiSecret: string
  redirectUrl: string
}

const TIMEZONES = [
  { value: "Europe/Paris", label: "(UTC+01:00) Paris" },
  { value: "Europe/London", label: "(UTC+00:00) Londres" },
  { value: "America/New_York", label: "(UTC-05:00) New York" },
  { value: "America/Los_Angeles", label: "(UTC-08:00) Los Angeles" },
  { value: "Asia/Tokyo", label: "(UTC+09:00) Tokyo" },
  { value: "Asia/Shanghai", label: "(UTC+08:00) Shanghai" },
  { value: "Australia/Sydney", label: "(UTC+10:00) Sydney" },
]

const OAUTH_PROVIDERS = [
  { id: 'facebook', name: 'Facebook', icon: '📘', color: 'blue' },
  { id: 'twitter', name: 'X (Twitter)', icon: '𝕏', color: 'gray' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'blue' },
  { id: 'google', name: 'Google', icon: '🔴', color: 'red' },
]

const AI_PROVIDERS = [
  { id: 'zai', name: 'Z.ai', description: 'Plateforme IA française', icon: '🇫🇷' },
  { id: 'openai', name: 'OpenAI', description: 'GPT-4, DALL-E, Whisper', icon: '🤖' },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude 3.5 Sonnet, Opus', icon: '🧠' },
  { id: 'googleAi', name: 'Google AI', description: 'Gemini, PaLM', icon: '🌐' },
  { id: 'mistral', name: 'Mistral AI', description: 'Mistral Large, Mixtral', icon: '🌪️' },
  { id: 'replicate', name: 'Replicate', description: 'Modèles open source', icon: '🔄' },
  { id: 'stability', name: 'Stability AI', description: 'Stable Diffusion, SDXL', icon: '🎨' },
]

const EMAIL_PROVIDERS = [
  { 
    id: 'smtp', 
    name: 'SMTP Custom', 
    description: 'Configuration SMTP personnalisée', 
    icon: '📧',
    fields: ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPassword', 'smtpFromEmail', 'smtpFromName', 'smtpEncryption']
  },
  { 
    id: 'gmail', 
    name: 'Gmail', 
    description: 'Google Mail (nécessite un mot de passe d\'application)', 
    icon: '📬',
    fields: ['smtpUser', 'smtpPassword', 'smtpFromEmail', 'smtpFromName'],
    presets: { smtpHost: 'smtp.gmail.com', smtpPort: 587, smtpEncryption: 'tls' }
  },
  { 
    id: 'sendgrid', 
    name: 'SendGrid', 
    description: 'Service d\'email de Twilio', 
    icon: '📤',
    fields: ['sendgridApiKey', 'smtpFromEmail', 'smtpFromName']
  },
  { 
    id: 'brevo', 
    name: 'Brevo (Sendinblue)', 
    description: 'Plateforme email française', 
    icon: '🇫🇷',
    fields: ['brevoApiKey', 'smtpFromEmail', 'smtpFromName']
  },
  { 
    id: 'mailchimp', 
    name: 'Mailchimp', 
    description: 'Marketing par email', 
    icon: '🐵',
    fields: ['mailchimpApiKey', 'smtpFromEmail', 'smtpFromName']
  },
  { 
    id: 'amazon_ses', 
    name: 'Amazon SES', 
    description: 'Simple Email Service d\'AWS', 
    icon: '☁️',
    fields: ['amazonSesApiKey', 'amazonSesSecretKey', 'smtpFromEmail', 'smtpFromName']
  },
  { 
    id: 'mailgun', 
    name: 'Mailgun', 
    description: 'Service d\'email pour développeurs', 
    icon: '🔫',
    fields: ['mailgunApiKey', 'mailgunDomain', 'smtpFromEmail', 'smtpFromName']
  },
  { 
    id: 'postmark', 
    name: 'Postmark', 
    description: 'Emails transactionnels rapides', 
    icon: '✉️',
    fields: ['postmarkApiKey', 'smtpFromEmail', 'smtpFromName']
  },
]

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced')
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [oauthProviders, setOauthProviders] = useState<Record<string, OAuthProvider>>({})
  const [legalPages, setLegalPages] = useState<LegalPage[]>([])
  const [activeLegalPage, setActiveLegalPage] = useState<string>("cgv")
  const [legalPageContent, setLegalPageContent] = useState({ title: "", content: "" })
  const [savingLegalPage, setSavingLegalPage] = useState(false)
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(['fr'])
  
  // Email templates state
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [testEmailTo, setTestEmailTo] = useState("")
  const [sendingTestEmail, setSendingTestEmail] = useState(false)
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if user is admin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/")
    }
  }, [status, session, router])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/admin/settings")
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
          
          // Parse OAuth providers
          const parsed: Record<string, OAuthProvider> = {}
          for (const provider of OAUTH_PROVIDERS) {
            const key = `${provider.id}OAuth` as keyof SiteSettings
            const raw = data[key] as string | null
            if (raw) {
              try {
                parsed[provider.id] = JSON.parse(raw)
              } catch {
                parsed[provider.id] = { enabled: false, apiKey: '', apiSecret: '', redirectUrl: '' }
              }
            } else {
              parsed[provider.id] = { 
                enabled: false, 
                apiKey: '', 
                apiSecret: '', 
                redirectUrl: `${data.siteUrl}/auth/callback/${provider.id}` 
              }
            }
          }
          setOauthProviders(parsed)
          
          // Parse available languages
          try {
            const langs = data.availableLanguages ? JSON.parse(data.availableLanguages) : ['fr']
            setAvailableLanguages(Array.isArray(langs) ? langs : ['fr'])
          } catch {
            setAvailableLanguages(['fr'])
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.role === "ADMIN") {
      fetchSettings()
    }
  }, [session])

  // Fetch legal pages
  useEffect(() => {
    const fetchLegalPages = async () => {
      try {
        const response = await fetch("/api/admin/legal-pages")
        if (response.ok) {
          const data = await response.json()
          setLegalPages(data)
          
          // Set default page content
          const defaultPage = data.find((p: LegalPage) => p.type === "cgv")
          if (defaultPage) {
            setLegalPageContent({ title: defaultPage.title, content: defaultPage.content })
          }
        }
      } catch (error) {
        console.error("Error fetching legal pages:", error)
      }
    }

    if (session?.user?.role === "ADMIN") {
      fetchLegalPages()
    }
  }, [session])

  // Fetch email templates
  useEffect(() => {
    const fetchEmailTemplates = async () => {
      try {
        const response = await fetch("/api/admin/email-templates")
        if (response.ok) {
          const data = await response.json()
          setEmailTemplates(data)
        }
      } catch (error) {
        console.error("Error fetching email templates:", error)
      }
    }

    if (session?.user?.role === "ADMIN") {
      fetchEmailTemplates()
    }
  }, [session])

  // Handle legal page selection
  const handleLegalPageSelect = (type: string) => {
    setActiveLegalPage(type)
    const page = legalPages.find(p => p.type === type)
    if (page) {
      setLegalPageContent({ title: page.title, content: page.content })
    } else {
      // Default titles for new pages
      const titles: Record<string, string> = {
        cgv: "Conditions Générales de Vente",
        mentions_legales: "Mentions Légales",
        gdpr: "Politique de Confidentialité (RGPD)",
        privacy: "Politique de Confidentialité"
      }
      setLegalPageContent({ title: titles[type] || "", content: "" })
    }
  }

  // Save legal page
  const handleSaveLegalPage = async () => {
    setSavingLegalPage(true)
    try {
      const response = await fetch("/api/admin/legal-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeLegalPage,
          title: legalPageContent.title,
          content: legalPageContent.content
        })
      })
      
      if (response.ok) {
        const savedPage = await response.json()
        setLegalPages(prev => {
          const existing = prev.find(p => p.type === activeLegalPage)
          if (existing) {
            return prev.map(p => p.type === activeLegalPage ? savedPage : p)
          }
          return [...prev, savedPage]
        })
        toast({
          title: "Page sauvegardée",
          description: "La page légale a été mise à jour avec succès.",
        })
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la page légale.",
        variant: "destructive"
      })
    } finally {
      setSavingLegalPage(false)
    }
  }

  // Save settings
  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          ...oauthProviders
        })
      })
      
      if (response.ok) {
        toast({
          title: "Paramètres sauvegardés",
          description: "Les paramètres ont été mis à jour avec succès.",
        })
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  // Auto-save settings to API
  const saveSettingsToAPI = useCallback(async (settingsToSave: SiteSettings, providers?: Record<string, OAuthProvider>) => {
    console.log('[Settings] Saving to API...')
    console.log('[Settings] Settings:', settingsToSave)
    console.log('[Settings] Providers:', providers)
    
    try {
      setSyncStatus('syncing')
      
      const body = {
        ...settingsToSave,
        ...(providers || oauthProviders)
      }
      console.log('[Settings] Request body:', body)
      
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save settings')
      }
      
      setSyncStatus('synced')
      console.log('[Settings] Saved successfully')
    } catch (error) {
      console.error('Save error:', error)
      setSyncStatus('error')
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive"
      })
    }
  }, [oauthProviders, toast])

  // Debounced save for text inputs (500ms delay)
  const debouncedSave = useCallback((settingsToSave: SiteSettings) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    setSyncStatus('pending')
    
    saveTimeoutRef.current = setTimeout(() => {
      saveSettingsToAPI(settingsToSave)
    }, 500)
  }, [saveSettingsToAPI])

  const updateSetting = (key: keyof SiteSettings, value: unknown) => {
    if (settings) {
      console.log('[Settings] Updating setting:', key, 'to:', value)
      const newSettings = { ...settings, [key]: value }
      setSettings(newSettings)
      
      // Clear any pending saves
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      
      // Auto-save immediately for toggles, debounced for text
      if (typeof value === 'boolean') {
        setSyncStatus('syncing')
        saveSettingsToAPI(newSettings)
      } else {
        debouncedSave(newSettings)
      }
    }
  }

  const updateOAuthProvider = (providerId: string, field: keyof OAuthProvider, value: string | boolean) => {
    if (!settings) {
      console.log('[Settings] updateOAuthProvider: settings is null, aborting')
      return
    }
    
    console.log('[Settings] Updating OAuth provider:', providerId, field, value)
    
    const newProviders = {
      ...oauthProviders,
      [providerId]: {
        ...oauthProviders[providerId],
        [field]: value
      }
    }
    
    console.log('[Settings] New providers state:', newProviders)
    setOauthProviders(newProviders)
    
    // Clear any pending saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Auto-save immediately for toggles, debounced for text
    if (field === 'enabled') {
      setSyncStatus('syncing')
      console.log('[Settings] Saving OAuth providers immediately...')
      saveSettingsToAPI(settings, newProviders)
    } else {
      setSyncStatus('pending')
      saveTimeoutRef.current = setTimeout(() => {
        if (settings) {
          saveSettingsToAPI(settings, newProviders)
        }
      }, 500)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copié !",
      description: "L'URL a été copiée dans le presse-papiers.",
    })
  }

  // Save email template
  const handleSaveTemplate = async () => {
    if (!editingTemplate) return
    
    setSavingTemplate(true)
    try {
      const response = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTemplate)
      })
      
      if (response.ok) {
        const savedTemplate = await response.json()
        setEmailTemplates(prev => prev.map(t => t.id === savedTemplate.id ? savedTemplate : t))
        setEditingTemplate(null)
        toast({
          title: "Modèle enregistré",
          description: "Le modèle d'email a été mis à jour avec succès.",
        })
      } else {
        throw new Error("Failed to save template")
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le modèle.",
        variant: "destructive"
      })
    } finally {
      setSavingTemplate(false)
    }
  }

  // Send test email
  const handleSendTestEmail = async () => {
    if (!testEmailTo) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email.",
        variant: "destructive"
      })
      return
    }
    
    setSendingTestEmail(true)
    try {
      const response = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmailTo })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Email envoyé !",
          description: `Un email de test a été envoyé à ${testEmailTo}`,
        })
      } else {
        throw new Error(data.error || "Failed to send test email")
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'envoi"
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setSendingTestEmail(false)
    }
  }

  // Get template label by type
  const getTemplateLabel = (type: string) => {
    const labels: Record<string, string> = {
      welcome: "Email de bienvenue",
      reset_password: "Réinitialisation mot de passe",
      notification: "Notifications",
      subscription: "Mise à jour d'abonnement",
      trial_expiring: "Essai expire bientôt"
    }
    return labels[type] || type
  }

  const getTemplateDesc = (type: string) => {
    const descs: Record<string, string> = {
      welcome: "Envoyé lors de l'inscription",
      reset_password: "Demande de réinitialisation",
      notification: "Alertes et mises à jour",
      subscription: "Changement d'abonnement",
      trial_expiring: "Rappel fin d'essai"
    }
    return descs[type] || ""
  }

  // Sync status indicator
  const SyncIndicator = () => {
    const statusConfig = {
      synced: { icon: Cloud, color: 'text-green-500', bg: 'bg-green-500/20', label: 'Synchronisé' },
      syncing: { icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-500/20', label: 'Synchronisation...', animate: true },
      error: { icon: CloudOff, color: 'text-red-500', bg: 'bg-red-500/20', label: 'Erreur de sync' },
      pending: { icon: RefreshCw, color: 'text-yellow-500', bg: 'bg-yellow-500/20', label: 'En attente...' },
    }
    
    const { icon: Icon, color, bg, label, animate } = statusConfig[syncStatus]
    
    return (
      <Badge className={`${bg} ${color} border-0 flex items-center gap-1.5`}>
        <Icon className={`w-3.5 h-3.5 ${animate ? 'animate-spin' : ''}`} />
        {label}
      </Badge>
    )
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-black p-6 flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    )
  }

  if (!session || session.user?.role !== "ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <Toaster />
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Sliders className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Paramètres</h1>
              <p className="text-neutral-400">Configuration de la plateforme</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SyncIndicator />
            {syncStatus === 'error' && (
              <Button 
                variant="outline"
                className="border-neutral-600 text-neutral-300"
                onClick={() => settings && saveSettingsToAPI(settings)}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-neutral-800 border border-neutral-700 mb-6 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="general" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Sliders className="w-4 h-4 mr-2" />
              Général
            </TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Link2 className="w-4 h-4 mr-2" />
              Intégrations
            </TabsTrigger>
            <TabsTrigger value="api" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Key className="w-4 h-4 mr-2" />
              API
            </TabsTrigger>
            <TabsTrigger value="email" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Shield className="w-4 h-4 mr-2" />
              Sécurité
            </TabsTrigger>
            <TabsTrigger value="legal" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Scale className="w-4 h-4 mr-2" />
              Légal
            </TabsTrigger>
            <TabsTrigger value="legal-pages" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              Pages Légales
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Wrench className="w-4 h-4 mr-2" />
              Maintenance
            </TabsTrigger>
          </TabsList>

          {/* ==================== GENERAL TAB ==================== */}
          <TabsContent value="general" className="space-y-6">
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-orange-500" />
                  Configuration du Site
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  Paramètres généraux de la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Nom du site web</label>
                    <Input
                      value={settings?.siteName || ""}
                      onChange={(e) => updateSetting("siteName", e.target.value)}
                      className="bg-neutral-800 border-neutral-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">URL du Site Web</label>
                    <Input
                      value={settings?.siteUrl || ""}
                      onChange={(e) => updateSetting("siteUrl", e.target.value)}
                      placeholder="https://votre-site.com"
                      className="bg-neutral-800 border-neutral-600 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Adresse Email du Site Web</label>
                    <Input
                      type="email"
                      value={settings?.siteEmail || ""}
                      onChange={(e) => updateSetting("siteEmail", e.target.value)}
                      className="bg-neutral-800 border-neutral-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Fuseau horaire
                    </label>
                    <Select
                      value={settings?.timezone || "Europe/Paris"}
                      onValueChange={(value) => updateSetting("timezone", value)}
                    >
                      <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700">
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value} className="text-white hover:bg-neutral-700">
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator className="bg-neutral-700" />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Groupe par Défaut pour les Nouveaux Utilisateurs
                  </label>
                  <Select
                    value={settings?.defaultUserGroup || "CLIENT"}
                    onValueChange={(value) => updateSetting("defaultUserGroup", value)}
                  >
                    <SelectTrigger className="w-64 bg-neutral-800 border-neutral-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      <SelectItem value="CLIENT" className="text-white hover:bg-neutral-700">
                        Client
                      </SelectItem>
                      <SelectItem value="ADMIN" className="text-white hover:bg-neutral-700">
                        Administrateur
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-neutral-500">
                    Rôle attribué automatiquement lors de l'inscription
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Language Settings */}
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Languages className="w-5 h-5 text-indigo-500" />
                  Langues
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  Configuration des langues disponibles sur la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Langue par défaut</label>
                  <Select
                    value={settings?.defaultLanguage || "fr"}
                    onValueChange={(value) => updateSetting("defaultLanguage", value)}
                  >
                    <SelectTrigger className="w-64 bg-neutral-800 border-neutral-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      <SelectItem value="fr" className="text-white hover:bg-neutral-700">
                        🇫🇷 Français
                      </SelectItem>
                      <SelectItem value="en" className="text-white hover:bg-neutral-700">
                        🇬🇧 English
                      </SelectItem>
                      <SelectItem value="es" className="text-white hover:bg-neutral-700">
                        🇪🇸 Español
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="bg-neutral-700" />

                <div className="space-y-3">
                  <label className="text-sm font-medium text-white">Ajouter une nouvelle langue</label>
                  <div className="flex gap-2">
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (value && !availableLanguages.includes(value)) {
                          const newLangs = [...availableLanguages, value]
                          setAvailableLanguages(newLangs)
                          updateSetting("availableLanguages", JSON.stringify(newLangs))
                        }
                      }}
                    >
                      <SelectTrigger className="w-48 bg-neutral-800 border-neutral-600 text-white">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700">
                        <SelectItem value="fr" className="text-white hover:bg-neutral-700" disabled={availableLanguages.includes('fr')}>
                          🇫🇷 Français
                        </SelectItem>
                        <SelectItem value="en" className="text-white hover:bg-neutral-700" disabled={availableLanguages.includes('en')}>
                          🇬🇧 English
                        </SelectItem>
                        <SelectItem value="es" className="text-white hover:bg-neutral-700" disabled={availableLanguages.includes('es')}>
                          🇪🇸 Español
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Active Languages */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {availableLanguages.map((lang) => {
                      const langLabels: Record<string, { name: string; flag: string }> = {
                        fr: { name: 'Français', flag: '🇫🇷' },
                        en: { name: 'English', flag: '🇬🇧' },
                        es: { name: 'Español', flag: '🇪🇸' },
                      }
                      const info = langLabels[lang] || { name: lang, flag: '🌐' }
                      const isDefault = settings?.defaultLanguage === lang
                      
                      return (
                        <div
                          key={lang}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                            isDefault 
                              ? 'bg-orange-500/20 border-orange-500 text-orange-400' 
                              : 'bg-neutral-800 border-neutral-700 text-white'
                          }`}
                        >
                          <span>{info.flag}</span>
                          <span>{info.name}</span>
                          {isDefault && (
                            <Badge className="bg-orange-500 text-white text-xs ml-1">
                              Défaut
                            </Badge>
                          )}
                          {!isDefault && availableLanguages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newLangs = availableLanguages.filter(l => l !== lang)
                                setAvailableLanguages(newLangs)
                                updateSetting("availableLanguages", JSON.stringify(newLangs))
                              }}
                              className="text-neutral-500 hover:text-red-400 ml-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Currency Settings */}
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Euro className="w-5 h-5 text-green-500" />
                  Devise
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  Configuration de la devise pour les paiements et tarifs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Devise par défaut</label>
                  <Select
                    value={settings?.defaultCurrency || "EUR"}
                    onValueChange={(value) => updateSetting("defaultCurrency", value)}
                  >
                    <SelectTrigger className="w-64 bg-neutral-800 border-neutral-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      <SelectItem value="EUR" className="text-white hover:bg-neutral-700">
                        € Euro (EUR)
                      </SelectItem>
                      <SelectItem value="USD" className="text-white hover:bg-neutral-700">
                        $ Dollar US (USD)
                      </SelectItem>
                      <SelectItem value="GBP" className="text-white hover:bg-neutral-700">
                        £ Livre Sterling (GBP)
                      </SelectItem>
                      <SelectItem value="CHF" className="text-white hover:bg-neutral-700">
                        CHF Franc Suisse
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-400">
                    Les montants sont affichés au format européen : <strong>1 234,56 €</strong>
                    <br />
                    (espace comme séparateur de milliers, virgule pour les décimales)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* reCAPTCHA */}
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-500" />
                      Google reCAPTCHA v3
                    </CardTitle>
                    <CardDescription className="text-neutral-400">
                      Protection contre les bots et les spams
                    </CardDescription>
                  </div>
                  <Switch
                    checked={settings?.enableRecaptcha || false}
                    onCheckedChange={(checked) => updateSetting("enableRecaptcha", checked)}
                  />
                </div>
              </CardHeader>
              {settings?.enableRecaptcha && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Site Key</label>
                      <Input
                        value={settings?.recaptchaSiteKey || ""}
                        onChange={(e) => updateSetting("recaptchaSiteKey", e.target.value)}
                        placeholder="6Lc..."
                        className="bg-neutral-800 border-neutral-600 text-white font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Secret Key</label>
                      <Input
                        type="password"
                        value={settings?.recaptchaSecretKey || ""}
                        onChange={(e) => updateSetting("recaptchaSecretKey", e.target.value)}
                        placeholder="6Lc..."
                        className="bg-neutral-800 border-neutral-600 text-white font-mono"
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Google Analytics */}
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Globe className="w-5 h-5 text-green-500" />
                      Google Analytics
                    </CardTitle>
                    <CardDescription className="text-neutral-400">
                      Suivi des visites et analyses de trafic
                    </CardDescription>
                  </div>
                  <Switch
                    checked={settings?.enableAnalytics || false}
                    onCheckedChange={(checked) => updateSetting("enableAnalytics", checked)}
                  />
                </div>
              </CardHeader>
              {settings?.enableAnalytics && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">ID Google Analytics</label>
                    <Input
                      value={settings?.analyticsId || ""}
                      onChange={(e) => updateSetting("analyticsId", e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                      className="bg-neutral-800 border-neutral-600 text-white font-mono w-64"
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* ==================== INTEGRATIONS TAB ==================== */}
          <TabsContent value="integrations" className="space-y-6">
            {/* OAuth Master Toggle */}
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Link2 className="w-5 h-5 text-purple-500" />
                      Connexion via les Réseaux Sociaux (OAuth)
                    </CardTitle>
                    <CardDescription className="text-neutral-400">
                      Autoriser les utilisateurs à se connecter via leur compte social
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={settings?.oauthEnabled ? "default" : "secondary"} className={settings?.oauthEnabled ? "bg-green-500" : ""}>
                      {settings?.oauthEnabled ? "Activé" : "Désactivé"}
                    </Badge>
                    {/* Custom Toggle Button */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings?.oauthEnabled || false}
                      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-neutral-900 ${
                        settings?.oauthEnabled ? 'bg-green-500' : 'bg-neutral-600'
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        updateSetting("oauthEnabled", !settings?.oauthEnabled)
                      }}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settings?.oauthEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Individual OAuth Providers */}
            {OAUTH_PROVIDERS.map((provider) => {
              const isEnabled = oauthProviders[provider.id]?.enabled
              
              return (
                <Card key={provider.id} className={`bg-neutral-900 border-neutral-700 ${!settings?.oauthEnabled ? 'opacity-50' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{provider.icon}</span>
                        <div>
                          <CardTitle className="text-white">{provider.name}</CardTitle>
                          <CardDescription className="text-neutral-400">
                            Configuration OAuth pour {provider.name}
                          </CardDescription>
                        </div>
                      </div>
                      {/* Custom Toggle Button */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isEnabled || false}
                        disabled={!settings?.oauthEnabled}
                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-neutral-900 ${
                          isEnabled ? 'bg-green-500' : 'bg-neutral-600'
                        } ${!settings?.oauthEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (settings?.oauthEnabled) {
                            updateOAuthProvider(provider.id, "enabled", !isEnabled)
                          }
                        }}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </CardHeader>
                  {isEnabled && settings?.oauthEnabled && (
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white">{provider.name} API Key</label>
                        <Input
                          value={oauthProviders[provider.id]?.apiKey || ""}
                          onChange={(e) => updateOAuthProvider(provider.id, "apiKey", e.target.value)}
                          placeholder="Votre API Key"
                          className="bg-neutral-800 border-neutral-600 text-white font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white">{provider.name} API Secret Key</label>
                        <div className="relative">
                          <Input
                            type={showApiKeys[`${provider.id}_secret`] ? "text" : "password"}
                            value={oauthProviders[provider.id]?.apiSecret || ""}
                            onChange={(e) => updateOAuthProvider(provider.id, "apiSecret", e.target.value)}
                            placeholder="Votre Secret Key"
                            className="bg-neutral-800 border-neutral-600 text-white font-mono pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKeys(prev => ({ ...prev, [`${provider.id}_secret`]: !prev[`${provider.id}_secret`] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                          >
                            {showApiKeys[`${provider.id}_secret`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">{provider.name} Redirect URL</label>
                      <div className="flex gap-2">
                        <Input
                          value={oauthProviders[provider.id]?.redirectUrl || `${settings?.siteUrl}/auth/callback/${provider.id}`}
                          onChange={(e) => updateOAuthProvider(provider.id, "redirectUrl", e.target.value)}
                          className="bg-neutral-800 border-neutral-600 text-white font-mono"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-neutral-600 shrink-0"
                          onClick={() => copyToClipboard(oauthProviders[provider.id]?.redirectUrl || `${settings?.siteUrl}/auth/callback/${provider.id}`)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-neutral-500">
                        Configurez cette URL dans votre console développeur {provider.name}
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
            })}

            {/* OAuth Info */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-blue-400">Configuration OAuth</p>
                  <p className="text-sm text-blue-400/70">
                    Pour chaque réseau social, vous devez créer une application dans la console développeur du fournisseur 
                    et configurer l'URL de redirection indiquée ci-dessus.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ==================== API TAB ==================== */}
          <TabsContent value="api" className="space-y-6">
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Fournisseurs IA
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  Configurez vos clés API pour les services d'intelligence artificielle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {AI_PROVIDERS.map((provider) => {
                  const keyMap: Record<string, keyof SiteSettings> = {
                    zai: 'zaiApiKey',
                    openai: 'openaiApiKey',
                    anthropic: 'anthropicApiKey',
                    googleAi: 'googleAiApiKey',
                    mistral: 'mistralApiKey',
                    replicate: 'replicateApiKey',
                    stability: 'stabilityApiKey',
                  }
                  const settingKey = keyMap[provider.id]
                  const hasKey = settings?.[settingKey] && settings[settingKey]!.length > 0
                  
                  return (
                    <div key={provider.id} className="p-4 bg-neutral-800 border border-neutral-700 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{provider.icon}</span>
                          <div>
                            <p className="font-medium text-white">{provider.name}</p>
                            <p className="text-sm text-neutral-500">{provider.description}</p>
                          </div>
                        </div>
                        {hasKey ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <Check className="w-3 h-3 mr-1" />
                            Configuré
                          </Badge>
                        ) : (
                          <Badge className="bg-neutral-500/20 text-neutral-400 border-neutral-500/30">
                            Non configuré
                          </Badge>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          type={showApiKeys[provider.id] ? "text" : "password"}
                          value={(settings?.[settingKey] as string) || ""}
                          onChange={(e) => updateSetting(settingKey, e.target.value)}
                          placeholder={`Entrez votre clé API ${provider.name}`}
                          className="bg-neutral-700 border-neutral-600 text-white font-mono pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKeys(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                        >
                          {showApiKeys[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Security Warning */}
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-yellow-400">Sécurité des clés API</p>
                  <p className="text-sm text-yellow-400/70">
                    Vos clés API sont stockées de manière sécurisée dans la base de données. 
                    Ne partagez jamais vos clés avec des tiers et faites une rotation régulière de vos clés.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ==================== EMAIL TAB ==================== */}
          <TabsContent value="email" className="space-y-6">
            {/* Email Master Toggle */}
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Mail className="w-5 h-5 text-cyan-500" />
                      Configuration Email
                    </CardTitle>
                    <CardDescription className="text-neutral-400">
                      Service d'envoi d'emails pour les notifications
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={settings?.emailEnabled ? "bg-green-500 text-white" : "bg-neutral-600 text-neutral-300"}>
                      {settings?.emailEnabled ? "Activé" : "Désactivé"}
                    </Badge>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings?.emailEnabled ?? false}
                      onClick={() => {
                        const newValue = !settings?.emailEnabled
                        console.log('[Settings] Email toggle clicked, new value:', newValue)
                        updateSetting("emailEnabled", newValue)
                        if (newValue && !settings?.emailProvider) {
                          updateSetting("emailProvider", "smtp")
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                        settings?.emailEnabled ? 'bg-orange-500' : 'bg-neutral-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          settings?.emailEnabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Email Provider Selection - Show if enabled */}
            {settings?.emailEnabled === true && (
              <>
                <Card className="bg-neutral-900 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      Fournisseur Email
                    </CardTitle>
                    <CardDescription className="text-neutral-400">
                      Choisissez votre service d'envoi d'emails
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Provider Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      {EMAIL_PROVIDERS.map((provider) => {
                        const isSelected = settings?.emailProvider === provider.id
                        return (
                          <button
                            key={provider.id}
                            type="button"
                            onClick={() => {
                              updateSetting("emailProvider", provider.id)
                              // Apply presets if available
                              if (provider.presets) {
                                Object.entries(provider.presets).forEach(([key, value]) => {
                                  updateSetting(key as keyof SiteSettings, value)
                                })
                              }
                            }}
                            className={`p-4 rounded-lg border transition-all text-left ${
                              isSelected
                                ? 'bg-orange-500/20 border-orange-500 text-white'
                                : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-neutral-500'
                            }`}
                          >
                            <span className="text-2xl mb-2 block">{provider.icon}</span>
                            <p className="font-medium text-sm">{provider.name}</p>
                            <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{provider.description}</p>
                          </button>
                        )
                      })}
                    </div>

                    {/* Provider-specific Settings */}
                    {(() => {
                      const currentProvider = EMAIL_PROVIDERS.find(p => p.id === settings?.emailProvider)
                      if (!currentProvider) return null

                      return (
                        <div className="space-y-4">
                          <Separator className="bg-neutral-700" />
                          
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-xl">{currentProvider.icon}</span>
                            <h3 className="text-lg font-medium text-white">{currentProvider.name}</h3>
                          </div>

                          {/* SMTP Custom / Gmail Settings */}
                          {(currentProvider.id === 'smtp' || currentProvider.id === 'gmail') && (
                            <>
                              {currentProvider.id === 'smtp' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-white">Hôte SMTP</label>
                                    <Input
                                      value={settings?.smtpHost || ""}
                                      onChange={(e) => updateSetting("smtpHost", e.target.value)}
                                      placeholder="smtp.example.com"
                                      className="bg-neutral-800 border-neutral-600 text-white"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-white">Port SMTP</label>
                                    <Input
                                      type="number"
                                      value={settings?.smtpPort || 465}
                                      onChange={(e) => updateSetting("smtpPort", parseInt(e.target.value) || 465)}
                                      placeholder="465"
                                      className="bg-neutral-800 border-neutral-600 text-white"
                                    />
                                  </div>
                                </div>
                              )}
                              
                              {currentProvider.id === 'gmail' && (
                                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-4">
                                  <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                                    <div>
                                      <p className="font-medium text-blue-400">Configuration Gmail</p>
                                      <p className="text-sm text-blue-400/70">
                                        Pour utiliser Gmail, vous devez créer un "mot de passe d'application" dans votre compte Google.
                                        Allez dans Sécurité &gt; Authentification à deux facteurs &gt; Mots de passe des applications.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-white">
                                    {currentProvider.id === 'gmail' ? 'Adresse Gmail' : 'Nom d\'utilisateur SMTP'}
                                  </label>
                                  <Input
                                    value={settings?.smtpUser || ""}
                                    onChange={(e) => updateSetting("smtpUser", e.target.value)}
                                    placeholder={currentProvider.id === 'gmail' ? "votre.email@gmail.com" : "user@example.com"}
                                    className="bg-neutral-800 border-neutral-600 text-white"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-white">
                                    {currentProvider.id === 'gmail' ? 'Mot de passe d\'application' : 'Mot de passe SMTP'}
                                  </label>
                                  <Input
                                    type="password"
                                    value={settings?.smtpPassword || ""}
                                    onChange={(e) => updateSetting("smtpPassword", e.target.value)}
                                    placeholder="••••••••••••••"
                                    className="bg-neutral-800 border-neutral-600 text-white"
                                  />
                                </div>
                              </div>

                              {currentProvider.id === 'smtp' && (
                                <div className="space-y-3">
                                  <label className="text-sm font-medium text-white">Chiffrement SMTP</label>
                                  <Select
                                    value={settings?.smtpEncryption || "ssl"}
                                    onValueChange={(value) => updateSetting("smtpEncryption", value)}
                                  >
                                    <SelectTrigger className="w-full md:w-64 bg-neutral-800 border-neutral-600 text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-neutral-800 border-neutral-700">
                                      <SelectItem value="ssl" className="text-white hover:bg-neutral-700">
                                        🔒 SSL (recommandé)
                                      </SelectItem>
                                      <SelectItem value="tls" className="text-white hover:bg-neutral-700">
                                        🔐 TLS / STARTTLS
                                      </SelectItem>
                                      <SelectItem value="none" className="text-white hover:bg-neutral-700">
                                        ⚠️ Aucun (non sécurisé)
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <p className="text-xs text-neutral-500">
                                    Port 465 utilise généralement SSL, port 587 utilise généralement TLS/STARTTLS
                                  </p>
                                </div>
                              )}
                            </>
                          )}

                          {/* SendGrid Settings */}
                          {currentProvider.id === 'sendgrid' && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Clé API SendGrid</label>
                                <div className="relative">
                                  <Input
                                    type={showApiKeys['sendgrid'] ? "text" : "password"}
                                    value={settings?.sendgridApiKey || ""}
                                    onChange={(e) => updateSetting("sendgridApiKey", e.target.value)}
                                    placeholder="SG.xxxxxxxxxxxxxxxx"
                                    className="bg-neutral-800 border-neutral-600 text-white font-mono pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowApiKeys(prev => ({ ...prev, ['sendgrid']: !prev['sendgrid'] }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                                  >
                                    {showApiKeys['sendgrid'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Brevo Settings */}
                          {currentProvider.id === 'brevo' && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Clé API Brevo</label>
                                <div className="relative">
                                  <Input
                                    type={showApiKeys['brevo'] ? "text" : "password"}
                                    value={settings?.brevoApiKey || ""}
                                    onChange={(e) => updateSetting("brevoApiKey", e.target.value)}
                                    placeholder="xkeysib-xxxxxxxxxxxxxxxx"
                                    className="bg-neutral-800 border-neutral-600 text-white font-mono pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowApiKeys(prev => ({ ...prev, ['brevo']: !prev['brevo'] }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                                  >
                                    {showApiKeys['brevo'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Mailchimp Settings */}
                          {currentProvider.id === 'mailchimp' && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Clé API Mailchimp</label>
                                <div className="relative">
                                  <Input
                                    type={showApiKeys['mailchimp'] ? "text" : "password"}
                                    value={settings?.mailchimpApiKey || ""}
                                    onChange={(e) => updateSetting("mailchimpApiKey", e.target.value)}
                                    placeholder="xxxxxxxxxxxxxxxx-us1"
                                    className="bg-neutral-800 border-neutral-600 text-white font-mono pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowApiKeys(prev => ({ ...prev, ['mailchimp']: !prev['mailchimp'] }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                                  >
                                    {showApiKeys['mailchimp'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Amazon SES Settings */}
                          {currentProvider.id === 'amazon_ses' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Access Key ID</label>
                                <Input
                                  type="password"
                                  value={settings?.amazonSesApiKey || ""}
                                  onChange={(e) => updateSetting("amazonSesApiKey", e.target.value)}
                                  placeholder="AKIAIOSFODNN7EXAMPLE"
                                  className="bg-neutral-800 border-neutral-600 text-white font-mono"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Secret Access Key</label>
                                <Input
                                  type="password"
                                  value={settings?.amazonSesSecretKey || ""}
                                  onChange={(e) => updateSetting("amazonSesSecretKey", e.target.value)}
                                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                                  className="bg-neutral-800 border-neutral-600 text-white font-mono"
                                />
                              </div>
                            </div>
                          )}

                          {/* Mailgun Settings */}
                          {currentProvider.id === 'mailgun' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Clé API Mailgun</label>
                                <Input
                                  type="password"
                                  value={settings?.mailgunApiKey || ""}
                                  onChange={(e) => updateSetting("mailgunApiKey", e.target.value)}
                                  placeholder="key-xxxxxxxxxxxxxxxx"
                                  className="bg-neutral-800 border-neutral-600 text-white font-mono"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Domaine</label>
                                <Input
                                  value={settings?.mailgunDomain || ""}
                                  onChange={(e) => updateSetting("mailgunDomain", e.target.value)}
                                  placeholder="mg.example.com"
                                  className="bg-neutral-800 border-neutral-600 text-white"
                                />
                              </div>
                            </div>
                          )}

                          {/* Postmark Settings */}
                          {currentProvider.id === 'postmark' && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Clé API Postmark</label>
                                <div className="relative">
                                  <Input
                                    type={showApiKeys['postmark'] ? "text" : "password"}
                                    value={settings?.postmarkApiKey || ""}
                                    onChange={(e) => updateSetting("postmarkApiKey", e.target.value)}
                                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                    className="bg-neutral-800 border-neutral-600 text-white font-mono pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowApiKeys(prev => ({ ...prev, ['postmark']: !prev['postmark'] }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                                  >
                                    {showApiKeys['postmark'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          <Separator className="bg-neutral-700" />

                          {/* Common: From Email and Name */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-white">Adresse email de l'expéditeur</label>
                              <Input
                                value={settings?.smtpFromEmail || ""}
                                onChange={(e) => updateSetting("smtpFromEmail", e.target.value)}
                                placeholder="noreply@example.com"
                                className="bg-neutral-800 border-neutral-600 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-white">Nom de l'expéditeur</label>
                              <Input
                                value={settings?.smtpFromName || ""}
                                onChange={(e) => updateSetting("smtpFromName", e.target.value)}
                                placeholder="Mon Entreprise"
                                className="bg-neutral-800 border-neutral-600 text-white"
                              />
                            </div>
                          </div>

                          {/* Test Email */}
                          <div className="p-4 bg-neutral-800 border border-neutral-700 rounded-lg">
                            <p className="font-medium text-white mb-2">Tester la configuration</p>
                            <p className="text-sm text-neutral-500 mb-4">Envoyer un email de test pour vérifier les paramètres</p>
                            <div className="flex gap-3">
                              <Input
                                type="email"
                                placeholder="email@exemple.com"
                                value={testEmailTo}
                                onChange={(e) => setTestEmailTo(e.target.value)}
                                className="bg-neutral-700 border-neutral-600 text-white flex-1"
                              />
                              <Button 
                                variant="outline" 
                                className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                                onClick={handleSendTestEmail}
                                disabled={sendingTestEmail || !settings?.emailEnabled}
                              >
                                {sendingTestEmail ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Envoi...
                                  </>
                                ) : (
                                  <>
                                    <Mail className="w-4 h-4 mr-2" />
                                    Envoyer
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
            
            {/* Email Templates */}
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-500" />
                  Modèles d'emails
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  Personnalisez les emails envoyés automatiquement
                </CardDescription>
              </CardHeader>
              <CardContent>
                {editingTemplate ? (
                  // Template Editor
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-white">
                        {getTemplateLabel(editingTemplate.type)}
                      </h3>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-neutral-600 text-neutral-300"
                          onClick={() => setEditingTemplate(null)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Annuler
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                          onClick={handleSaveTemplate}
                          disabled={savingTemplate}
                        >
                          {savingTemplate ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Enregistrer
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Sujet</label>
                      <Input
                        value={editingTemplate.subject}
                        onChange={(e) => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                        className="bg-neutral-800 border-neutral-600 text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Contenu (HTML)</label>
                      <Textarea
                        value={editingTemplate.body}
                        onChange={(e) => setEditingTemplate({...editingTemplate, body: e.target.value})}
                        rows={12}
                        className="bg-neutral-800 border-neutral-600 text-white font-mono text-sm"
                      />
                    </div>
                    
                    {editingTemplate.variables && (
                      <div className="p-3 bg-neutral-800 border border-neutral-700 rounded-lg">
                        <p className="text-sm font-medium text-white mb-2">Variables disponibles</p>
                        <div className="flex flex-wrap gap-2">
                          {JSON.parse(editingTemplate.variables).map((variable: string) => (
                            <Badge key={variable} variant="outline" className="border-purple-500/30 text-purple-400">
                              {`{{${variable}}}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between p-3 bg-neutral-800 border border-neutral-700 rounded-lg">
                      <div>
                        <p className="font-medium text-white">Statut</p>
                        <p className="text-sm text-neutral-500">Activer ou désactiver ce modèle</p>
                      </div>
                      <Switch
                        checked={editingTemplate.isActive}
                        onCheckedChange={(checked) => setEditingTemplate({...editingTemplate, isActive: checked})}
                      />
                    </div>
                  </div>
                ) : (
                  // Templates List
                  <div className="space-y-3">
                    {emailTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-3 bg-neutral-800 border border-neutral-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-white">{getTemplateLabel(template.type)}</p>
                            <p className="text-sm text-neutral-500">{getTemplateDesc(template.type)}</p>
                          </div>
                          <Badge className={template.isActive ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-neutral-500/20 text-neutral-400 border-neutral-500/30"}>
                            {template.isActive ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-neutral-600 text-neutral-300"
                          onClick={() => setEditingTemplate(template)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </Button>
                      </div>
                    ))}
                    
                    {emailTemplates.length === 0 && (
                      <div className="text-center py-8 text-neutral-500">
                        <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Aucun modèle d'email configuré</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
              </>
            )}
          </TabsContent>

          {/* ==================== SECURITY TAB ==================== */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-500" />
                  Authentification à Deux Facteurs
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  Renforcez la sécurité des comptes administrateurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Exiger le 2FA pour les administrateurs</p>
                    <p className="text-sm text-neutral-500">Les administrateurs devront configurer le 2FA à leur prochaine connexion</p>
                  </div>
                  <Switch
                    checked={settings?.twoFactorEnabled || false}
                    onCheckedChange={(checked) => updateSetting("twoFactorEnabled", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-orange-500" />
                      Limitation de Taux (Rate Limiting)
                    </CardTitle>
                    <CardDescription className="text-neutral-400">
                      Protégez votre API contre les abus
                    </CardDescription>
                  </div>
                  <Switch
                    checked={settings?.rateLimitEnabled || false}
                    onCheckedChange={(checked) => updateSetting("rateLimitEnabled", checked)}
                  />
                </div>
              </CardHeader>
              {settings?.rateLimitEnabled && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Requêtes max par fenêtre</label>
                      <Input
                        type="number"
                        value={settings?.rateLimitRequests || ""}
                        onChange={(e) => updateSetting("rateLimitRequests", parseInt(e.target.value))}
                        className="bg-neutral-800 border-neutral-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Fenêtre (secondes)</label>
                      <Input
                        type="number"
                        value={settings?.rateLimitWindow || ""}
                        onChange={(e) => updateSetting("rateLimitWindow", parseInt(e.target.value))}
                        className="bg-neutral-800 border-neutral-600 text-white"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-neutral-500">
                    Actuellement: {settings?.rateLimitRequests || 60} requêtes par {settings?.rateLimitWindow || 60} secondes
                  </p>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* ==================== LEGAL TAB ==================== */}
          <TabsContent value="legal" className="space-y-6">
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Cookie className="w-5 h-5 text-amber-500" />
                      Cookies GDPR
                    </CardTitle>
                    <CardDescription className="text-neutral-400">
                      Gestion du consentement des cookies (RGPD)
                    </CardDescription>
                  </div>
                  <Switch
                    checked={settings?.gdprEnabled || false}
                    onCheckedChange={(checked) => updateSetting("gdprEnabled", checked)}
                  />
                </div>
              </CardHeader>
              {settings?.gdprEnabled && (
                <CardContent className="space-y-4">
                  <div className="space-y-2 max-w-xs">
                    <label className="text-sm font-medium text-white">
                      Date de validité des Cookies (en jours)
                    </label>
                    <Input
                      type="number"
                      value={settings?.cookieValidityDays || 7}
                      onChange={(e) => updateSetting("cookieValidityDays", parseInt(e.target.value) || 7)}
                      min={1}
                      max={365}
                      className="bg-neutral-800 border-neutral-600 text-white"
                    />
                    <p className="text-xs text-neutral-500">
                      Durée pendant laquelle le consentement cookies reste valide (par défaut: 7 jours)
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>

            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-purple-500" />
                  Conformité RGPD
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  Informations sur la conformité au règlement européen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-neutral-800 border border-neutral-700 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Checklist RGPD</h4>
                  <ul className="space-y-2 text-sm text-neutral-400">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Bannière de consentement cookies
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Page de politique de confidentialité
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Droit à l'oubli (suppression de compte)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Export des données personnelles
                    </li>
                  </ul>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-blue-400">Rappel</p>
                      <p className="text-sm text-blue-400/70">
                        Assurez-vous de configurer vos pages légales dans l'onglet "Pages Légales" pour être en conformité.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== LEGAL PAGES TAB ==================== */}
          <TabsContent value="legal-pages" className="space-y-6">
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-500" />
                  Éditeur de Pages Légales
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  Créez et modifiez vos documents juridiques
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Page Type Selector */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'cgv', label: 'CGV', icon: '📄' },
                    { id: 'mentions_legales', label: 'Mentions Légales', icon: '📋' },
                    { id: 'gdpr', label: 'RGPD', icon: '🔒' },
                    { id: 'privacy', label: 'Confidentialité', icon: '🛡️' },
                  ].map((page) => {
                    const exists = legalPages.some(p => p.type === page.id)
                    return (
                      <button
                        key={page.id}
                        onClick={() => handleLegalPageSelect(page.id)}
                        className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                          activeLegalPage === page.id
                            ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                            : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-500'
                        }`}
                      >
                        <span>{page.icon}</span>
                        {page.label}
                        {exists && (
                          <Badge className="bg-green-500/20 text-green-400 text-xs ml-1">
                            <Check className="w-3 h-3" />
                          </Badge>
                        )}
                      </button>
                    )
                  })}
                </div>

                <Separator className="bg-neutral-700" />

                {/* Editor */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Titre de la page</label>
                    <Input
                      value={legalPageContent.title}
                      onChange={(e) => setLegalPageContent(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Titre de la page"
                      className="bg-neutral-800 border-neutral-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Contenu (HTML autorisé)</label>
                    <Textarea
                      value={legalPageContent.content}
                      onChange={(e) => setLegalPageContent(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Rédigez le contenu de votre page légale ici..."
                      className="bg-neutral-800 border-neutral-600 text-white min-h-[400px] font-mono text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-500">
                      Dernière modification: {legalPages.find(p => p.type === activeLegalPage)?.updatedAt 
                        ? new Date(legalPages.find(p => p.type === activeLegalPage)!.updatedAt).toLocaleDateString('fr-FR')
                        : 'Jamais'}
                    </p>
                    <Button
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={handleSaveLegalPage}
                      disabled={savingLegalPage || !legalPageContent.title}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {savingLegalPage ? "Sauvegarde..." : "Sauvegarder la page"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Legal Pages Status */}
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-white">Statut des Pages</CardTitle>
                <CardDescription className="text-neutral-400">
                  Vue d'ensemble de vos documents juridiques
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'cgv', label: 'Conditions Générales de Vente' },
                    { id: 'mentions_legales', label: 'Mentions Légales' },
                    { id: 'gdpr', label: 'Politique RGPD' },
                    { id: 'privacy', label: 'Politique de Confidentialité' },
                  ].map((page) => {
                    const exists = legalPages.some(p => p.type === page.id)
                    return (
                      <div
                        key={page.id}
                        className={`p-4 rounded-lg border ${
                          exists
                            ? 'bg-green-500/10 border-green-500/30'
                            : 'bg-red-500/10 border-red-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white">{page.label}</span>
                          {exists ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              <Check className="w-3 h-3 mr-1" />
                              Configurée
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Manquante
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== MAINTENANCE TAB ==================== */}
          <TabsContent value="maintenance" className="space-y-6">
            <Card className="bg-neutral-900 border-neutral-700 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-red-500" />
                  Mode Maintenance
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  Mettre le site en maintenance (accessible uniquement aux administrateurs)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Toggle principal très visible */}
                <div className="flex items-center justify-between p-6 bg-neutral-800 border-2 border-neutral-600 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${settings?.maintenanceMode ? 'bg-red-500/30 animate-pulse' : 'bg-green-500/30'}`}>
                      {settings?.maintenanceMode ? (
                        <AlertCircle className="w-6 h-6 text-red-400" />
                      ) : (
                        <Check className="w-6 h-6 text-green-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">
                        {settings?.maintenanceMode ? "🚧 Maintenance Activée" : "✅ Site en ligne"}
                      </p>
                      <p className="text-sm text-neutral-400">
                        {settings?.maintenanceMode 
                          ? "Seuls les admins peuvent accéder au site" 
                          : "Le site est accessible à tous"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Bouton Toggle personnalisé très visible */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings?.maintenanceMode || false}
                      onClick={() => updateSetting("maintenanceMode", !settings?.maintenanceMode)}
                      className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800 ${
                        settings?.maintenanceMode 
                          ? 'bg-red-500 focus:ring-red-500' 
                          : 'bg-green-500 focus:ring-green-500'
                      }`}
                    >
                      <span className="sr-only">Activer/Désactiver la maintenance</span>
                      <span
                        className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                          settings?.maintenanceMode ? 'translate-x-11' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                {settings?.maintenanceMode && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Message de maintenance</label>
                      <Input
                        value={settings?.maintenanceMessage || ""}
                        onChange={(e) => updateSetting("maintenanceMessage", e.target.value)}
                        placeholder="Le site est en maintenance. Veuillez réessayer plus tard."
                        className="bg-neutral-800 border-neutral-600 text-white"
                      />
                    </div>
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-red-400">Attention</p>
                          <p className="text-sm text-red-400/70">
                            Le mode maintenance est activé. Seuls les administrateurs peuvent accéder au site. 
                            Les autres utilisateurs verront le message de maintenance.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-white">Actions Système</CardTitle>
                <CardDescription className="text-neutral-400">
                  Actions de maintenance avancées
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-neutral-800 border border-neutral-700 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Vider le cache</p>
                    <p className="text-sm text-neutral-500">Effacer le cache de l'application</p>
                  </div>
                  <Button variant="outline" className="border-neutral-600 text-neutral-300">
                    Vider
                  </Button>
                </div>
                <div className="p-4 bg-neutral-800 border border-neutral-700 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Exporter les logs</p>
                    <p className="text-sm text-neutral-500">Télécharger les logs système</p>
                  </div>
                  <Button variant="outline" className="border-neutral-600 text-neutral-300">
                    Exporter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
