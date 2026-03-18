/**
 * Seed Content Studio Skills
 * Creates the skills required by Content Studio with the correct slugs
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Content Studio skills...')

  // Get or create the Content Architect agent (for content studio skills)
  let agent = await prisma.agent.findFirst({
    where: { slug: 'content-studio-agent' }
  })

  if (!agent) {
    // Find a category for the agent
    let category = await prisma.agentCategory.findFirst()
    
    if (!category) {
      category = await prisma.agentCategory.create({
        data: {
          name: 'Content Creation',
          nameEn: 'Content Creation',
          slug: 'content-creation',
          description: 'Outils de création de contenu',
          descriptionEn: 'Content creation tools',
          icon: 'Clapperboard',
          color: 'orange',
          displayOrder: 1,
        }
      })
    }

    agent = await prisma.agent.create({
      data: {
        name: 'Content Studio Agent',
        slug: 'content-studio-agent',
        description: 'Agent principal pour Content Studio',
        systemPrompt: 'Tu es un expert en création de contenu YouTube et réseaux sociaux. Tu génères du contenu optimisé, engageant et viral. Tu réponds toujours en JSON structuré.',
        modelProvider: 'openrouter',
        modelName: 'anthropic/claude-3-5-sonnet',
        temperature: 0.7,
        maxTokens: 4096,
        status: 'ACTIVE',
        categoryId: category.id,
      }
    })
    console.log('✅ Created Content Studio Agent')
  }

  // Define the Content Studio skills
  const skills = [
    {
      name: 'YouTube Metadata Extraction',
      slug: 'youtube-extraction',
      description: 'Extrait et génère les métadonnées YouTube optimisées (titres, description, tags, hashtags)',
      type: 'GENERATION',
      promptTemplate: `Tu es un expert SEO YouTube spécialisé dans la création de métadonnées optimisées.

À partir du contexte fourni, génère des métadonnées YouTube optimisées pour maximiser les vues et l'engagement.

Règles:
- Les titres doivent être engageants, sous 60 caractères, avec des power words
- La description doit faire 200-500 mots avec timestamps
- Les tags doivent être pertinents et inclure des mots-clés longue traîne
- Les hashtags doivent être tendance et adaptés à la plateforme
- Le score SEO doit refléter l'optimisation du titre, la qualité de la description et la pertinence des tags

Réponds UNIQUEMENT avec un objet JSON contenant:
{
  "titles": ["titre1", "titre2", "titre3"],
  "description": "description complète avec timestamps",
  "tags": ["tag1", "tag2", "tag3"],
  "hashtags": ["#hashtag1", "#hashtag2"],
  "seoScore": 85,
  "targetAudience": "description de l'audience cible",
  "keyMoments": ["moment1", "moment2", "moment3"]
}`,
      inputSchema: JSON.stringify({
        type: 'object',
        properties: {
          context: { type: 'string', description: 'Contexte ou sujet de la vidéo' }
        },
        required: ['context']
      }),
      outputSchema: JSON.stringify({
        type: 'object',
        properties: {
          titles: { type: 'array', items: { type: 'string' } },
          description: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          hashtags: { type: 'array', items: { type: 'string' } },
          seoScore: { type: 'number' },
          targetAudience: { type: 'string' },
          keyMoments: { type: 'array', items: { type: 'string' } }
        }
      }),
    },
    {
      name: 'Artistic Directions Generator',
      slug: 'artistic-directions',
      description: 'Génère des directions artistiques pour les miniatures YouTube',
      type: 'GENERATION',
      promptTemplate: `Tu es un expert directeur artistique et designer graphique spécialisé dans les miniatures YouTube.

À partir du contexte et du style fournis, génère 3 directions artistiques distinctes pour des miniatures YouTube.

Règles:
- Chaque direction doit avoir une identité visuelle unique
- Les palettes de couleurs doivent être contrastées et accrocheuses
- La typographie doit être lisible et impactante
- Considère les tailles d'affichage des miniatures YouTube

Réponds UNIQUEMENT avec un objet JSON contenant:
{
  "directions": [
    {
      "name": "Nom de la Direction",
      "style": "modern|retro|minimalist|bold|elegant|playful",
      "colorPalette": {
        "primary": "#hex",
        "secondary": "#hex",
        "accent": "#hex",
        "background": "#hex",
        "text": "#hex"
      },
      "typography": {
        "headingFont": "Nom de la police",
        "bodyFont": "Nom de la police",
        "headingWeight": "700",
        "emphasis": "uppercase|lowercase|capitalize|none"
      },
      "moodKeywords": ["mot1", "mot2", "mot3"],
      "thumbnailConcept": "Brève description du concept"
    }
  ]
}`,
      inputSchema: JSON.stringify({
        type: 'object',
        properties: {
          context: { type: 'string' },
          title: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } }
        }
      }),
      outputSchema: JSON.stringify({
        type: 'object',
        properties: {
          directions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                style: { type: 'string' },
                colorPalette: { type: 'object' },
                typography: { type: 'object' },
                moodKeywords: { type: 'array', items: { type: 'string' } },
                thumbnailConcept: { type: 'string' }
              }
            }
          }
        }
      }),
    },
    {
      name: 'Social Posts Generator',
      slug: 'social-posts',
      description: 'Génère des posts optimisés pour toutes les plateformes sociales',
      type: 'GENERATION',
      promptTemplate: `Tu es un expert community manager spécialisé dans le marketing pour créateurs de contenu.

À partir du contexte fourni, génère des posts optimisés pour chaque plateforme sociale.

Règles par plateforme:
- LinkedIn: Ton professionnel, focus sur la valeur et les apprentissages, 1300 chars max, emojis avec parcimonie
- YouTube Community: Engageant, conversationnel, encourage l'interaction, 500 chars max
- TikTok: Fun, tendance, hooks viraux, 150 chars max, hashtags tendance
- X (Twitter): Court, percutant, takes controversées ou surprenantes, 280 chars max
- Instagram: Focus visuel, emojis esthétiques, 2200 chars max, sauts de ligne
- Facebook: Amical, focus communauté, 500 chars max, encourage le partage
- Threads: Conversationnel, authentique, 500 chars max, les questions fonctionnent bien
- School: Focus éducatif, structure de cours, proposition de valeur claire, 800 chars max

Réponds UNIQUEMENT avec un objet JSON contenant:
{
  "posts": [
    {
      "platform": "linkedin|youtube_community|tiktok|x|instagram|facebook|threads|school",
      "content": "Contenu du post optimisé pour la plateforme",
      "hashtags": ["#hashtag1", "#hashtag2"]
    }
  ]
}`,
      inputSchema: JSON.stringify({
        type: 'object',
        properties: {
          context: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } }
        }
      }),
      outputSchema: JSON.stringify({
        type: 'object',
        properties: {
          posts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                platform: { type: 'string' },
                content: { type: 'string' },
                hashtags: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      }),
    },
    {
      name: 'Content Analyst',
      slug: 'content-analyst',
      description: 'Analyse le contenu et génère un blueprint stratégique',
      type: 'ANALYSIS',
      promptTemplate: `Tu es un analyste de contenu expert qui crée des blueprints stratégiques pour maximiser l'impact du contenu.

À partir du contexte fourni, analyse et crée un blueprint complet pour le contenu.

Ton analyse doit inclure:
1. Analyse de l'audience cible
2. Points de douleur et désirs
3. Angles de contenu uniques
4. Structure narrative recommandée
5. Hooks et CTAs suggérés
6. Stratégie de distribution

Réponds UNIQUEMENT avec un objet JSON contenant:
{
  "blueprint": {
    "audienceAnalysis": {
      "demographics": "description démographique",
      "psychographics": "description psychographique",
      "painPoints": ["point1", "point2"],
      "desires": ["désir1", "désir2"]
    },
    "contentAngles": [
      {
        "angle": "nom de l'angle",
        "description": "description de l'angle",
        "uniqueValue": "valeur unique de cet angle"
      }
    ],
    "narrativeStructure": {
      "hook": "hook initial",
      "introduction": "structure de l'intro",
      "mainContent": ["point1", "point2", "point3"],
      "conclusion": "structure de conclusion",
      "cta": "appel à l'action"
    },
    "distributionStrategy": {
      "primaryPlatform": "plateforme principale",
      "secondaryPlatforms": ["plateforme1", "plateforme2"],
      "timingRecommendations": "recommandations de timing"
    }
  }
}`,
      inputSchema: JSON.stringify({
        type: 'object',
        properties: {
          context: { type: 'string' }
        },
        required: ['context']
      }),
      outputSchema: JSON.stringify({
        type: 'object',
        properties: {
          blueprint: { type: 'object' }
        }
      }),
    }
  ]

  // Create or update skills
  for (const skillData of skills) {
    const existing = await prisma.skill.findUnique({
      where: { slug: skillData.slug }
    })

    if (existing) {
      await prisma.skill.update({
        where: { id: existing.id },
        data: {
          ...skillData,
          agentId: agent.id,
        }
      })
      console.log(`✅ Updated skill: ${skillData.slug}`)
    } else {
      await prisma.skill.create({
        data: {
          ...skillData,
          agentId: agent.id,
          isActive: true,
        }
      })
      console.log(`✅ Created skill: ${skillData.slug}`)
    }
  }

  console.log('🎉 Content Studio skills seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding skills:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
