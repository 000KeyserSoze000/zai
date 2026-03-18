import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Default orchestration configuration
const DEFAULT_CONFIG = {
  categories: [
    {
      id: 'content-studio',
      name: 'Content Studio',
      description: 'Automatisation complète de la création de contenu YouTube',
      icon: 'Clapperboard',
      color: 'orange',
      enabled: true,
      agents: [
        {
          id: 'metadata',
          name: 'Génération Métadonnées',
          description: 'Génère les titres, descriptions, tags et hashtags optimisés SEO pour YouTube',
          task: 'Génération Métadonnées SEO',
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
          name: 'Génération Miniatures',
          description: 'Crée 3 miniatures YouTube uniques avec overlays texte et logos intégrés',
          task: 'Génération Miniatures',
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
          description: 'Adapte le contenu pour 8 plateformes sociales avec ton et format optimisés',
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
      nameEn: 'Content Studio',
      nameEs: 'Estudio de Contenido',
      descriptionEn: 'Full automation of YouTube content creation',
      descriptionEs: 'Automatización completa de la creación de contenido de YouTube',
    }
  ]
}

// GET - Fetch active orchestration config
export async function GET() {
  try {
    // Try to get the active config from database
    const config = await db.orchestrationConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' }
    })

    if (config) {
      return NextResponse.json({
        id: config.id,
        name: config.name,
        isDefault: config.isDefault,
        isActive: config.isActive,
        categories: JSON.parse(config.categories),
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      })
    }

    // If no config exists, create the default one
    const newConfig = await db.orchestrationConfig.create({
      data: {
        name: 'Configuration Standard',
        isDefault: true,
        isActive: true,
        categories: JSON.stringify(DEFAULT_CONFIG.categories)
      }
    })

    return NextResponse.json({
      id: newConfig.id,
      name: newConfig.name,
      isDefault: newConfig.isDefault,
      isActive: newConfig.isActive,
      categories: JSON.parse(newConfig.categories),
      createdAt: newConfig.createdAt,
      updatedAt: newConfig.updatedAt
    })
  } catch (error) {
    console.error('Orchestrator GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
  }
}

// PUT - Update orchestration config
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, categories, name } = body

    if (!id) {
      return NextResponse.json({ error: 'Config ID required' }, { status: 400 })
    }

    const updated = await db.orchestrationConfig.update({
      where: { id },
      data: {
        name: name || 'Configuration Standard',
        categories: JSON.stringify(categories)
      }
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      isDefault: updated.isDefault,
      isActive: updated.isActive,
      categories: JSON.parse(updated.categories),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    })
  } catch (error) {
    console.error('Orchestrator PUT error:', error)
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
  }
}

// POST - Create new orchestration config
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, categories } = body

    const config = await db.orchestrationConfig.create({
      data: {
        name: name || 'Nouvelle Configuration',
        isDefault: false,
        isActive: false,
        categories: JSON.stringify(categories || DEFAULT_CONFIG.categories)
      }
    })

    return NextResponse.json({
      id: config.id,
      name: config.name,
      isDefault: config.isDefault,
      isActive: config.isActive,
      categories: JSON.parse(config.categories),
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    })
  } catch (error) {
    console.error('Orchestrator POST error:', error)
    return NextResponse.json({ error: 'Failed to create config' }, { status: 500 })
  }
}

// DELETE - Reset config to default
export async function DELETE() {
  try {
    // Delete all existing configs
    await db.orchestrationConfig.deleteMany()
    
    // Create fresh default config
    const config = await db.orchestrationConfig.create({
      data: {
        name: 'Configuration Standard',
        isDefault: true,
        isActive: true,
        categories: JSON.stringify(DEFAULT_CONFIG.categories)
      }
    })

    return NextResponse.json({
      id: config.id,
      name: config.name,
      isDefault: config.isDefault,
      isActive: config.isActive,
      categories: JSON.parse(config.categories),
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    })
  } catch (error) {
    console.error('Orchestrator DELETE error:', error)
    return NextResponse.json({ error: 'Failed to reset config' }, { status: 500 })
  }
}
