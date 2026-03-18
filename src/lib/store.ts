"use client"

import { create } from 'zustand'
import type {
  VideoSession,
  VideoMetadata,
  ArtisticDirection,
  Thumbnail,
  SocialPost,
  OrchestrationConfig,
  AgentCategory,
  AgentConfig,
  APILog,
  UserSettings,
  WorkflowState,
} from './types'

// Generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15)

// Session Store
interface SessionStore {
  sessions: VideoSession[]
  currentSession: VideoSession | null
  createSession: (context: string) => VideoSession
  updateSession: (id: string, updates: Partial<VideoSession>) => void
  setCurrentSession: (session: VideoSession | null) => void
  deleteSession: (id: string) => void
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  currentSession: null,

  createSession: (context: string) => {
    const session: VideoSession = {
      id: generateId(),
      title: `Session ${new Date().toLocaleDateString()}`,
      context,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      costs: {
        textGeneration: 0,
        imageGeneration: 0,
        total: 0,
        breakdown: [],
      },
    }
    set((state) => ({
      sessions: [session, ...state.sessions],
      currentSession: session,
    }))
    return session
  },

  updateSession: (id: string, updates: Partial<VideoSession>) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s
      ),
      currentSession:
        state.currentSession?.id === id
          ? { ...state.currentSession, ...updates, updatedAt: new Date() }
          : state.currentSession,
    }))
  },

  setCurrentSession: (session: VideoSession | null) => {
    set({ currentSession: session })
  },

  deleteSession: (id: string) => {
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      currentSession: state.currentSession?.id === id ? null : state.currentSession,
    }))
  },
}))

// Workflow Store
interface WorkflowStore {
  workflow: WorkflowState
  setStep: (step: number) => void
  updateStepStatus: (stepId: string, status: 'pending' | 'active' | 'completed' | 'error') => void
  resetWorkflow: () => void
}

const initialWorkflow: WorkflowState = {
  currentStep: 0,
  steps: [
    { id: 'context', name: 'Contexte Video', status: 'active', icon: 'FileText' },
    { id: 'metadata', name: 'Metadonnees SEO', status: 'pending', icon: 'Search' },
    { id: 'artistic', name: 'Directions Artistiques', status: 'pending', icon: 'Palette' },
    { id: 'thumbnails', name: 'Miniatures', status: 'pending', icon: 'Image' },
    { id: 'social', name: 'Posts Sociaux', status: 'pending', icon: 'Share2' },
    { id: 'publish', name: 'Publication', status: 'pending', icon: 'Send' },
  ],
  session: null,
}

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  workflow: initialWorkflow,

  setStep: (step: number) => {
    set((state) => {
      const newSteps = state.workflow.steps.map((s, i) => ({
        ...s,
        status:
          i < step ? 'completed' : i === step ? 'active' : 'pending',
      })) as WorkflowState['steps']
      return {
        workflow: {
          ...state.workflow,
          currentStep: step,
          steps: newSteps,
        },
      }
    })
  },

  updateStepStatus: (stepId: string, status: 'pending' | 'active' | 'completed' | 'error') => {
    set((state) => ({
      workflow: {
        ...state.workflow,
        steps: state.workflow.steps.map((s) =>
          s.id === stepId ? { ...s, status } : s
        ),
      },
    }))
  },

  resetWorkflow: () => {
    set({ workflow: initialWorkflow })
  },
}))

// Orchestration Store
interface OrchestrationStore {
  configs: OrchestrationConfig[]
  activeConfig: OrchestrationConfig | null
  setActiveConfig: (config: OrchestrationConfig) => void
  updateAgent: (configId: string, categoryId: string, agentId: string, updates: Partial<AgentConfig>) => void
  toggleCategory: (configId: string, categoryId: string, enabled: boolean) => void
}

