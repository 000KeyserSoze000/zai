/**
 * AI Router - Sélection dynamique des modèles d'IA
 * 
 * Ce module analyse la complexité des tâches et sélectionne
 * le modèle le plus adapté en termes de coût, vitesse et qualité.
 */

// Configuration des modèles disponibles
export const AI_MODELS = {
  text: {
    'z-ai/default': {
      name: 'Z.ai Default',
      provider: 'Z.ai',
      costPer1k: 0.002,
      speed: 'very fast',
      maxTokens: 4096,
      bestFor: ['general', 'creative', 'simple', 'bulk'],
      recommended: true,
    },
    'openai/gpt-4o': {
      name: 'GPT-4o',
      provider: 'OpenAI',
      costPer1k: 0.015,
      speed: 'fast',
      maxTokens: 8192,
      bestFor: ['complex', 'reasoning', 'multilingual'],
    },
    'openai/gpt-4o-mini': {
      name: 'GPT-4o Mini',
      provider: 'OpenAI',
      costPer1k: 0.0015,
      speed: 'very fast',
      maxTokens: 4096,
      bestFor: ['simple', 'fast', 'bulk'],
    },
    'anthropic/claude-sonnet-4': {
      name: 'Claude Sonnet 4',
      provider: 'Anthropic',
      costPer1k: 0.003,
      speed: 'fast',
      maxTokens: 8192,
      bestFor: ['creative', 'analysis', 'nuanced'],
    },
  },
  image: {
    'z-ai/image': {
      name: 'Z.ai Image',
      provider: 'Z.ai',
      costPerImage: 0.02,
      speed: 'fast',
      quality: 'high',
      bestFor: ['thumbnails', 'social', 'marketing'],
      recommended: true,
    },
    'openai/dall-e-3': {
      name: 'DALL-E 3',
      provider: 'OpenAI',
      costPerImage: 0.04,
      speed: 'medium',
      quality: 'very high',
      bestFor: ['detailed', 'artistic', 'photorealistic'],
    },
  },
}

// Types de complexité
export type Complexity = 'simple' | 'medium' | 'complex'

// Types de tâches
export type TaskType = 'metadata' | 'artistic' | 'thumbnail' | 'social' | 'script' | 'analysis'

// Configuration du routeur
interface RouterConfig {
  preferSpeed: boolean
  preferQuality: boolean
  preferCost: boolean
  maxCostPerRequest: number
}

const defaultRouterConfig: RouterConfig = {
  preferSpeed: true,
  preferQuality: false,
  preferCost: true,
  maxCostPerRequest: 0.10,
}

