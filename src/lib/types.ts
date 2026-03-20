// Video Session Types
export interface VideoSession {
  id: string
  title: string
  context: string
  status: 'draft' | 'processing' | 'completed' | 'error'
  createdAt: Date
  updatedAt: Date
  metadata?: VideoMetadata
  artisticDirections?: ArtisticDirection[]
  thumbnails?: Thumbnail[]
  socialPosts?: SocialPost[]
  costs?: SessionCosts
}

export interface VideoMetadata {
  id: string
  sessionId: string
  titles: string[]
  selectedTitle: number
  description: string
  tags: string[]
  hashtags: string[]
  seoScore: number
  targetAudience: string
  keyMoments: string[]
}

export interface ArtisticDirection {
  id: string
  sessionId: string
  name: string
  style: 'modern' | 'retro' | 'minimalist' | 'bold' | 'elegant' | 'playful'
  colorPalette: ColorPalette
  typography: TypographyStyle
  moodKeywords: string[]
  previewUrl?: string
  selected: boolean
}

export interface ColorPalette {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
}

export interface TypographyStyle {
  headingFont: string
  bodyFont: string
  headingWeight: string
  emphasis: 'uppercase' | 'lowercase' | 'capitalize' | 'none'
}

export interface Thumbnail {
  id: string
  sessionId: string
  directionId: string
  imageUrl: string
  textOverlay: ThumbnailText[]
  resolution: '1280x720' | '1920x1080'
  compressed: boolean
  selected: boolean
  status: 'generating' | 'ready' | 'error'
  theme?: string
  referencePhoto?: string
}

export interface ThumbnailText {
  id: string
  content: string
  position: { x: number; y: number }
  fontSize: number
  fontFamily: string
  color: string
  strokeColor?: string
  strokeWidth?: number
  rotation: number
}

export interface SocialPost {
  id: string
  sessionId: string
  platform: 'linkedin' | 'youtube_community' | 'school' | 'tiktok' | 'x' | 'instagram' | 'facebook' | 'threads'
  content: string
  hashtags: string[]
  scheduledAt?: Date
  publishedAt?: Date
  status: 'draft' | 'scheduled' | 'published' | 'error'
  engagement?: {
    likes: number
    comments: number
    shares: number
  }
}

export interface SessionCosts {
  textGeneration: number
  imageGeneration: number
  total: number
  breakdown: CostBreakdown[]
}

export interface CostBreakdown {
  operation: string
  model: string
  tokens?: number
  images?: number
  cost: number
  timestamp: Date
}

// Orchestration Types
export interface OrchestrationConfig {
  id: string
  name: string
  isDefault?: boolean
  categories: AgentCategory[]
  steps: OrchestrationStep[]
  icon: string
  color: string
  agents: AgentConfig[]
  enabled: boolean
}

export interface AgentCategory {
  id: string
  name: string
  slug: string
  description?: string
  icon: string
  color: string
  accessLevel?: string
  displayOrder?: number
  isActive: boolean
  isProduct?: boolean
  price?: number
  currency?: string
  agents?: AgentConfig[]
}

export interface AgentConfig {
  id: string
  name: string
  description: string
  task: string
  type: 'text' | 'image' | 'video' | 'audio'
  model: string
  temperature: number
  maxTokens?: number
  imageResolution?: '1280x720' | '1920x1080'
  retryCount: number
  retryDelay: number
  enabled: boolean
}

// Legacy support
export interface OrchestrationStep {
  id: string
  name: string
  type: 'metadata' | 'artistic' | 'thumbnail' | 'social'
  model: string
  temperature: number
  maxTokens?: number
  imageResolution?: '1280x720' | '1920x1080'
  retryCount: number
  retryDelay: number
  enabled: boolean
}

// API Log Types
export interface APILog {
  id: string
  sessionId?: string
  operation: string
  model: string
  status: 'success' | 'error' | 'pending'
  requestTime: number
  tokensUsed?: number
  cost: number
  errorMessage?: string
  timestamp: Date
}

// Settings Types
export interface UserSettings {
  defaultOrchestration: string
  autoSave: boolean
  thumbnailResolution: '1280x720' | '1920x1080'
  compressionQuality: number
  defaultPlatforms: ('linkedin' | 'youtube_community' | 'school')[]
  apiKeys: {
    linkedin?: string
    youtube?: string
    school?: string
  }
}

// Workflow State
export interface WorkflowState {
  currentStep: number
  steps: WorkflowStep[]
  session: VideoSession | null
}

export interface WorkflowStep {
  id: string
  name: string
  status: 'pending' | 'active' | 'completed' | 'error'
  icon: string
}

// Parallel Task State (for Content Studio)
export interface ParallelTaskState {
  artistic: { status: string; progress: number }
  social: { status: string; progress: number }
}

// Skill Mapping (for Content Studio)
export interface SkillMapping {
  metadata: string
  artistic: string
  social: string
}