const defaultOrchestration: OrchestrationConfig = {
  id: 'default',
  name: 'Configuration Standard',
  isDefault: true,
  categories: [
    {
      id: 'content-studio',
      name: 'Content Studio',
      description: 'Automatisation complete de la creation de contenu YouTube',
      icon: 'Clapperboard',
      color: 'orange',
      enabled: true,
      agents: [
        {
          id: 'metadata',
          name: 'Generation Metadonnees',
          description: 'Genere les titres, descriptions, tags et hashtags optimises SEO pour YouTube',
          task: 'Generation Metadonnees SEO',
          type: 'text',
          model: 'z-ai/default',
          temperature: 0.7,
          maxTokens: 2000,
          retryCount: 3,
          retryDelay: 1000,
          enabled: true,
        },
        {
          id: 'artistic',
          name: 'Direction Artistique',
          description: 'Analyse le contexte et propose 3 directions artistiques avec palettes de couleurs',
          task: 'Direction Artistique',
          type: 'text',
          model: 'z-ai/default',
          temperature: 0.8,
          maxTokens: 1500,
          retryCount: 3,
          retryDelay: 1000,
          enabled: true,
        },
        {
          id: 'thumbnail',
          name: 'Generation Miniatures',
          description: 'Cree 3 miniatures YouTube uniques avec overlays texte et logos integres',
          task: 'Generation Miniatures',
          type: 'image',
          model: 'z-ai/image',
          temperature: 0.7,
          imageResolution: '1280x720',
          retryCount: 2,
          retryDelay: 2000,
          enabled: true,
        },
        {
          id: 'social',
          name: 'Posts Sociaux',
          description: 'Adapte le contenu pour 8 plateformes sociales avec ton et format optimises',
          task: 'Posts Sociaux Multi-Plateformes',
          type: 'text',
          model: 'z-ai/default',
          temperature: 0.7,
          maxTokens: 3000,
          retryCount: 3,
          retryDelay: 1000,
          enabled: true,
        },
      ],
    },
    {
      id: 'finance-ai',
      name: 'Finance AI',
      description: 'Previsions financieres et analyses budgetaires intelligentes',
      icon: 'TrendingUp',
      color: 'cyan',
      enabled: false,
      agents: [
        {
          id: 'forecast',
          name: 'Previsions Financieres',
          description: 'Analyse les tendances et genere des previsions financieres',
          task: 'Previsions Financieres',
          type: 'text',
          model: 'z-ai/default',
          temperature: 0.3,
          maxTokens: 2500,
          retryCount: 3,
          retryDelay: 1000,
          enabled: true,
        },
        {
          id: 'budget',
          name: 'Analyse Budgetaire',
          description: 'Analyse les depenses et propose des optimisations',
          task: 'Analyse Budgetaire',
          type: 'text',
          model: 'z-ai/default',
          temperature: 0.4,
          maxTokens: 2000,
          retryCount: 3,
          retryDelay: 1000,
          enabled: true,
        },
      ],
    },
    {
      id: 'marketing-ai',
      name: 'Marketing AI',
      description: 'Strategies marketing et analyse de marche',
      icon: 'Target',
      color: 'purple',
      enabled: false,
      agents: [
        {
          id: 'campaign',
          name: 'Generation Campagnes',
          description: 'Cree des strategies de campagnes marketing ciblees',
          task: 'Generation Campagnes',
          type: 'text',
          model: 'z-ai/default',
          temperature: 0.8,
          maxTokens: 3000,
          retryCount: 3,
          retryDelay: 1000,
          enabled: true,
        },
        {
          id: 'analysis',
          name: 'Analyse Marche',
          description: 'Analyse les tendances du marche et la concurrence',
          task: 'Analyse Marche',
          type: 'text',
          model: 'z-ai/default',
          temperature: 0.5,
          maxTokens: 2500,
          retryCount: 3,
          retryDelay: 1000,
          enabled: true,
        },
      ],
    },
    {
      id: 'business-tools',
      name: 'Business Tools',
      description: 'Generation de documents professionnels',
      icon: 'FileText',
      color: 'green',
      enabled: false,
      agents: [
        {
          id: 'contracts',
          name: 'Generation Contrats',
          description: 'Cree des contrats et documents juridiques personnalises',
          task: 'Generation Contrats',
          type: 'text',
          model: 'z-ai/default',
          temperature: 0.3,
          maxTokens: 4000,
          retryCount: 3,
          retryDelay: 1000,
          enabled: true,
        },
        {
          id: 'proposals',
          name: 'Propositions Commerciales',
          description: 'Redige des propositions commerciales convaincantes',
          task: 'Propositions Commerciales',
          type: 'text',
          model: 'z-ai/default',
          temperature: 0.6,
          maxTokens: 3000,
          retryCount: 3,
          retryDelay: 1000,
          enabled: true,
        },
      ],
    },
  ],
}

