"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Cpu,
  Settings,
  RotateCcw,
  Play,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Layers,
  Thermometer,
  Image as ImageIcon,
  FileText,
  Palette,
  Share2,
  Clapperboard,
  TrendingUp,
  Target,
  Loader2,
  Cloud,
  CloudOff,
  RefreshCw,
  Bot,
  Brain,
  Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n"
import type { OrchestrationConfig, AgentCategory } from "@/lib/types"

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  orange: { bg: 'bg-orange-500/20', text: 'text-orange-500', border: 'border-orange-500/30' },
  cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-500', border: 'border-cyan-500/30' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-500', border: 'border-purple-500/30' },
  green: { bg: 'bg-green-500/20', text: 'text-green-500', border: 'border-green-500/30' },
  pink: { bg: 'bg-pink-500/20', text: 'text-pink-500', border: 'border-pink-500/30' },
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-500', border: 'border-blue-500/30' },
  red: { bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500/30' },
}

const CATEGORY_ICONS: Record<string, any> = {
  Bot,
  Brain,
  Layers,
  Clapperboard,
  TrendingUp,
  Target,
  Zap,
}

type SyncStatus = 'synced' | 'syncing' | 'error' | 'pending'

export default function OrchestratorPage() {
  const { t } = useTranslation()
  const { locale } = useTranslation()
  const { toast } = useToast()
  const [config, setConfig] = useState<OrchestrationConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced')
  const [expandedCategory, setExpandedCategory] = useState<string | null>('content-studio')
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch config from API
  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/orchestrator')
      if (!response.ok) throw new Error('Failed to fetch config')
      const data = await response.json()
      console.log('[Orchestrator] Fetched config:', data)
      setConfig(data)
      setSyncStatus('synced')
    } catch (error) {
      console.error('Fetch error:', error)
      setSyncStatus('error')
      toast({
        title: t('common.error'),
        description: 'Failed to load orchestration config',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast, t])

  // Save config to API
  const saveConfig = useCallback(async (configToSave: OrchestrationConfig) => {
    console.log('[Orchestrator] Saving config:', configToSave.id, configToSave.categories.map(c => ({ id: c.id, enabled: c.enabled })))
    
    try {
      setSyncStatus('syncing')
      
      const response = await fetch('/api/orchestrator', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: configToSave.id,
          name: configToSave.name,
          categories: configToSave.categories
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('[Orchestrator] Save error response:', errorData)
        throw new Error('Failed to save config')
      }
      
      const updated = await response.json()
      console.log('[Orchestrator] Saved successfully:', updated.categories.map((c: AgentCategory) => ({ id: c.id, enabled: c.enabled })))
      
      setSyncStatus('synced')
      
      toast({
        title: t('common.success'),
        description: t('orchestrator.configSaved') || 'Configuration saved',
        duration: 2000
      })
    } catch (error) {
      console.error('Save error:', error)
      setSyncStatus('error')
      toast({
        title: t('common.error'),
        description: 'Failed to save configuration',
        variant: 'destructive'
      })
    }
  }, [toast, t])

  // Debounced save for slider/typing (500ms delay)
  const debouncedSave = useCallback((configToSave: OrchestrationConfig) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    setSyncStatus('pending')
    
    saveTimeoutRef.current = setTimeout(() => {
      saveConfig(configToSave)
    }, 500)
  }, [saveConfig])

  useEffect(() => {
    fetchConfig()
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [fetchConfig])

  // Toggle category - updates local state AND saves to DB
  const handleToggleCategory = useCallback((categoryId: string, newEnabled: boolean) => {
    if (!config) {
      console.log('[Orchestrator] No config, cannot toggle category')
      return
    }
    
    console.log('[Orchestrator] Toggling category:', categoryId, 'to', newEnabled)
    
    // Create updated config
    const updatedCategories = config.categories.map(cat =>
      cat.id === categoryId ? { ...cat, enabled: newEnabled } : cat
    )
    
    const newConfig: OrchestrationConfig = {
      ...config,
      categories: updatedCategories
    }
    
    console.log('[Orchestrator] New config categories:', updatedCategories.map(c => ({ id: c.id, enabled: c.enabled })))
    
    // Update local state immediately
    setConfig(newConfig)
    
    // Clear any pending saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Save to DB
    saveConfig(newConfig)
  }, [config, saveConfig])

  // Toggle agent - updates local state AND saves to DB
  const handleToggleAgent = useCallback((categoryId: string, agentId: string, newEnabled: boolean) => {
    if (!config) return
    
    console.log('[Orchestrator] Toggling agent:', agentId, 'in category', categoryId, 'to', newEnabled)
    
    const updatedCategories = config.categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          agents: cat.agents.map(agent =>
            agent.id === agentId ? { ...agent, enabled: newEnabled } : agent
          )
        }
      }
      return cat
    })
    
    const newConfig: OrchestrationConfig = {
      ...config,
      categories: updatedCategories
    }
    
    setConfig(newConfig)
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveConfig(newConfig)
  }, [config, saveConfig])

  // Update agent field (for sliders, inputs, etc.)
  const updateAgentField = (categoryId: string, agentId: string, field: string, value: unknown) => {
    if (!config) return
    
    const updatedCategories = config.categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          agents: cat.agents.map(agent =>
            agent.id === agentId ? { ...agent, [field]: value } : agent
          )
        }
      }
      return cat
    })
    
    const newConfig: OrchestrationConfig = {
      ...config,
      categories: updatedCategories
    }
    
    setConfig(newConfig)
    debouncedSave(newConfig)
  }

  // Reset to server version
  const resetConfig = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    await fetchConfig()
  }

  const getCategoryIcon = (iconName: string) => CATEGORY_ICONS[iconName] || Layers
  const getCategoryColor = (color: string) => CATEGORY_COLORS[color] || CATEGORY_COLORS.orange

  const getTotalAgents = () => config?.categories.reduce((acc, cat) => acc + cat.agents.length, 0) || 0
  const getEnabledAgents = () => config?.categories.reduce((acc, cat) => acc + cat.agents.filter(a => a.enabled).length, 0) || 0

  // Sync status indicator
  const SyncIndicator = () => {
    const statusConfig = {
      synced: { icon: Cloud, color: 'text-green-500', bg: 'bg-green-500/20', label: t('orchestrator.synced') || 'Synchronisé' },
      syncing: { icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-500/20', label: t('orchestrator.syncing') || 'Synchronisation...', animate: true },
      error: { icon: CloudOff, color: 'text-red-500', bg: 'bg-red-500/20', label: t('orchestrator.syncError') || 'Erreur de sync' },
      pending: { icon: RefreshCw, color: 'text-yellow-500', bg: 'bg-yellow-500/20', label: t('orchestrator.pending') || 'En attente...' },
    }
    
    const { icon: Icon, color, bg, label, animate } = statusConfig[syncStatus]
    
    return (
      <Badge className={`${bg} ${color} border-0 flex items-center gap-1.5`}>
        <Icon className={`w-3.5 h-3.5 ${animate ? 'animate-spin' : ''}`} />
        {label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
          <p className="text-neutral-400">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-black p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-400">{t('common.error')}</p>
          <Button onClick={fetchConfig} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('common.retry') || 'Retry'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Cpu className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('orchestrator.title')}</h1>
              <p className="text-neutral-400">
                {getEnabledAgents()} {t('orchestrator.activeAgents')} {getTotalAgents()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SyncIndicator />
            {syncStatus === 'error' && (
              <Button
                variant="outline"
                className="border-neutral-600 text-neutral-300"
                onClick={resetConfig}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t('orchestrator.retrySync') || 'Retry'}
              </Button>
            )}
          </div>
        </div>

        {/* Config Info */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-neutral-400" />
              <div>
                <p className="font-medium text-white">{config.name}</p>
                <p className="text-sm text-neutral-500">
                  {config.categories.filter(c => c.enabled).length} {t('orchestrator.activeModules')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-neutral-400">{t('orchestrator.activeConfig')}</span>
              </div>
              <Badge variant="outline" className="bg-neutral-800 border-neutral-700 text-neutral-300">
                {config.isDefault ? t('orchestrator.default') : t('orchestrator.custom')}
              </Badge>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {config.categories.map((category) => {
            const CategoryIcon = getCategoryIcon(category.icon)
            const colors = getCategoryColor(category.color)
            const isExpanded = expandedCategory === category.id
            const enabledAgents = category.agents.filter(a => a.enabled).length

            return (
              <div
                key={category.id}
                className={`bg-neutral-900 border rounded-lg overflow-hidden transition-all ${
                  category.enabled ? 'border-neutral-700' : 'border-neutral-800 opacity-60'
                }`}
              >
                {/* Category Header */}
                <div className="p-4 flex items-center justify-between">
                  {/* Clickable area for expand/collapse */}
                  <div
                    className="flex items-center gap-4 flex-1 cursor-pointer hover:opacity-80"
                    onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors.bg}`}>
                      <CategoryIcon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-white text-lg">
                          {locale === 'en' && category.nameEn ? category.nameEn : 
                           locale === 'es' && category.nameEs ? category.nameEs : 
                           category.name}
                        </p>
                        <Badge variant="outline" className={`text-xs ${colors.bg} ${colors.border} ${colors.text}`}>
                          {enabledAgents}/{category.agents.length} {t('orchestrator.agents')}
                        </Badge>
                        {!category.enabled && (
                          <Badge className="bg-neutral-700 text-neutral-400 text-xs">
                            {t('orchestrator.disabled')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-neutral-400">
                        {locale === 'en' && category.descriptionEn ? category.descriptionEn : 
                         locale === 'es' && category.descriptionEs ? category.descriptionEs : 
                         category.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Switch and chevron - separate from clickable area */}
                  <div className="flex items-center gap-4 ml-4 relative z-10">
                    {/* Custom Toggle Button */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={category.enabled}
                      className={`relative z-20 inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-neutral-900 ${
                        category.enabled ? 'bg-orange-500' : 'bg-neutral-600'
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('[Orchestrator] TOGGLE BUTTON CLICKED! Category:', category.id, 'Current:', category.enabled)
                        handleToggleCategory(category.id, !category.enabled)
                      }}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          category.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <div onClick={() => setExpandedCategory(isExpanded ? null : category.id)} className="cursor-pointer">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Agents Grid */}
                {isExpanded && (
                  <div className="border-t border-neutral-700 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {category.agents.map((agent) => {
                        const isAgentExpanded = expandedAgent === agent.id
                        const isTextAgent = agent.type === 'text'

                        return (
                          <div
                            key={agent.id}
                            className={`bg-neutral-800 border rounded-lg overflow-hidden transition-all ${
                              agent.enabled ? 'border-neutral-600' : 'border-neutral-700 opacity-50'
                            }`}
                          >
                            {/* Agent Header */}
                            <div className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                {/* Clickable area for expand/collapse */}
                                <div
                                  className="flex items-center gap-2 flex-1 cursor-pointer"
                                  onClick={() => setExpandedAgent(isAgentExpanded ? null : agent.id)}
                                >
                                  <div className={`w-8 h-8 rounded flex items-center justify-center ${
                                    agent.type === 'image' ? 'bg-purple-500/20' : 'bg-blue-500/20'
                                  }`}>
                                    {agent.type === 'image' ? (
                                      <ImageIcon className="w-4 h-4 text-purple-400" />
                                    ) : (
                                      <FileText className="w-4 h-4 text-blue-400" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-white text-sm">{agent.name}</p>
                                    <Badge variant="outline" className="text-xs bg-neutral-700 border-neutral-600 text-neutral-300">
                                      {agent.task}
                                    </Badge>
                                  </div>
                                </div>
                                
                                {/* Switch and chevron - separate from clickable area */}
                                <div className="flex items-center gap-2">
                                  {/* Custom Toggle Button for Agent */}
                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={agent.enabled}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-neutral-900 ${
                                      agent.enabled ? 'bg-orange-500' : 'bg-neutral-600'
                                    }`}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      console.log('[Orchestrator] Agent toggle clicked:', agent.id, 'current:', agent.enabled)
                                      handleToggleAgent(category.id, agent.id, !agent.enabled)
                                    }}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        agent.enabled ? 'translate-x-5' : 'translate-x-1'
                                      }`}
                                    />
                                  </button>
                                  <div 
                                    className="cursor-pointer"
                                    onClick={() => setExpandedAgent(isAgentExpanded ? null : agent.id)}
                                  >
                                    {isAgentExpanded ? (
                                      <ChevronUp className="w-4 h-4 text-neutral-400" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-neutral-400" />
                                    )}
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-neutral-500 mb-2">{agent.description}</p>
                              <div className="flex items-center gap-3 text-xs text-neutral-500">
                                <span className="flex items-center gap-1">
                                  <Cpu className="w-3 h-3" />
                                  {agent.model.split('/')[1] || agent.model}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Thermometer className="w-3 h-3" />
                                  {agent.temperature}
                                </span>
                                {agent.maxTokens && <span>{agent.maxTokens} tok</span>}
                              </div>
                            </div>

                            {/* Agent Details */}
                            {isAgentExpanded && (
                              <div className="border-t border-neutral-700 p-3 space-y-4">
                                {/* Model Selection */}
                                <div>
                                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                                    {t('orchestrator.aiModel')}
                                  </label>
                                  <Select
                                    value={agent.model}
                                    onValueChange={(value) => updateAgentField(category.id, agent.id, 'model', value)}
                                  >
                                    <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-neutral-700 border-neutral-600">
                                      {(isTextAgent ? AI_MODELS.text : AI_MODELS.image).map((model) => (
                                        <SelectItem key={model.id} value={model.id} className="text-white hover:bg-neutral-600 text-xs">
                                          <div className="flex items-center justify-between w-full gap-4">
                                            <span>{model.name}</span>
                                            {model.recommended && (
                                              <Badge className="bg-orange-500/20 text-orange-400 text-[10px]">
                                                {t('orchestrator.recommended')}
                                              </Badge>
                                            )}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Temperature */}
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Thermometer className="w-3 h-3 text-neutral-400" />
                                    <label className="text-xs font-medium text-neutral-300">
                                      {t('orchestrator.temperature')}: {agent.temperature}
                                    </label>
                                  </div>
                                  <Slider
                                    value={[agent.temperature]}
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    onValueChange={([value]) => updateAgentField(category.id, agent.id, 'temperature', value)}
                                    className="w-full"
                                  />
                                  <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
                                    <span>{t('orchestrator.precise')}</span>
                                    <span>{t('orchestrator.creative')}</span>
                                  </div>
                                </div>

                                {/* Max Tokens / Resolution */}
                                <div className="grid grid-cols-2 gap-3">
                                  {isTextAgent && agent.maxTokens && (
                                    <div>
                                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                                        {t('orchestrator.maxTokens')}
                                      </label>
                                      <Input
                                        type="number"
                                        value={agent.maxTokens}
                                        onChange={(e) => updateAgentField(category.id, agent.id, 'maxTokens', parseInt(e.target.value))}
                                        className="bg-neutral-700 border-neutral-600 text-white h-8 text-xs"
                                      />
                                    </div>
                                  )}

                                  {!isTextAgent && (
                                    <div>
                                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                                        {t('orchestrator.resolution')}
                                      </label>
                                      <Select
                                        value={agent.imageResolution || '1280x720'}
                                        onValueChange={(value) => updateAgentField(category.id, agent.id, 'imageResolution', value)}
                                      >
                                        <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white h-8 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-neutral-700 border-neutral-600">
                                          <SelectItem value="1280x720" className="text-xs">1280x720 (720p)</SelectItem>
                                          <SelectItem value="1920x1080" className="text-xs">1920x1080 (1080p)</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                                      {t('orchestrator.retry')}
                                    </label>
                                    <Input
                                      type="number"
                                      value={agent.retryCount}
                                      min={0}
                                      max={5}
                                      onChange={(e) => updateAgentField(category.id, agent.id, 'retryCount', parseInt(e.target.value))}
                                      className="bg-neutral-700 border-neutral-600 text-white h-8 text-xs"
                                    />
                                  </div>
                                </div>

                                {/* Test Button */}
                                <div className="flex items-center justify-between pt-2 border-t border-neutral-700">
                                  <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    {t('orchestrator.apiCreditsRequired')}
                                  </span>
                                  <Button variant="outline" size="sm" className="h-6 text-[10px] border-neutral-600 text-neutral-300">
                                    <Play className="w-3 h-3 mr-1" />
                                    {t('orchestrator.test')}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Cost Estimation */}
        <div className="mt-8 bg-neutral-900 border border-neutral-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('orchestrator.costEstimation')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-neutral-800 rounded-lg p-4">
              <p className="text-sm text-neutral-500 mb-1">{t('orchestrator.textGeneration')}</p>
              <p className="text-xl font-mono text-white">~$0.05</p>
              <p className="text-xs text-neutral-500">{t('orchestrator.perSession')}</p>
            </div>
            <div className="bg-neutral-800 rounded-lg p-4">
              <p className="text-sm text-neutral-500 mb-1">{t('orchestrator.imageGeneration')}</p>
              <p className="text-xl font-mono text-white">~$0.12</p>
              <p className="text-xs text-neutral-500">3 {t('orchestrator.thumbnails')}</p>
            </div>
            <div className="bg-neutral-800 rounded-lg p-4">
              <p className="text-sm text-neutral-500 mb-1">{t('orchestrator.socialPosts')}</p>
              <p className="text-xl font-mono text-white">~$0.01</p>
              <p className="text-xs text-neutral-500">8 {t('orchestrator.platforms')}</p>
            </div>
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4">
              <p className="text-sm text-orange-400 mb-1">{t('orchestrator.estimatedTotal')}</p>
              <p className="text-xl font-mono text-orange-500">~$0.18</p>
              <p className="text-xs text-orange-400/70">{t('orchestrator.perVideo')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
