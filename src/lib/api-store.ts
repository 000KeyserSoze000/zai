"use client"

import { create } from 'zustand'
import type {
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

// ============================================
// TYPES
// ============================================

export interface ContentSession {
  id: string
  userId: string
  title: string | null
  context: string | null
  status: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  metadata: VideoMetadata | null
  artisticDir: ArtisticDirection[] | null
  thumbnails: Thumbnail[] | null
  socialPosts: SocialPost[] | null
  tokensUsed: number
  cost: number
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
}

// ============================================
// SESSION STORE (API Connected)
// ============================================

interface SessionStore {
  sessions: ContentSession[]
  currentSession: ContentSession | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchSessions: () => Promise<void>
  createSession: (title?: string, context?: string) => Promise<ContentSession | null>
  fetchSession: (id: string) => Promise<void>
  updateSession: (id: string, updates: Partial<ContentSession>) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  setCurrentSession: (session: ContentSession | null) => void
  clearError: () => void
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,

  fetchSessions: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/sessions')
      if (!response.ok) throw new Error('Erreur lors du chargement des sessions')
      const data = await response.json()
      set({ sessions: data.sessions, isLoading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur inconnue', isLoading: false })
    }
  },

  createSession: async (title?: string, context?: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, context })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création')
      }
      const data = await response.json()
      const session = data.session
      
      // Convert dates
      session.createdAt = new Date(session.createdAt)
      session.updatedAt = new Date(session.updatedAt)
      if (session.completedAt) session.completedAt = new Date(session.completedAt)
      
      set((state) => ({
        sessions: [session, ...state.sessions],
        currentSession: session,
        isLoading: false
      }))
      return session
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur inconnue', isLoading: false })
      return null
    }
  },

  fetchSession: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/sessions/${id}`)
      if (!response.ok) throw new Error('Session non trouvée')
      const data = await response.json()
      const session = data.session
      
      // Convert dates
      session.createdAt = new Date(session.createdAt)
      session.updatedAt = new Date(session.updatedAt)
      if (session.completedAt) session.completedAt = new Date(session.completedAt)
      
      set({ currentSession: session, isLoading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur inconnue', isLoading: false })
    }
  },

  updateSession: async (id: string, updates: Partial<ContentSession>) => {
    set({ error: null })
    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (!response.ok) throw new Error('Erreur lors de la mise à jour')
      const data = await response.json()
      const session = data.session
      
      // Convert dates
      session.createdAt = new Date(session.createdAt)
      session.updatedAt = new Date(session.updatedAt)
      if (session.completedAt) session.completedAt = new Date(session.completedAt)
      
      set((state) => ({
        sessions: state.sessions.map(s => s.id === id ? session : s),
        currentSession: state.currentSession?.id === id ? session : state.currentSession
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur inconnue' })
    }
  },

  deleteSession: async (id: string) => {
    set({ error: null })
    try {
      const response = await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erreur lors de la suppression')
      
      set((state) => ({
        sessions: state.sessions.filter(s => s.id !== id),
        currentSession: state.currentSession?.id === id ? null : state.currentSession
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur inconnue' })
    }
  },

  setCurrentSession: (session: ContentSession | null) => {
    set({ currentSession: session })
  },

  clearError: () => {
    set({ error: null })
  }
}))

// ============================================
// WORKFLOW STORE (Local UI State)
// ============================================

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

// ============================================
// ORCHESTRATION STORE
// ============================================

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

// ============================================
// API LOGS STORE
// ============================================

interface LogsStore {
  logs: APILog[]
  addLog: (log: Omit<APILog, 'id' | 'timestamp'>) => void
  clearLogs: () => void
  getTotalCosts: () => number
}

const generateId = () => Math.random().toString(36).substring(2, 15)

export const useLogsStore = create<LogsStore>((set, get) => ({
  logs: [],

  addLog: (log) => {
    const newLog: APILog = {
      ...log,
      id: generateId(),
      timestamp: new Date(),
    }
    set((state) => ({
      logs: [newLog, ...state.logs].slice(0, 500),
    }))
  },

  clearLogs: () => {
    set({ logs: [] })
  },

  getTotalCosts: () => {
    return get().logs.reduce((acc, log) => acc + log.cost, 0)
  },
}))

// ============================================
// SETTINGS STORE
// ============================================

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