export const useOrchestrationStore = create<OrchestrationStore>((set) => ({
  configs: [defaultOrchestration],
  activeConfig: defaultOrchestration,

  setActiveConfig: (config: OrchestrationConfig) => {
    set({ activeConfig: config })
  },

  updateAgent: (configId: string, categoryId: string, agentId: string, updates: Partial<AgentConfig>) => {
    set((state) => ({
      configs: state.configs.map((c) =>
        c.id === configId
          ? {
              ...c,
              categories: c.categories.map((cat) =>
                cat.id === categoryId
                  ? {
                      ...cat,
                      agents: cat.agents.map((a) =>
                        a.id === agentId ? { ...a, ...updates } : a
                      ),
                    }
                  : cat
              ),
            }
          : c
      ),
      activeConfig:
        state.activeConfig?.id === configId
          ? {
              ...state.activeConfig,
              categories: state.activeConfig.categories.map((cat) =>
                cat.id === categoryId
                  ? {
                      ...cat,
                      agents: cat.agents.map((a) =>
                        a.id === agentId ? { ...a, ...updates } : a
                      ),
                    }
                  : cat
              ),
            }
          : state.activeConfig,
    }))
  },

  toggleCategory: (configId: string, categoryId: string, enabled: boolean) => {
    set((state) => ({
      configs: state.configs.map((c) =>
        c.id === configId
          ? {
              ...c,
              categories: c.categories.map((cat) =>
                cat.id === categoryId ? { ...cat, enabled } : cat
              ),
            }
          : c
      ),
      activeConfig:
        state.activeConfig?.id === configId
          ? {
              ...state.activeConfig,
              categories: state.activeConfig.categories.map((cat) =>
                cat.id === categoryId ? { ...cat, enabled } : cat
              ),
            }
          : state.activeConfig,
    }))
  },
}))

// API Logs Store
interface LogsStore {
  logs: APILog[]
  addLog: (log: Omit<APILog, 'id' | 'timestamp'>) => void
  clearLogs: () => void
  getTotalCosts: () => number
}

export const useLogsStore = create<LogsStore>((set, get) => ({
  logs: [],

  addLog: (log) => {
    const newLog: APILog = {
      ...log,
      id: generateId(),
      timestamp: new Date(),
    }
    set((state) => ({
      logs: [newLog, ...state.logs].slice(0, 500), // Keep last 500 logs
    }))
  },

  clearLogs: () => {
    set({ logs: [] })
  },

  getTotalCosts: () => {
    return get().logs.reduce((acc, log) => acc + log.cost, 0)
  },
}))

// Settings Store
interface SettingsStore {
  settings: UserSettings
  updateSettings: (updates: Partial<UserSettings>) => void
}

const defaultSettings: UserSettings = {
  defaultOrchestration: 'default',
  autoSave: true,
  thumbnailResolution: '1280x720',
  compressionQuality: 85,
  defaultPlatforms: ['linkedin', 'youtube_community'],
  apiKeys: {},
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaultSettings,

  updateSettings: (updates: Partial<UserSettings>) => {
    set((state) => ({
      settings: { ...state.settings, ...updates },
    }))
  },
}))
