import type { OrchestrationConfig, VideoSession, VideoMetadata, ArtisticDirection, Thumbnail, SocialPost, APILog } from './types'

// Retry utility with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number,
  delay: number,
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
  let lastError: Error = new Error('Unknown error')
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt < retries) {
        onRetry?.(attempt + 1, lastError)
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)))
      }
    }
  }
  
  throw lastError
}

// Cost calculator
function calculateCost(model: string, tokensUsed?: number, imagesGenerated?: number): number {
  const costs: Record<string, { perToken?: number; perImage?: number }> = {
    // OpenAI
    'openai/gpt-4o': { perToken: 0.000015 },
    'openai/gpt-4o-mini': { perToken: 0.0000015 },
    'gpt-4o': { perToken: 0.000015 },
    'gpt-4o-mini': { perToken: 0.0000015 },
    // Anthropic
    'anthropic/claude-3-5-sonnet': { perToken: 0.000003 },
    'anthropic/claude-3-5-sonnet-20241022': { perToken: 0.000003 },
    'claude-3-5-sonnet-20241022': { perToken: 0.000003 },
    'claude-3-5-sonnet-20240620': { perToken: 0.000003 },
    'claude-sonnet-4-6': { perToken: 0.000003 },
    'anthropic/claude-3-opus': { perToken: 0.000015 },
    'claude-3-opus-20240229': { perToken: 0.000015 },
    'anthropic/claude-3-haiku': { perToken: 0.00000025 },
    'claude-3-haiku-20240307': { perToken: 0.00000025 },
    // Google
    'google/gemini-pro-1.5': { perToken: 0.00000125 },
    'google/gemini-flash-1.5': { perToken: 0.000000375 },
    // Images
    'openai/dall-e-3': { perImage: 0.04 },
    'google/gemini-3.1-flash-image-preview': { perImage: 0.02 },
    'stability/sdxl': { perImage: 0.01 },
  }
  
  // Clean model name for lookup
  const baseModel = model.replace('anthropic/', '').replace('openai/', '')
  const modelCost = costs[model] || costs[baseModel]
  
  if (!modelCost) return tokensUsed ? tokensUsed * 0.000002 : 0
  
  let total = 0
  if (tokensUsed && modelCost.perToken) {
    total += tokensUsed * modelCost.perToken
  }
  if (imagesGenerated && modelCost.perImage) {
    total += imagesGenerated * modelCost.perImage
  }
  
  return total
}

// Main orchestration service
export class OrchestrationService {
  private config: OrchestrationConfig
  private logs: APILog[] = []
  private onLogUpdate?: (log: APILog) => void
  
  constructor(config: OrchestrationConfig, onLogUpdate?: (log: APILog) => void) {
    this.config = config
    this.onLogUpdate = onLogUpdate
  }
  
  private addLog(log: Omit<APILog, 'id' | 'timestamp'>): APILog {
    const fullLog: APILog = {
      ...log,
      id: Math.random().toString(36).substring(2, 15),
      timestamp: new Date(),
    }
    this.logs.push(fullLog)
    this.onLogUpdate?.(fullLog)
    return fullLog
  }
  
  async generateMetadata(sessionId: string, context: string): Promise<VideoMetadata> {
    const step = this.config.steps.find(s => s.type === 'metadata')
    if (!step?.enabled) {
      throw new Error('Metadata generation step is disabled')
    }
    
    const startTime = Date.now()
    
    try {
      const result = await withRetry(
        async () => {
          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'metadata',
              context,
              model: step.model,
              temperature: step.temperature,
            }),
          })
          
