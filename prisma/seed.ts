import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Orchestrator data...')

  // Create Agent Categories
  const categories = await Promise.all([
    prisma.agentCategory.upsert({
      where: { slug: 'content-creation' },
      update: {},
      create: {
        name: 'Création de Contenu',
        nameEn: 'Content Creation',
        nameEs: 'Creación de Contenido',
        slug: 'content-creation',
        description: 'Agents spécialisés dans la création de contenu textuel et visuel',
        descriptionEn: 'Agents specialized in textual and visual content creation',
        descriptionEs: 'Agentes especializados en creación de contenido textual y visual',
        icon: 'PenTool',
        color: 'orange',
        displayOrder: 1,
      }
    }),
    prisma.agentCategory.upsert({
      where: { slug: 'seo-optimization' },
      update: {},
      create: {
        name: 'SEO & Optimisation',
        nameEn: 'SEO & Optimization',
        nameEs: 'SEO y Optimización',
        slug: 'seo-optimization',
        description: 'Agents pour l\'optimisation SEO et l\'analyse de performance',
        descriptionEn: 'Agents for SEO optimization and performance analysis',
        descriptionEs: 'Agentes para optimización SEO y análisis de rendimiento',
        icon: 'Search',
        color: 'blue',
        displayOrder: 2,
      }
    }),
    prisma.agentCategory.upsert({
      where: { slug: 'social-media' },
      update: {},
      create: {
        name: 'Réseaux Sociaux',
        nameEn: 'Social Media',
        nameEs: 'Redes Sociales',
        slug: 'social-media',
        description: 'Agents pour la gestion et l\'automatisation des réseaux sociaux',
        descriptionEn: 'Agents for social media management and automation',
        descriptionEs: 'Agentes para gestión y automatización de redes sociales',
        icon: 'Share2',
        color: 'purple',
        displayOrder: 3,
      }
    }),
    prisma.agentCategory.upsert({
      where: { slug: 'marketing-strategy' },
      update: {},
      create: {
        name: 'Marketing & Stratégie',
        nameEn: 'Marketing & Strategy',
        nameEs: 'Marketing y Estrategia',
        slug: 'marketing-strategy',
        description: 'Agents pour la stratégie marketing et la planification',
        descriptionEn: 'Agents for marketing strategy and planning',
        descriptionEs: 'Agentes para estrategia de marketing y planificación',
        icon: 'Target',
        color: 'green',
        displayOrder: 4,
      }
    }),
    prisma.agentCategory.upsert({
      where: { slug: 'video-production' },
      update: {},
      create: {
        name: 'Production Vidéo',
        nameEn: 'Video Production',
        nameEs: 'Producción de Video',
        slug: 'video-production',
        description: 'Agents pour la production et l\'optimisation de vidéos',
        descriptionEn: 'Agents for video production and optimization',
        descriptionEs: 'Agentes para producción y optimización de videos',
        icon: 'Video',
        color: 'red',
        displayOrder: 5,
      }
    }),
    prisma.agentCategory.upsert({
      where: { slug: 'business-intelligence' },
      update: {},
      create: {
        name: 'Business & Analyse',
        nameEn: 'Business & Analytics',
        nameEs: 'Negocios y Análisis',
        slug: 'business-intelligence',
        description: 'Agents pour l\'analyse business et les rapports',
        descriptionEn: 'Agents for business analysis and reporting',
        descriptionEs: 'Agentes para análisis de negocios e informes',
        icon: 'BarChart',
        color: 'teal',
        displayOrder: 6,
      }
    }),
  ])

  console.log(`✅ Created ${categories.length} agent categories`)

  // Create Agents
  const contentCategory = categories[0]
  const seoCategory = categories[1]
  const socialCategory = categories[2]
  const marketingCategory = categories[3]
  const videoCategory = categories[4]
  const businessCategory = categories[5]

  // Content Creation Agents
  const contentWriter = await prisma.agent.upsert({
    where: { slug: 'content-writer' },
    update: {},
    create: {
      name: 'Rédacteur de Contenu',
      slug: 'content-writer',
      description: 'Expert en rédaction de contenu web, articles de blog, et copywriting',
      avatar: '✍️',
      color: 'orange',
      systemPrompt: `Tu es un rédacteur de contenu professionnel expert en copywriting et création de contenu web. Tu excelles dans la création de:
- Articles de blog optimisés SEO
- Pages de vente persuasives
- Contenu de sites web
- Newsletters engageantes

Tes forces:
- Écriture claire et concise
- Optimisation SEO naturelle
- Adaptation au ton de la marque
- Création de titres accrocheurs

Tu dois toujours:
1. Adapter ton style au public cible
2. Intégrer naturellement les mots-clés
3. Structurer le contenu avec des sous-titres
4. Inclure des appels à l'action pertinents`,
      categoryId: contentCategory.id,
    }
  })

  const scriptWriter = await prisma.agent.upsert({
    where: { slug: 'script-writer' },
    update: {},
    create: {
      name: 'Scénariste Vidéo',
      slug: 'script-writer',
      description: 'Spécialiste en écriture de scripts pour vidéos YouTube, TikTok et Instagram',
      avatar: '🎬',
      color: 'red',
      systemPrompt: `Tu es un scénariste vidéo professionnel spécialisé dans la création de scripts pour YouTube, TikTok, et Instagram Reels.

Tes compétences:
- Scripts YouTube structurés avec hooks puissants
- Scripts TikTok/Reels viraux sous 60 secondes
- Storytelling engageant
- Intégration naturelle des produits/services

Structure de script préférée:
1. Hook accrocheur (3 premières secondes)
2. Problème/Promesse
3. Contenu principal avec valeur
4. Call-to-action clair

Tu dois toujours:
- Captiver l'attention immédiatement
- Maintenir un rythme dynamique
- Inclure des indices visuels
- Optimiser pour la rétention`,
      categoryId: videoCategory.id,
    }
  })

  // SEO Agents
  const seoSpecialist = await prisma.agent.upsert({
    where: { slug: 'seo-specialist' },
    update: {},
    create: {
      name: 'Expert SEO',
      slug: 'seo-specialist',
      description: 'Spécialiste en optimisation pour les moteurs de recherche et analyse de contenu',
      avatar: '🔍',
      color: 'blue',
      systemPrompt: `Tu es un expert SEO avec plus de 10 ans d'expérience en optimisation pour les moteurs de recherche.

Tes domaines d'expertise:
- Audit SEO complet
- Recherche de mots-clés
- Optimisation on-page
- Stratégie de contenu SEO
- Analyse de la concurrence

Tu dois fournir:
1. Analyse détaillée avec scores
2. Recommandations prioritaires
3. Plan d'action concret
4. KPIs à suivre

Format de réponse: JSON structuré avec sections claires.`,
      categoryId: seoCategory.id,
    }
  })

  // Social Media Agents
  const socialMediaManager = await prisma.agent.upsert({
    where: { slug: 'social-media-manager' },
    update: {},
    create: {
      name: 'Community Manager',
      slug: 'social-media-manager',
      description: 'Expert en gestion de communautés et création de contenu social media',
      avatar: '📱',
      color: 'purple',
      systemPrompt: `Tu es un Community Manager expert en création de contenu pour les réseaux sociaux.

Plateformes maîtrisées:
- LinkedIn (posts professionnels)
- Instagram (posts, stories, reels)
- TikTok (contenu viral)
- X/Twitter (tweets engageants)
- Facebook (posts communautaires)
- Threads (conversations authentiques)

Pour chaque plateforme, tu connais:
- Les meilleures pratiques
- Les formats optimaux
- Les horaires de publication
- Les tendances actuelles

Tu dois créer du contenu:
- Adapté à chaque plateforme
- Engageant et authentique
- Optimisé pour l'algorithme
- Avec hashtags pertinents`,
      categoryId: socialCategory.id,
    }
  })

  // Marketing Agents
  const marketingStrategist = await prisma.agent.upsert({
    where: { slug: 'marketing-strategist' },
    update: {},
    create: {
      name: 'Stratège Marketing',
      slug: 'marketing-strategist',
      description: 'Expert en stratégie marketing, growth hacking et acquisition',
      avatar: '📈',
      color: 'green',
      systemPrompt: `Tu es un stratège marketing senior spécialisé en growth marketing et acquisition.

Tes compétences:
- Élaboration de stratégies marketing
- Growth hacking et acquisition
- Marketing de contenu
- Email marketing
- Paid advertising (Meta, Google)

Tu dois fournir:
1. Analyse de la situation actuelle
2. Objectifs SMART
3. Stratégie détaillée
4. Calendrier d'exécution
5. Budget prévisionnel
6. KPIs et métriques à suivre

Approche data-driven avec focus sur le ROI.`,
      categoryId: marketingCategory.id,
    }
  })

  // Video Agents
  const thumbnailDesigner = await prisma.agent.upsert({
    where: { slug: 'thumbnail-designer' },
    update: {},
    create: {
      name: 'Designer Thumbnails',
      slug: 'thumbnail-designer',
      description: 'Expert en création de miniatures YouTube optimisées pour le CTR',
      avatar: '🎨',
      color: 'pink',
      systemPrompt: `Tu es un designer expert en miniatures YouTube optimisées pour maximiser le taux de clic (CTR).

Principes de design:
- Contraste élevé pour attirer l'œil
- Typographie lisible en petit format
- Visuels émotionnels et expressifs
- Composition en règle des tiers
- Couleurs vives mais harmonieuses

Tu dois fournir:
1. 3 directions artistiques distinctes
2. Palette de couleurs pour chaque direction
3. Recommandations typographiques
4. Concept de miniature détaillé
5. Prompt pour génération d'image IA

Format: JSON structuré avec toutes les specs techniques.`,
      categoryId: videoCategory.id,
    }
  })

  // Business Agents
  const businessAnalyst = await prisma.agent.upsert({
    where: { slug: 'business-analyst' },
    update: {},
    create: {
      name: 'Analyste Business',
      slug: 'business-analyst',
      description: 'Expert en analyse business, KPIs et reporting financier',
      avatar: '📊',
      color: 'teal',
      systemPrompt: `Tu es un analyste business senior spécialisé dans les startups et entreprises tech.

Tes domaines:
- Analyse financière et prévisions
- KPIs et métriques SaaS
- Business models et pricing
- Due diligence et fundraising
- Reporting et tableaux de bord

Tu dois fournir:
1. Analyse de la situation
2. Métriques clés à surveiller
3. Recommandations stratégiques
4. Prévisions chiffrées
5. Plan d'action priorisé

Toujours avec des données concrètes et exploitables.`,
      categoryId: businessCategory.id,
    }
  })

  console.log(`✅ Created 7 agents`)

  // Create Skills for each agent
  // Content Writer Skills
  await prisma.skill.upsert({
    where: { slug: 'blog-article' },
    update: {},
    create: {
      name: 'Article de Blog',
      slug: 'blog-article',
      description: 'Génération d\'articles de blog optimisés SEO',
      type: 'GENERATION',
      promptTemplate: `Rédige un article de blog complet sur le sujet suivant:

Sujet: {{topic}}
Public cible: {{audience}}
Ton: {{tone}}
Longueur: {{length}} mots

L'article doit être:
- Optimisé SEO avec le mot-clé principal: {{keyword}}
- Structuré avec des sous-titres H2 et H3
- Inclure une introduction accrocheuse
- Avoir une conclusion avec call-to-action`,
      inputSchema: JSON.stringify({
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Sujet de l\'article' },
          audience: { type: 'string', description: 'Public cible' },
          tone: { type: 'string', enum: ['professionnel', 'décontracté', 'expert'], default: 'professionnel' },
          length: { type: 'number', default: 1500 },
          keyword: { type: 'string', description: 'Mot-clé principal SEO' }
        },
        required: ['topic', 'audience']
      }),
      outputSchema: JSON.stringify({
        type: 'object',
        properties: {
          title: { type: 'string' },
          introduction: { type: 'string' },
          sections: { type: 'array', items: { type: 'object' } },
          conclusion: { type: 'string' },
          metaDescription: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } }
        }
      }),
      agentId: contentWriter.id,
    }
  })

  await prisma.skill.upsert({
    where: { slug: 'sales-copy' },
    update: {},
    create: {
      name: 'Copywriting de Vente',
      slug: 'sales-copy',
      description: 'Création de textes de vente persuasifs',
      type: 'GENERATION',
      promptTemplate: `Rédige un texte de vente persuasif pour:

Produit/Service: {{product}}
Avantages principaux: {{benefits}}
Public cible: {{audience}}
Objectif: {{goal}}
Prix: {{price}}

Utilise les techniques de persuasion:
- Formule AIDA (Attention, Intérêt, Désir, Action)
- Preuves sociales si applicable
- Urgence et rareté si pertinent`,
      inputSchema: JSON.stringify({
        type: 'object',
        properties: {
          product: { type: 'string' },
          benefits: { type: 'string' },
          audience: { type: 'string' },
          goal: { type: 'string', enum: ['vente', 'inscription', 'téléchargement', 'contact'] },
          price: { type: 'string' }
        },
        required: ['product', 'benefits', 'audience', 'goal']
      }),
      outputSchema: JSON.stringify({
        type: 'object',
        properties: {
          headline: { type: 'string' },
          subheadline: { type: 'string' },
          body: { type: 'string' },
          cta: { type: 'string' },
          ps: { type: 'string' }
        }
      }),
      agentId: contentWriter.id,
    }
  })

  // Video Script Skills
  await prisma.skill.upsert({
    where: { slug: 'youtube-script' },
    update: {},
    create: {
      name: 'Script YouTube',
      slug: 'youtube-script',
      description: 'Création de scripts pour vidéos YouTube',
      type: 'GENERATION',
      promptTemplate: `Crée un script complet pour une vidéo YouTube:

Sujet: {{topic}}
Durée cible: {{duration}} minutes
Style: {{style}}
Public: {{audience}}

Structure requise:
1. Hook (10-15 premières secondes)
2. Introduction et promesse
3. Contenu principal (3-5 points clés)
4. Exemples et démonstrations
5. Conclusion et CTA

Inclus des notes visuelles entre [crochets]`,
      inputSchema: JSON.stringify({
        type: 'object',
        properties: {
          topic: { type: 'string' },
          duration: { type: 'number', default: 10 },
          style: { type: 'string', enum: ['éducatif', 'divertissant', 'tutoriel', 'vlog'] },
          audience: { type: 'string' }
        },
        required: ['topic']
      }),
      outputSchema: JSON.stringify({
        type: 'object',
        properties: {
          title: { type: 'string' },
          hook: { type: 'string' },
          intro: { type: 'string' },
          mainContent: { type: 'array' },
          conclusion: { type: 'string' },
          cta: { type: 'string' },
          visualNotes: { type: 'array' }
        }
      }),
      agentId: scriptWriter.id,
    }
  })

  // SEO Skills
  await prisma.skill.upsert({
    where: { slug: 'seo-audit' },
    update: {},
    create: {
      name: 'Audit SEO',
      slug: 'seo-audit',
      description: 'Analyse SEO complète d\'un contenu ou page web',
      type: 'ANALYSIS',
      promptTemplate: `Réalise un audit SEO complet pour:

URL/Contenu: {{content}}
Mot-clé cible: {{keyword}}
Concurrents: {{competitors}}

Analyse à fournir:
1. Score SEO global (/100)
2. Optimisation du titre
3. Optimisation de la meta description
4. Structure des headings
5. Densité du mot-clé
6. Liens internes/externes
7. Optimisation images
8. Vitesse et performance
9. Recommandations prioritaires`,
      inputSchema: JSON.stringify({
        type: 'object',
        properties: {
          content: { type: 'string' },
          keyword: { type: 'string' },
          competitors: { type: 'array', items: { type: 'string' } }
        },
        required: ['content', 'keyword']
      }),
      outputSchema: JSON.stringify({
        type: 'object',
        properties: {
          score: { type: 'number' },
          titleAnalysis: { type: 'object' },
          metaAnalysis: { type: 'object' },
          headingAnalysis: { type: 'object' },
          keywordAnalysis: { type: 'object' },
          linkAnalysis: { type: 'object' },
          imageAnalysis: { type: 'object' },
          recommendations: { type: 'array' }
        }
      }),
      agentId: seoSpecialist.id,
    }
  })

  // Social Media Skills
  await prisma.skill.upsert({
    where: { slug: 'social-posts' },
    update: {},
    create: {
      name: 'Posts Réseaux Sociaux',
      slug: 'social-posts',
      description: 'Génération de posts pour tous les réseaux sociaux',
      type: 'GENERATION',
      promptTemplate: `Crée des posts optimisés pour les réseaux sociaux:

Sujet: {{topic}}
Plateformes: {{platforms}}
Ton: {{tone}}
Objectif: {{objective}}
Hashtags suggérés: {{hashtags}}

Génère un post unique pour chaque plateforme demandée, adapté au format et à l'audience de chacune.`,
      inputSchema: JSON.stringify({
        type: 'object',
        properties: {
          topic: { type: 'string' },
          platforms: { type: 'array', items: { type: 'string', enum: ['linkedin', 'instagram', 'tiktok', 'x', 'facebook', 'threads'] } },
          tone: { type: 'string', enum: ['professionnel', 'décontracté', 'inspirant', 'éducatif'] },
          objective: { type: 'string', enum: ['engagement', 'trafic', 'notoriété', 'conversion'] },
          hashtags: { type: 'array', items: { type: 'string' } }
        },
        required: ['topic', 'platforms']
      }),
      outputSchema: JSON.stringify({
        type: 'object',
        properties: {
          posts: { type: 'array', items: { type: 'object', properties: { platform: { type: 'string' }, content: { type: 'string' }, hashtags: { type: 'array' } } } }
        }
      }),
      agentId: socialMediaManager.id,
    }
  })

  // Thumbnail Skills
  await prisma.skill.upsert({
    where: { slug: 'artistic-directions' },
    update: {},
    create: {
      name: 'Directions Artistiques',
      slug: 'artistic-directions',
      description: 'Génération de directions artistiques pour thumbnails',
      type: 'GENERATION',
      promptTemplate: `Génère 3 directions artistiques pour une thumbnail YouTube:

Titre de la vidéo: {{title}}
Sujet: {{topic}}
Ambiance souhaitée: {{mood}}
Style préféré: {{style}}

Pour chaque direction, fournis:
- Nom de la direction
- Style (modern, retro, minimalist, bold, elegant, playful)
- Palette de couleurs (hex)
- Typographie recommandée
- Mots-clés d'ambiance
- Concept de thumbnail`,
      inputSchema: JSON.stringify({
        type: 'object',
        properties: {
          title: { type: 'string' },
          topic: { type: 'string' },
          mood: { type: 'string' },
          style: { type: 'string', enum: ['modern', 'retro', 'minimalist', 'bold', 'elegant', 'playful'] }
        },
        required: ['title', 'topic']
      }),
      outputSchema: JSON.stringify({
        type: 'object',
        properties: {
          directions: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, style: { type: 'string' }, colorPalette: { type: 'object' }, typography: { type: 'object' }, moodKeywords: { type: 'array' }, thumbnailConcept: { type: 'string' } } } }
        }
      }),
      agentId: thumbnailDesigner.id,
    }
  })

  // Marketing Skills
  await prisma.skill.upsert({
    where: { slug: 'marketing-strategy' },
    update: {},
    create: {
      name: 'Stratégie Marketing',
      slug: 'marketing-strategy',
      description: 'Création de stratégies marketing complètes',
      type: 'GENERATION',
      promptTemplate: `Élabore une stratégie marketing complète pour:

Produit/Service: {{product}}
Public cible: {{audience}}
Objectifs: {{goals}}
Budget: {{budget}}
Durée: {{duration}}

La stratégie doit inclure:
1. Positionnement et proposition de valeur
2. Personas détaillés
3. Canaux d'acquisition
4. Plan de contenu
5. Calendrier d'exécution
6. Budget prévisionnel
7. KPIs et métriques`,
      inputSchema: JSON.stringify({
        type: 'object',
        properties: {
          product: { type: 'string' },
          audience: { type: 'string' },
          goals: { type: 'string' },
          budget: { type: 'string' },
          duration: { type: 'string' }
        },
        required: ['product', 'audience', 'goals']
      }),
      outputSchema: JSON.stringify({
        type: 'object',
        properties: {
          positioning: { type: 'object' },
          personas: { type: 'array' },
          channels: { type: 'array' },
          contentPlan: { type: 'array' },
          timeline: { type: 'array' },
          budget: { type: 'object' },
          kpis: { type: 'array' }
        }
      }),
      agentId: marketingStrategist.id,
    }
  })

  // Business Analysis Skills
  await prisma.skill.upsert({
    where: { slug: 'financial-analysis' },
    update: {},
    create: {
      name: 'Analyse Financière',
      slug: 'financial-analysis',
      description: 'Analyse financière et prévisions business',
      type: 'ANALYSIS',
      promptTemplate: `Réalise une analyse financière pour:

Entreprise/Projet: {{entity}}
Données actuelles: {{data}}
Objectifs: {{goals}}
Période d'analyse: {{period}}

Fournis:
1. Résumé exécutif
2. Analyse des revenus
3. Analyse des coûts
4. Prévisions à 12 mois
5. KPIs clés
6. Risques identifiés
7. Recommandations`,
      inputSchema: JSON.stringify({
        type: 'object',
        properties: {
          entity: { type: 'string' },
          data: { type: 'string' },
          goals: { type: 'string' },
          period: { type: 'string' }
        },
        required: ['entity', 'data']
      }),
      outputSchema: JSON.stringify({
        type: 'object',
        properties: {
          summary: { type: 'string' },
          revenueAnalysis: { type: 'object' },
          costAnalysis: { type: 'object' },
          forecast: { type: 'array' },
          kpis: { type: 'array' },
          risks: { type: 'array' },
          recommendations: { type: 'array' }
        }
      }),
      agentId: businessAnalyst.id,
    }
  })

  console.log(`✅ Created skills for all agents`)

  // Create default Tools
  await prisma.tool.upsert({
    where: { slug: 'web-search' },
    update: {},
    create: {
      name: 'Recherche Web',
      slug: 'web-search',
      description: 'Outil de recherche sur le web pour obtenir des informations à jour',
      type: 'API',
      endpoint: '/api/tools/web-search',
      method: 'POST',
      isActive: true,
    }
  })

  await prisma.tool.upsert({
    where: { slug: 'image-generation' },
    update: {},
    create: {
      name: 'Génération d\'Images',
      slug: 'image-generation',
      description: 'Génération d\'images avec IA',
      type: 'API',
      endpoint: '/api/tools/image-generation',
      method: 'POST',
      isActive: true,
    }
  })

  console.log(`✅ Created tools`)

  // Create Orchestration Config
  await prisma.orchestrationConfig.upsert({
    where: { id: 'default-config' },
    update: {},
    create: {
      id: 'default-config',
      name: 'Configuration par défaut',
      isDefault: true,
      categories: JSON.stringify(['content-creation', 'seo-optimization', 'social-media', 'marketing-strategy', 'video-production', 'business-intelligence']),
    }
  })

  console.log(`✅ Created orchestration config`)

  // Create Default Users
  console.log('👤 Creating default users...')
  const adminPassword = await bcrypt.hash('Admin123!', 10)
  const clientPassword = await bcrypt.hash('Client123!', 10)

  await prisma.user.upsert({
    where: { email: 'admin@contentpro.fr' },
    update: {
        password: adminPassword,
    },
    create: {
      email: 'admin@contentpro.fr',
      name: 'Administrateur',
      password: adminPassword,
      role: 'ADMIN',
    }
  })

  await prisma.user.upsert({
    where: { email: 'client@contentpro.fr' },
    update: {
        password: clientPassword,
    },
    create: {
      email: 'client@contentpro.fr',
      name: 'Utilisateur',
      password: clientPassword,
      role: 'CLIENT',
    }
  })

  console.log('✅ Created default users (admin@contentpro.fr / client@contentpro.fr)')
  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