// Analyse la complexité d'un input
export function analyzeComplexity(input: string, taskType: TaskType): Complexity {
  const wordCount = input.split(/\s+/).length
  const hasSpecialChars = /[#@!?%&*]/.test(input)
  const hasNumbers = /\d+/.test(input)
  const hasMultipleLanguages = /[a-zA-Z].*[àâäéèêëïîôùûüÿç]/i.test(input)
  
  let score = 0
  
  // Facteurs de complexité
  if (wordCount > 500) score += 2
  else if (wordCount > 200) score += 1
  
  if (hasSpecialChars) score += 1
  if (hasNumbers) score += 1
  if (hasMultipleLanguages) score += 1
  
  // Ajustement par type de tâche
  const taskComplexityMultiplier: Record<TaskType, number> = {
    metadata: 1.0,
    artistic: 1.2,    // Plus créatif
    thumbnail: 1.0,
    social: 0.8,      // Plus simple
    script: 1.5,      // Plus complexe
    analysis: 1.3,
  }
  
  score *= taskComplexityMultiplier[taskType]
  
  if (score >= 4) return 'complex'
  if (score >= 2) return 'medium'
  return 'simple'
}

// Sélectionne le meilleur modèle pour une tâche
export function selectModel(
  taskType: TaskType,
  complexity: Complexity,
  config: Partial<RouterConfig> = {}
): { model: string; reason: string; estimatedCost: number } {
  const cfg = { ...defaultRouterConfig, ...config }
  
  const isImageTask = taskType === 'thumbnail'
  const models = isImageTask ? AI_MODELS.image : AI_MODELS.text
  
  // Logique de sélection
  let selectedModel: string
  let reason: string
  let estimatedCost: number
  
  if (isImageTask) {
    // Pour les images, utiliser z-ai/image par défaut
    selectedModel = 'z-ai/image'
    reason = 'Modèle recommandé pour la génération de miniatures'
    estimatedCost = 0.06 // 3 images
  } else {
    // Pour le texte, sélectionner selon la complexité et les préférences
    if (cfg.preferSpeed && (complexity === 'simple' || complexity === 'medium')) {
      selectedModel = 'z-ai/default'
      reason = 'Optimisé pour la vitesse avec un excellent rapport qualité/prix'
      estimatedCost = 0.004
    } else if (cfg.preferQuality && complexity === 'complex') {
      selectedModel = 'anthropic/claude-sonnet-4'
      reason = 'Qualité supérieure pour les tâches complexes'
      estimatedCost = 0.015
    } else if (cfg.preferCost) {
      selectedModel = 'z-ai/default'
      reason = 'Coût minimisé avec performance optimale'
      estimatedCost = 0.002
    } else {
      selectedModel = 'z-ai/default'
      reason = 'Modèle par défaut recommandé'
      estimatedCost = 0.004
    }
  }
  
  return { model: selectedModel, reason, estimatedCost }
}

// Planifie l'exécution des tâches
export interface TaskPlan {
  id: string
  taskType: TaskType
  model: string
  modelReason: string
  dependencies: string[]
  canRunInParallel: boolean
  estimatedCost: number
  estimatedTime: number // en ms
}

export function planExecution(
  input: string,
  taskTypes: TaskType[]
): { tasks: TaskPlan[]; totalCost: number; totalTime: number; parallelGroups: string[][] } {
  const tasks: TaskPlan[] = []
  let totalCost = 0
  let totalTime = 0
  const parallelGroups: string[][] = []
  
  // Analyser la complexité globale
  const globalComplexity = analyzeComplexity(input, 'metadata')
  
  // Planifier chaque tâche
  taskTypes.forEach((taskType, index) => {
    const complexity = analyzeComplexity(input, taskType)
    const { model, reason, estimatedCost } = selectModel(taskType, complexity)
    
    const task: TaskPlan = {
      id: `${taskType}-${index}`,
      taskType,
      model,
      modelReason: reason,
      dependencies: [],
      canRunInParallel: false,
      estimatedCost,
      estimatedTime: taskType === 'thumbnail' ? 30000 : 10000,
    }
    
    tasks.push(task)
    totalCost += estimatedCost
  })
  
  // Définir les dépendances et le parallélisme
  // Metadata est toujours en premier (séquentiel)
  if (tasks.length > 0) {
    tasks[0].canRunInParallel = false
    parallelGroups.push([tasks[0].id])
  }
  
  // Artistic et Social peuvent être parallèles (dépendent tous deux de Metadata)
  if (tasks.length >= 3) {
    const parallelTasks = tasks.slice(1, -1).map(t => t.id)
    if (parallelTasks.length > 0) {
      parallelTasks.forEach(id => {
        const task = tasks.find(t => t.id === id)
        if (task) {
          task.canRunInParallel = true
          task.dependencies = [tasks[0].id]
        }
      })
      parallelGroups.push(parallelTasks)
    }
  }
  
  // Thumbnail dépend de Artistic (séquentiel)
  if (tasks.length >= 3) {
    const lastTask = tasks[tasks.length - 1]
    lastTask.canRunInParallel = false
    lastTask.dependencies = [tasks[1].id] // Dépend de Artistic
    parallelGroups.push([lastTask.id])
  }
  
  // Calculer le temps total (parallélisme réduit le temps)
  const sequentialTime = tasks.reduce((acc, t) => acc + t.estimatedTime, 0)
  const parallelTime = parallelGroups.reduce((acc, group) => {
    const groupTime = Math.max(...group.map(id => {
      const task = tasks.find(t => t.id === id)
      return task?.estimatedTime || 0
    }))
    return acc + groupTime
  }, 0)
  
  totalTime = parallelTime
  
  return { tasks, totalCost, totalTime, parallelGroups }
}

// Logger les décisions du routeur
export function logRouterDecision(
  taskType: TaskType,
  complexity: Complexity,
  selectedModel: string,
  reason: string
): void {
  console.log(`[AI Router] Task: ${taskType} | Complexity: ${complexity} | Model: ${selectedModel} | Reason: ${reason}`)
}

// Exporter le routeur principal
export const AIRouter = {
  analyzeComplexity,
  selectModel,
  planExecution,
  logRouterDecision,
}

export default AIRouter