          if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`)
          }
          
          return response.json()
        },
        step.retryCount,
        step.retryDelay,
        (attempt) => {
          this.addLog({
            sessionId,
            operation: `Metadata Generation (retry ${attempt})`,
            model: step.model,
            status: 'pending',
            requestTime: Date.now() - startTime,
            cost: 0,
          })
        }
      )
      
      const tokensUsed = result.usage?.totalTokens || 1500
      const cost = calculateCost(step.model, tokensUsed)
      
      this.addLog({
        sessionId,
        operation: 'Metadata Generation',
        model: step.model,
        status: 'success',
        requestTime: Date.now() - startTime,
        tokensUsed,
        cost,
      })
      
      return {
        id: Math.random().toString(36).substring(2, 15),
        sessionId,
        selectedTitle: 0,
        ...result.data,
      }
    } catch (error) {
      this.addLog({
        sessionId,
        operation: 'Metadata Generation',
        model: step.model,
        status: 'error',
        requestTime: Date.now() - startTime,
        cost: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }
  
  async generateArtisticDirections(sessionId: string, context: string, metadata: VideoMetadata): Promise<ArtisticDirection[]> {
    const step = this.config.steps.find(s => s.type === 'artistic')
    if (!step?.enabled) {
      throw new Error('Artistic direction step is disabled')
    }
    
    const startTime = Date.now()
    
    try {
      const result = await withRetry(
        async () => {
          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'artistic',
              context,
              metadata: {
                title: metadata.titles[metadata.selectedTitle],
                tags: metadata.tags,
              },
              model: step.model,
              temperature: step.temperature,
            }),
          })
          
          if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`)
          }
          
          return response.json()
        },
        step.retryCount,
        step.retryDelay
      )
      
      const tokensUsed = result.usage?.totalTokens || 1000
      const cost = calculateCost(step.model, tokensUsed)
      
      this.addLog({
        sessionId,
        operation: 'Artistic Directions',
        model: step.model,
        status: 'success',
        requestTime: Date.now() - startTime,
        tokensUsed,
        cost,
      })
      
      return result.data.directions.map((dir: ArtisticDirection, index: number) => ({
        ...dir,
        id: Math.random().toString(36).substring(2, 15),
        sessionId,
        selected: index === 0,
      }))
    } catch (error) {
      this.addLog({
        sessionId,
        operation: 'Artistic Directions',
        model: step.model,
        status: 'error',
        requestTime: Date.now() - startTime,
        cost: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }
  
  async generateThumbnails(
    sessionId: string,
    context: string,
    metadata: VideoMetadata,
    direction: ArtisticDirection,
    count: number = 3
  ): Promise<Thumbnail[]> {
    const step = this.config.steps.find(s => s.type === 'thumbnail')
    if (!step?.enabled) {
      throw new Error('Thumbnail generation step is disabled')
    }
    
    const thumbnails: Thumbnail[] = []
    
    for (let i = 0; i < count; i++) {
      const startTime = Date.now()
      
      try {
        // First generate the prompt
        const promptResult = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'thumbnail_prompt',
            context,
            metadata: {
              title: metadata.titles[metadata.selectedTitle],
            },
            direction,
            model: 'openai/gpt-4o-mini',
          }),
        })
        
        if (!promptResult.ok) {
          throw new Error('Failed to generate thumbnail prompt')
        }
        
        const { data: prompt } = await promptResult.json()
        
        // Then generate the image
        const imageResult = await withRetry(
          async () => {
            const response = await fetch('/api/generate-thumbnail', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt,
                model: step.model,
                size: step.imageResolution === '1920x1080' ? '1792x1024' : '1792x1024',
              }),
            })
            
            if (!response.ok) {
              throw new Error(`Image generation error: ${response.statusText}`)
            }
            
            return response.json()
          },
          step.retryCount,
          step.retryDelay,
          (attempt) => {
            this.addLog({
              sessionId,
              operation: `Thumbnail Gen #${i + 1} (retry ${attempt})`,
              model: step.model,
              status: 'pending',
              requestTime: Date.now() - startTime,
              cost: 0,
            })
          }
        )
        
        const cost = calculateCost(step.model, undefined, 1)
        
        this.addLog({
          sessionId,
          operation: `Thumbnail Gen #${i + 1}`,
          model: step.model,
          status: 'success',
          requestTime: Date.now() - startTime,
          cost,
        })
        
        thumbnails.push({
          id: Math.random().toString(36).substring(2, 15),
          sessionId,
          directionId: direction.id,
          imageUrl: imageResult.images[0]?.url || '',
          textOverlay: [],
          resolution: step.imageResolution || '1280x720',
          compressed: false,
          selected: i === 0,
          status: 'ready',
        })
      } catch (error) {
        this.addLog({
          sessionId,
          operation: `Thumbnail Gen #${i + 1}`,
          model: step.model,
          status: 'error',
          requestTime: Date.now() - startTime,
          cost: 0,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        })
        
        thumbnails.push({
          id: Math.random().toString(36).substring(2, 15),
          sessionId,
          directionId: direction.id,
          imageUrl: '',
          textOverlay: [],
          resolution: step.imageResolution || '1280x720',
          compressed: false,
          selected: false,
          status: 'error',
        })
      }
    }
    
    return thumbnails
  }
  
  async generateSocialPosts(sessionId: string, context: string, metadata: VideoMetadata): Promise<SocialPost[]> {
    const step = this.config.steps.find(s => s.type === 'social')
    if (!step?.enabled) {
      throw new Error('Social posts step is disabled')
    }
    
    const startTime = Date.now()
    
    try {
      const result = await withRetry(
        async () => {
          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'social',
              context,
              metadata: {
                title: metadata.titles[metadata.selectedTitle],
                tags: metadata.tags,
                description: metadata.description,
              },
              model: step.model,
              temperature: step.temperature,
            }),
          })
          
          if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`)
          }
          
          return response.json()
        },
        step.retryCount,
        step.retryDelay
      )
      
      const tokensUsed = result.usage?.totalTokens || 800
      const cost = calculateCost(step.model, tokensUsed)
      
      this.addLog({
        sessionId,
        operation: 'Social Posts Generation',
        model: step.model,
        status: 'success',
        requestTime: Date.now() - startTime,
        tokensUsed,
        cost,
      })
      
      return result.data.posts.map((post: Partial<SocialPost>) => ({
        id: Math.random().toString(36).substring(2, 15),
        sessionId,
        status: 'draft',
        ...post,
      }))
    } catch (error) {
      this.addLog({
        sessionId,
        operation: 'Social Posts Generation',
        model: step.model,
        status: 'error',
        requestTime: Date.now() - startTime,
        cost: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }
  
  async executeSkill(sessionId: string, skillSlug: string, context: string, modelOverride?: string): Promise<string> {
    const startTime = Date.now()
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'skill_execution',
          skillSlug,
          context,
          model: modelOverride || 'anthropic/claude-3-5-sonnet',
          sessionId
        })
      })

      if (!response.ok) {
        throw new Error(`Execution error: ${response.statusText}`)
      }

      const result = await response.json()
      const tokensUsed = result.usage?.totalTokens || 0
      const cost = calculateCost(result.usage?.model || 'claude-3-5-sonnet', tokensUsed)

      this.addLog({
        sessionId,
        operation: `Skill: ${skillSlug}`,
        model: result.usage?.model || 'claude-3-5-sonnet',
        status: 'success',
        requestTime: Date.now() - startTime,
        tokensUsed,
        cost
      })

      return result.data
    } catch (error) {
      this.addLog({
        sessionId,
        operation: `Skill: ${skillSlug}`,
        model: 'error',
        status: 'error',
        requestTime: Date.now() - startTime,
        cost: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  async runSkillChain(sessionId: string, initialContext: string, skillSlugs: string[]): Promise<string> {
    let currentContext = initialContext
    let stepNumber = 1
    
    for (const slug of skillSlugs) {
      // Universal Bridge Artifact Pattern
      const contextForSkill = stepNumber === 1 
        ? initialContext 
        : `### CONTEXTE SOURCE\n${initialContext}\n\n### ARTEFACT PRÉCÉDENT (Step ${stepNumber - 1}: ${skillSlugs[stepNumber - 2]})\n${currentContext}`

      const result = await this.executeSkill(sessionId, slug, contextForSkill)
      currentContext = result
      stepNumber++
    }
    return currentContext
  }

  /**
   * Executes a complex sequential workflow with multiple skills and steps.
   * Follows the Universal Bridge Artifact (UBA) principle.
   */
  async executeSequentialWorkflow(
    sessionId: string, 
    initialContext: string, 
    steps: { slug: string; name?: string }[]
  ): Promise<{ finalOutput: string; stepsResults: Record<string, string> }> {
    let currentContext = initialContext
    const stepsResults: Record<string, string> = {}
    
    for (const [index, step] of steps.entries()) {
      const stepName = step.name || step.slug
      const isFirstStep = index === 0
      
      // Build the UBA prompt
      const ubaContext = isFirstStep
        ? initialContext
        : `### CONTEXTE SOURCE\n${initialContext}\n\n### FIL D'ARIANE (Worklow)\nÉtape suivante : ${stepName}\n\n### ARTEFACT PRÉCÉDENT (Étape ${index}: ${steps[index-1].slug})\n${currentContext}`

      this.addLog({
        sessionId,
        operation: `Workflow Step ${index + 1}: ${stepName}`,
        model: 'pending',
        status: 'pending',
        requestTime: 0,
        cost: 0
      })

      const result = await this.executeSkill(sessionId, step.slug, ubaContext)
      stepsResults[step.slug] = result
      currentContext = result
    }

    return {
      finalOutput: currentContext,
      stepsResults
    }
  }

  getLogs(): APILog[] {
    return this.logs
  }
  
  getTotalCost(): number {
    return this.logs.reduce((acc, log) => acc + log.cost, 0)
  }
}
