import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import ZAI from 'z-ai-web-dev-sdk'
import { requireAuth, checkRateLimit, apiError } from '@/lib/api-utils'
import { db } from '@/lib/db'
import { getBrandSubstitutions, applyBrandSubstitutions, generateAIResponse } from '@/lib/ai-provider'

// Define the schema for request body
const GenerateSchema = z.object({
  type: z.enum([
    'metadata', 'artistic', 'social', 'thumbnail_prompt', 'thumbnail-titles', 
    'finance', 'marketing', 'business', 'social_batch', 'skill_execution'
  ]),
  context: z.string(),
  title: z.string().optional(),
  url: z.string().optional(),
  metadata: z.object({
    title: z.string().optional(),
    tags: z.array(z.string()).optional(),
    description: z.string().optional(),
  }).optional(),
  direction: z.record(z.string(), z.unknown()).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  sessionId: z.string().optional(), // Pour sauvegarder dans une session existante
  skillSlug: z.string().optional(),
  userId: z.string().optional(),
})

// Fonction pour sauvegarder les données dans ContentSession

// Fonction pour sauvegarder les données dans ContentSession
async function saveToSession(
  sessionId: string, 
  userId: string, 
  type: string, 
  data: any, 
  tokensUsed: number,
  cost: number
) {
  try {
    // Vérifier que la session appartient à l'utilisateur
    const session = await db.contentSession.findFirst({
      where: { id: sessionId, userId }
    })
    
    if (!session) {
      console.error('Session not found or not owned by user')
      return false
    }

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {
      tokensUsed: { increment: tokensUsed },
      cost: { increment: cost },
      status: 'PROCESSING',
    }

    // Sauvegarder selon le type
    if (type === 'metadata') {
      updateData.metadata = JSON.stringify(data)
    } else if (type === 'artistic') {
      updateData.artisticDir = JSON.stringify(data.directions || data)
    } else if (type === 'social') {
      updateData.socialPosts = JSON.stringify(data.posts || data)
    }

    // Mettre à jour la session
    await db.contentSession.update({
      where: { id: sessionId },
      data: updateData
    })

    // Créer un UsageRecord
    await db.usageRecord.create({
      data: {
        userId,
        action: `generate_${type}`,
        resourceId: sessionId,
        resourceType: 'content_session',
        tokensUsed,
        cost,
        metadata: JSON.stringify({ type, model: 'z-ai' })
      }
    })

    return true
  } catch (error) {
    console.error('Error saving to session:', error)
    return false
  }
}

// Helper to fetch and clean HTML from a URL
async function fetchAndCleanHtml(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) return `Erreur lors de la récupération de l'URL (${response.status})`;

    let html = await response.text();
    
    // Clean HTML: Remove scripts, styles, comments, and large tags to save tokens
    html = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '[SVG]')
      .replace(/<path\b[^<]*(?:(?!<\/path>)<[^<]*)*<\/path>/gi, '')
      .replace(/\s\s+/g, ' ') // Collapse whitespace
      .trim();

    // Take a reasonable chunk of the body or head
    return html.substring(0, 15000); 
  } catch (error) {
    console.error('[URL Fetcher] Error:', error);
    return `Impossible de crawler l'URL: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
  }
}

// Helper: replace placeholder tags with actual values
function replaceTags(text: string): string {
  return text.replace(/\{context\}/g, '')
}

// Helper: finalize results (sanitize for JSON serialization)
function finalizeResult(data: any): any {
  if (typeof data === 'string') {
    // First, try to extract JSON from markdown code blocks
    const jsonMatch = data.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    const jsonStr = jsonMatch ? jsonMatch[1] : data
    
    try {
      return JSON.parse(jsonStr)
    } catch {
      // If parsing fails, return the cleaned string
      return jsonStr.trim()
    }
  }
  return data
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication - pass request to get auth token from cookies
    const user = await requireAuth(request)
    
    // Check rate limit
    checkRateLimit(user.id)

    // Parse request body
    const body = await request.json()
    const parsed = GenerateSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.errors },
        { status: 400 }
      )
    }

    const { type, context, title, url, metadata, direction, model, temperature, sessionId, skillSlug, userId } = parsed.data
    const effectiveUserId = userId || user.id

    // Apply brand substitutions
    const brandSubs = await getBrandSubstitutions(effectiveUserId)
    const processedContext = await applyBrandSubstitutions(context, brandSubs)
    const processedTitle = title ? await applyBrandSubstitutions(title, brandSubs) : undefined

    // Create ZAI instance
    const zai = await ZAI.create()

    let result: string

    switch (type) {
      case 'metadata': {
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'assistant',
              content: replaceTags(`You are an expert YouTube SEO specialist and copywriter. Generate optimized metadata for YouTube videos.
              
Rules:
- Titles should be engaging, under 60 characters, and include power words
- Description should be 200-500 words with timestamps
- Tags should be relevant and include long-tail keywords
- Hashtags should be trending and platform-appropriate
- SEO score should reflect title optimization, description quality, and tag relevance

Respond with a JSON object containing:
{
  "titles": ["title1", "title2", "title3"],
  "description": "full description with timestamps",
  "tags": ["tag1", "tag2", "tag3"],
  "hashtags": ["#hashtag1", "#hashtag2"],
  "seoScore": 85,
  "targetAudience": "description of target audience",
  "keyMoments": ["moment1", "moment2", "moment3"]
}`)
            },
            {
              role: 'user',
              content: replaceTags(`Generate YouTube video metadata for the following video context:

${processedContext}

Provide 3 different title options, a comprehensive description with timestamps, relevant tags, hashtags, SEO score, target audience description, and key moments for chapters.`)
            }
          ],
          thinking: { type: 'disabled' }
        })

        result = completion.choices[0]?.message?.content || ''

        // Try to parse the JSON from the response
        let parsedData
        try {
          // Extract JSON if it's wrapped in markdown code blocks
          const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/```\s*([\s\S]*?)\s*```/)
          const jsonStr = jsonMatch ? jsonMatch[1] : result
          parsedData = JSON.parse(jsonStr)
        } catch {
          // If parsing fails, create a structured response
          parsedData = {
            titles: [
              "Comment automatiser votre creation de contenu YouTube",
              "L'IA qui revolutionne la creation de videos",
              "Creez 10x plus de contenu YouTube avec cette methode"
            ],
            description: context,
            tags: ['youtube', 'automation', 'ai', 'content creation'],
            hashtags: ['#YouTubeAutomation', '#AIContent', '#ContentCreator'],
            seoScore: 85,
            targetAudience: "Createurs de contenu YouTube",
            keyMoments: ["Introduction", "Demo", "Resultats"]
          }
        }

        // Sauvegarder en DB si sessionId fourni
        if (sessionId && userId) {
          await saveToSession(sessionId, userId, 'metadata', parsedData, 1500, 0.02)
        }

        return NextResponse.json({
          success: true,
          data: finalizeResult(parsedData),
          usage: { totalTokens: 1500 }
        })
      }

      case 'artistic': {
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'assistant',
              content: replaceTags(`You are an expert creative director and graphic designer specializing in YouTube thumbnails.

Rules:
- Generate 3 distinct artistic directions
- Each direction should have a unique visual identity
- Color palettes should be high-contrast and attention-grabbing
- Typography should be readable and impactful
- Consider YouTube's thumbnail display sizes

Respond with a JSON object containing:
{
  "directions": [
    {
      "name": "Direction Name",
      "style": "modern" | "retro" | "minimalist" | "bold" | "elegant" | "playful",
      "colorPalette": {
        "primary": "#hex",
        "secondary": "#hex",
        "accent": "#hex",
        "background": "#hex",
        "text": "#hex"
      },
      "typography": {
        "headingFont": "Font Name",
        "bodyFont": "Font Name",
        "headingWeight": "700",
        "emphasis": "uppercase" | "lowercase" | "capitalize" | "none"
      },
      "moodKeywords": ["keyword1", "keyword2", "keyword3"],
      "thumbnailConcept": "Brief concept description"
    }
  ]
}`)
            },
            {
              role: 'user',
              content: replaceTags(`Generate 3 artistic directions for YouTube thumbnails based on this video:

Title: ${processedTitle || 'Video title'}
Context: ${processedContext}

Each direction should have a unique style, color palette, typography recommendations, mood keywords, and a brief concept for the thumbnail design.`)
            }
          ],
          thinking: { type: 'disabled' }
        })

        result = completion.choices[0]?.message?.content || ''

        let parsedData
        try {
          const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/```\s*([\s\S]*?)\s*```/)
          const jsonStr = jsonMatch ? jsonMatch[1] : result
          parsedData = JSON.parse(jsonStr)
        } catch {
          parsedData = {
            directions: [
              {
                name: 'Tech Moderne',
                style: 'modern',
                colorPalette: { primary: '#FF6B00', secondary: '#1A1A2E', accent: '#00D9FF', background: '#0F0F1A', text: '#FFFFFF' },
                typography: { headingFont: 'Inter', bodyFont: 'Inter', headingWeight: '800', emphasis: 'uppercase' },
                moodKeywords: ['innovant', 'professionnel', 'high-tech'],
                thumbnailConcept: 'Design moderne avec gradient orange'
              },
              {
                name: 'Minimaliste Elegant',
                style: 'minimalist',
                colorPalette: { primary: '#2D2D2D', secondary: '#F5F5F5', accent: '#FFD700', background: '#FFFFFF', text: '#1A1A1A' },
                typography: { headingFont: 'Playfair Display', bodyFont: 'Lato', headingWeight: '700', emphasis: 'capitalize' },
                moodKeywords: ['elegant', 'epure', 'premium'],
                thumbnailConcept: 'Design minimaliste avec accent dore'
              },
              {
                name: 'Bold Impact',
                style: 'bold',
                colorPalette: { primary: '#FF0050', secondary: '#000000', accent: '#00FF88', background: '#111111', text: '#FFFFFF' },
                typography: { headingFont: 'Bebas Neue', bodyFont: 'Roboto', headingWeight: '900', emphasis: 'uppercase' },
                moodKeywords: ['audacieux', 'percutant', 'energique'],
                thumbnailConcept: 'Design audacieux avec contrastes forts'
              }
            ]
          }
        }

        // Sauvegarder en DB si sessionId fourni
        if (sessionId && userId) {
          await saveToSession(sessionId, userId, 'artistic', parsedData, 1000, 0.015)
        }

        return NextResponse.json({
          success: true,
          data: finalizeResult(parsedData),
          usage: { totalTokens: 1000 }
        })
      }

      case 'social': {
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'assistant',
              content: replaceTags(`You are an expert social media manager specializing in content creator marketing.

Rules for each platform:
- LinkedIn: Professional tone, focus on value and learnings, 1300 chars max, use emojis sparingly
- YouTube Community: Engaging, conversational, encourage interaction, 500 chars max
- TikTok: Fun, trendy, use viral hooks, 150 chars max, include trending hashtags
- X (Twitter): Short, punchy, controversial or surprising takes, 280 chars max
- Instagram: Visual focus, aesthetic emojis, 2200 chars max, use line breaks
- Facebook: Friendly, community-focused, 500 chars max, encourage sharing
- Threads: Conversational, authentic, 500 chars max, questions work well
- School: Educational focus, course-like structure, clear value proposition, 800 chars max

Respond with a JSON object containing:
{
  "posts": [
    {
      "platform": "linkedin" | "youtube_community" | "tiktok" | "x" | "instagram" | "facebook" | "threads" | "school",
      "content": "Post content optimized for platform",
      "hashtags": ["#hashtag1", "#hashtag2"]
    }
  ]
}`)
            },
            {
              role: 'user',
              content: replaceTags(`Generate social media posts for ALL these platforms: LinkedIn, YouTube Community, TikTok, X (Twitter), Instagram, Facebook, Threads, and School.

Video Title: ${processedTitle || 'Video title'}
Video Context: ${processedContext}
Video Tags: ${metadata?.tags?.join(', ') || 'N/A'}

Create platform-optimized posts that will drive engagement and views. Each post must be unique and tailored to the platform's audience.`)
            }
          ],
          thinking: { type: 'disabled' }
        })

        result = completion.choices[0]?.message?.content || ''

        let parsedData
        try {
          const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/```\s*([\s\S]*?)\s*```/)
          const jsonStr = jsonMatch ? jsonMatch[1] : result
          parsedData = JSON.parse(jsonStr)
        } catch {
          parsedData = {
            posts: [
              {
                platform: 'linkedin',
                content: `Nouvelle video ! ${metadata?.title || 'Nouveau contenu'}\n\nDecouvrez comment ameliorer votre productivite avec l'IA.`,
                hashtags: ['#ContentCreation', '#AITools', '#YouTube']
              },
              {
                platform: 'youtube_community',
                content: `Nouvelle video en ligne ! ${metadata?.title || 'Nouveau contenu'}`,
                hashtags: ['#YouTube', '#ContentCreator']
              },
              {
                platform: 'tiktok',
                content: `POV: Tu decouvre cette technique 🤯 ${metadata?.title || 'Nouveau contenu'}`,
                hashtags: ['#fyp', '#pourtoi', '#tutoriel']
              },
              {
                platform: 'x',
                content: `${metadata?.title || 'Nouveau contenu'} - Tu ne vas pas en revenir... 👀`,
                hashtags: ['#Nouveau']
              },
              {
                platform: 'instagram',
                content: `Nouvelle video en ligne ! 🎬\n\n${metadata?.title || 'Nouveau contenu'}\n\nLien en bio 👆`,
                hashtags: ['#ContentCreator', '#YouTube']
              },
              {
                platform: 'facebook',
                content: `Nouvelle video publiee ! ${metadata?.title || 'Nouveau contenu'}\n\nLikez et partagez !`,
                hashtags: ['#Video', '#Contenu']
              },
              {
                platform: 'threads',
                content: `Quoi de neuf ? Une nouvelle video ! ${metadata?.title || 'Nouveau contenu'}`,
                hashtags: ['#Nouveau']
              },
              {
                platform: 'school',
                content: `Apprenez a ${metadata?.title?.toLowerCase() || 'creer du contenu'} avec cette nouvelle formation.`,
                hashtags: ['#Formation', '#YouTube']
              }
            ]
          }
        }

        // Sauvegarder en DB si sessionId fourni
        if (sessionId && userId) {
          await saveToSession(sessionId, userId, 'social', parsedData, 1500, 0.02)
        }

        return NextResponse.json({
          success: true,
          data: finalizeResult(parsedData),
          usage: { totalTokens: 1500 }
        })
      }

      case 'thumbnail_prompt': {
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'assistant',
              content: replaceTags(`You are an expert prompt engineer for AI image generation, specializing in YouTube thumbnails. Generate detailed image prompts that will create compelling, click-worthy thumbnails. The prompts should describe visual compositions optimized for 16:9 aspect ratio.`)
            },
            {
              role: 'user',
              content: replaceTags(`Create a detailed image generation prompt for a YouTube thumbnail based on:

Title: ${processedTitle || 'Video title'}
Artistic Direction: ${JSON.stringify(direction)}
Context: ${processedContext}

The prompt should:
- Describe a compelling, click-worthy thumbnail composition
- Include color guidance matching the palette
- Specify text overlay placement (leave space for text)
- Be optimized for AI image generation
- Result in a 16:9 aspect ratio image`)
            }
          ],
          thinking: { type: 'disabled' }
        })

        result = completion.choices[0]?.message?.content || ''

        return NextResponse.json({
          success: true,
          data: finalizeResult(result),
          usage: { totalTokens: 500 }
        })
      }

      case 'thumbnail-titles': {
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'assistant',
              content: replaceTags(`You are an expert YouTube thumbnail copywriter. Generate catchy, attention-grabbing titles for YouTube thumbnails.

Rules:
- Main title should be 2-4 words MAX, all caps, attention-grabbing
- Short title should be 1-2 words MAX, creates urgency or curiosity
- Use power words like: SECRET, METHODE, MAINTENANT, RAPIDEMENT, FACILEMENT
- Avoid punctuation
- Make it click-worthy without being clickbait
- Titles should work well overlaid on a thumbnail image

Respond with a JSON object containing:
{
  "mainTitle": "MAIN TITLE HERE",
  "shortTitle": "SHORT",
  "alternatives": [
    {"mainTitle": "ALT 1", "shortTitle": "NOW"},
    {"mainTitle": "ALT 2", "shortTitle": "FAST"}
  ]
}`)
            },
            {
              role: 'user',
              content: replaceTags(`Generate catchy thumbnail titles for a YouTube video titled:

"${processedContext}"

Create a main title (2-4 words, uppercase) and a short title (1-2 words, uppercase) that will make people want to click. Focus on the core benefit or curiosity factor.`)
            }
          ],
          thinking: { type: 'disabled' }
        })

        result = completion.choices[0]?.message?.content || ''

        let parsedData
        try {
          const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/```\s*([\s\S]*?)\s*```/)
          const jsonStr = jsonMatch ? jsonMatch[1] : result
          parsedData = JSON.parse(jsonStr)
        } catch {
          // Fallback based on video title
          const words = context.replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, "").split(" ").filter((w) => w.length > 2)
          parsedData = {
            mainTitle: words.slice(0, 2).join(" ").toUpperCase() || "DÉCOUVREZ",
            shortTitle: words.length > 2 ? words.slice(2, 3).join(" ").toUpperCase() : "MAINTENANT",
            alternatives: [
              { mainTitle: "MÉTHODE SECRÈTE", shortTitle: "EXCLU" },
              { mainTitle: "RÉSULTATS RAPIDES", shortTitle: "VITE" }
            ]
          }
        }

        return NextResponse.json({
          success: true,
          data: finalizeResult(parsedData),
          usage: { totalTokens: 300 }
        })
      }

      case 'finance': {
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'assistant',
              content: replaceTags(`You are a senior financial analyst and CFO consultant. Generate comprehensive financial analysis and projections.

Respond with a JSON object containing:
{
  "summary": "Executive summary of the financial analysis",
  "revenue": { "current": 0, "projected": 0, "growth": "X%" },
  "expenses": { "current": 0, "projected": 0, "optimization": "X%" },
  "profitMargin": "X%",
  "cashflow": {
    "monthly": [{"month": "Jan", "income": 0, "expenses": 0, "net": 0}],
    "runway": "X months"
  },
  "kpis": [
    {"name": "KPI Name", "value": "X", "trend": "up|down|stable", "description": "..."}
  ],
  "recommendations": ["recommendation1", "recommendation2"],
  "risks": [{"risk": "...", "impact": "high|medium|low", "mitigation": "..."}],
  "forecast": { "optimistic": 0, "realistic": 0, "pessimistic": 0 }
}`)
            },
            {
              role: 'user',
              content: replaceTags(`Analyze and generate financial projections for:\n\n${processedContext}\n\nProvide a comprehensive financial report with revenue projections, expense analysis, cashflow forecasting, KPIs, risks, and strategic recommendations.`)
            }
          ],
          thinking: { type: 'disabled' }
        })

        result = completion.choices[0]?.message?.content || ''

        let parsedData
        try {
          const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/```\s*([\s\S]*?)\s*```/)
          const jsonStr = jsonMatch ? jsonMatch[1] : result
          parsedData = JSON.parse(jsonStr)
        } catch {
          parsedData = {
            summary: "Analyse financiere basee sur les donnees fournies. Croissance projetee a 15% sur 12 mois.",
            revenue: { current: 50000, projected: 57500, growth: "15%" },
            expenses: { current: 35000, projected: 33250, optimization: "5%" },
            profitMargin: "42.2%",
            cashflow: {
              monthly: [
                { month: "Jan", income: 4500, expenses: 3200, net: 1300 },
                { month: "Fev", income: 4800, expenses: 3100, net: 1700 },
                { month: "Mar", income: 5200, expenses: 3300, net: 1900 },
                { month: "Avr", income: 4900, expenses: 3000, net: 1900 },
                { month: "Mai", income: 5500, expenses: 3400, net: 2100 },
                { month: "Jun", income: 5800, expenses: 3200, net: 2600 },
              ],
              runway: "18 mois"
            },
            kpis: [
              { name: "MRR", value: "4 800€", trend: "up", description: "Revenu mensuel recurrent" },
              { name: "CAC", value: "45€", trend: "down", description: "Cout d'acquisition client" },
              { name: "LTV", value: "540€", trend: "up", description: "Valeur vie client" },
              { name: "Churn", value: "3.2%", trend: "stable", description: "Taux de resiliation" },
            ],
            recommendations: [
              "Investir dans l'acquisition organique pour reduire le CAC",
              "Automatiser les processus repetitifs pour optimiser les couts",
              "Diversifier les sources de revenus avec des upsells",
              "Constituer une reserve de tresorerie de 3 mois",
            ],
            risks: [
              { risk: "Dependance a un seul canal d'acquisition", impact: "high", mitigation: "Diversifier SEO + Paid + Referral" },
              { risk: "Hausse des couts serveur avec la croissance", impact: "medium", mitigation: "Optimiser l'infrastructure et negocier les contrats" },
            ],
            forecast: { optimistic: 72000, realistic: 57500, pessimistic: 45000 }
          }
        }

        return NextResponse.json({ success: true, data: finalizeResult(parsedData), usage: { totalTokens: 2000 } })
      }

      case 'marketing': {
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'assistant',
              content: replaceTags(`You are a world-class marketing strategist and growth hacker. Generate comprehensive marketing plans.

Respond with a JSON object containing:
{
  "strategy": {
    "positioning": "Brand positioning statement",
    "uniqueValue": "Unique value proposition",
    "targetMarket": "Target market description"
  },
  "personas": [
    {"name": "Persona Name", "age": "25-35", "occupation": "...", "painPoints": ["..."], "goals": ["..."], "channels": ["..."]}
  ],
  "campaigns": [
    {"name": "Campaign Name", "channel": "...", "objective": "...", "budget": "...", "duration": "...", "expectedROI": "...", "tactics": ["..."]}
  ],
  "contentPlan": [
    {"week": 1, "theme": "...", "content": ["..."], "platforms": ["..."]}
  ],
  "funnels": {
    "awareness": {"tactics": ["..."], "metrics": ["..."]},
    "consideration": {"tactics": ["..."], "metrics": ["..."]},
    "conversion": {"tactics": ["..."], "metrics": ["..."]},
    "retention": {"tactics": ["..."], "metrics": ["..."]}
  },
  "budget": {"total": "...", "breakdown": [{"channel": "...", "amount": "...", "percentage": "..."}]},
  "timeline": [{"phase": "...", "duration": "...", "goals": ["..."]}]
}`)
            },
            {
              role: 'user',
              content: replaceTags(`Create a comprehensive marketing strategy for:\n\n${processedContext}\n\nInclude buyer personas, campaign ideas, content calendar, funnel strategy, budget allocation, and timeline.`)
            }
          ],
          thinking: { type: 'disabled' }
        })

        result = completion.choices[0]?.message?.content || ''

        let parsedData
        try {
          const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/```\s*([\s\S]*?)\s*```/)
          const jsonStr = jsonMatch ? jsonMatch[1] : result
          parsedData = JSON.parse(jsonStr)
        } catch {
          parsedData = {
            strategy: {
              positioning: "Solution IA premium pour les createurs de contenu",
              uniqueValue: "Automatisation intelligente qui preserve l'authenticite",
              targetMarket: "Createurs de contenu francophones (10K-500K abonnes)"
            },
            personas: [
              { name: "Sophie la Creatrice", age: "25-35", occupation: "YouTubeuse lifestyle", painPoints: ["Manque de temps", "Qualite inconsistante"], goals: ["10K vues/video", "Monetisation"], channels: ["Instagram", "YouTube", "TikTok"] },
              { name: "Marc l'Entrepreneur", age: "30-45", occupation: "CEO startup", painPoints: ["Budget marketing limite", "Pas d'equipe dediee"], goals: ["Generer des leads", "Etablir l'autorite"], channels: ["LinkedIn", "YouTube", "Newsletter"] },
            ],
            campaigns: [
              { name: "Lancement Beta", channel: "Multi-canal", objective: "500 inscrits beta", budget: "2 000€", duration: "4 semaines", expectedROI: "300%", tactics: ["Influencer outreach", "Content marketing", "Webinaire"] },
              { name: "Social Proof", channel: "LinkedIn + YouTube", objective: "Credibilite", budget: "1 000€", duration: "Ongoing", expectedROI: "150%", tactics: ["Case studies", "Temoignages video", "Behind the scenes"] },
            ],
            contentPlan: [
              { week: 1, theme: "Problematique", content: ["Article blog", "Carrousel Instagram", "Thread X"], platforms: ["Blog", "Instagram", "X"] },
              { week: 2, theme: "Solution", content: ["Video demo", "Post LinkedIn", "Newsletter"], platforms: ["YouTube", "LinkedIn", "Email"] },
              { week: 3, theme: "Social Proof", content: ["Temoignage client", "Before/After", "Tips"], platforms: ["YouTube", "Instagram", "TikTok"] },
              { week: 4, theme: "CTA", content: ["Webinaire", "Offre limitee", "Recap"], platforms: ["Zoom", "All platforms", "Email"] },
            ],
            funnels: {
              awareness: { tactics: ["SEO", "Reseaux sociaux", "PR"], metrics: ["Impressions", "Reach", "Trafic"] },
              consideration: { tactics: ["Content marketing", "Webinaires", "Free trial"], metrics: ["Time on page", "Sign-ups", "Engagement"] },
              conversion: { tactics: ["Email nurturing", "Demo", "Offre limitee"], metrics: ["Conversion rate", "CAC", "Revenue"] },
              retention: { tactics: ["Onboarding", "Support", "Community"], metrics: ["Churn", "NPS", "LTV"] },
            },
            budget: {
              total: "5 000€/mois", breakdown: [
                { channel: "Content Creation", amount: "2 000€", percentage: "40%" },
                { channel: "Paid Ads", amount: "1 500€", percentage: "30%" },
                { channel: "Tools & Software", amount: "500€", percentage: "10%" },
                { channel: "Influencer", amount: "1 000€", percentage: "20%" },
              ]
            },
            timeline: [
              { phase: "Setup", duration: "2 semaines", goals: ["Branding", "Landing page", "Content pipeline"] },
              { phase: "Launch", duration: "4 semaines", goals: ["500 inscrits", "50 clients beta", "10 temoignages"] },
              { phase: "Scale", duration: "3 mois", goals: ["2000 utilisateurs", "MRR 10K€", "3 partenariats"] },
            ]
          }
        }

        return NextResponse.json({ success: true, data: finalizeResult(parsedData), usage: { totalTokens: 2500 } })
      }

      case 'business': {
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'assistant',
              content: replaceTags(`You are a senior business consultant specializing in document generation. Create professional business documents.

Respond with a JSON object containing:
{
  "document": {
    "type": "business_plan|proposal|contract|report",
    "title": "Document Title",
    "sections": [
      {"title": "Section Title", "content": "Section content...", "subsections": []}
    ]
  },
  "executiveSummary": "Brief executive summary",
  "keyMetrics": [{"label": "...", "value": "...", "description": "..."}],
  "actionItems": [{"task": "...", "priority": "high|medium|low", "deadline": "...", "owner": "..."}],
  "appendix": [{"title": "...", "content": "..."}]
}`)
            },
            {
              role: 'user',
              content: replaceTags(`Generate a professional business document for:\n\n${processedContext}\n\nCreate a comprehensive, well-structured document with all necessary sections, metrics, and action items.`)
            }
          ],
          thinking: { type: 'disabled' }
        })

        result = completion.choices[0]?.message?.content || ''

        let parsedData
        try {
          const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/```\s*([\s\S]*?)\s*```/)
          const jsonStr = jsonMatch ? jsonMatch[1] : result
          parsedData = JSON.parse(jsonStr)
        } catch {
          parsedData = {
            document: {
              type: "business_plan",
              title: "Business Plan - " + context.slice(0, 50),
              sections: [
                { title: "Resume Executif", content: "Ce document presente la strategie et les projections pour le projet decrit.", subsections: [] },
                {
                  title: "Analyse de Marche", content: "Le marche cible represente une opportunite significative avec une croissance annuelle estimee a 25%.", subsections: [
                    { title: "Taille du Marche", content: "Le marche adressable total (TAM) est estime a 5 milliards d'euros." },
                    { title: "Tendances", content: "Croissance de l'IA, automatisation, et demande de contenu." },
                  ]
                },
                { title: "Modele Economique", content: "Modele SaaS avec abonnements mensuels. 3 tiers : Starter (29€), Pro (79€), Enterprise (199€).", subsections: [] },
                { title: "Plan Operationnel", content: "Equipe de 5 personnes. Infrastructure cloud scalable. Support client 24/7.", subsections: [] },
                { title: "Projections Financieres", content: "Objectif de rentabilite a 18 mois. MRR cible : 50K€ a 12 mois.", subsections: [] },
              ]
            },
            executiveSummary: "Projet innovant dans le secteur de l'IA appliquee. Marche en forte croissance. Equipe experimentee. ROI prevu sous 18 mois.",
            keyMetrics: [
              { label: "TAM", value: "5 Mds€", description: "Marche adressable total" },
              { label: "Break-even", value: "18 mois", description: "Point de rentabilite" },
              { label: "MRR Cible", value: "50K€", description: "Revenu mensuel a 12 mois" },
              { label: "Equipe", value: "5 pers.", description: "Effectif initial" },
            ],
            actionItems: [
              { task: "Finaliser le MVP", priority: "high", deadline: "T1 2024", owner: "CTO" },
              { task: "Recruter 2 developpeurs", priority: "high", deadline: "T1 2024", owner: "CEO" },
              { task: "Lancer la campagne marketing", priority: "medium", deadline: "T2 2024", owner: "CMO" },
              { task: "Premier round de financement", priority: "high", deadline: "T2 2024", owner: "CEO" },
            ],
            appendix: [
              { title: "Analyse SWOT", content: "Forces: Technologie unique, equipe. Faiblesses: Notoriete. Opportunites: Marche croissant. Menaces: Concurrence." },
            ]
          }
        }

        return NextResponse.json({ success: true, data: finalizeResult(parsedData), usage: { totalTokens: 3000 } })
      }

      case 'social_batch': {
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'assistant',
              content: replaceTags(`You are a viral content expert and social media strategist. Generate batch social media content optimized for engagement.

Respond with a JSON object containing:
{
  "hooks": [
    {"text": "Viral hook text", "platform": "tiktok|instagram|x", "viralScore": 85, "type": "question|shock|curiosity|challenge"}
  ],
  "posts": [
    {"platform": "...", "content": "...", "hashtags": ["..."], "bestTime": "...", "estimatedReach": "...", "type": "carousel|reel|story|post"}
  ],
  "calendar": [
    {"day": "Lundi", "posts": [{"time": "09:00", "platform": "...", "content_summary": "..."}]}
  ],
  "trends": [{"trend": "...", "relevance": "high|medium", "suggestion": "..."}],
  "abTests": [{"variant_a": "...", "variant_b": "...", "metric": "..."}]
}`)
            },
            {
              role: 'user',
              content: replaceTags(`Generate a batch of social media content for:\n\n${processedContext}\n\nCreate viral hooks, platform-optimized posts, a weekly calendar, trend suggestions, and A/B test ideas. Focus on maximum engagement.`)
            }
          ],
          thinking: { type: 'disabled' }
        })

        result = completion.choices[0]?.message?.content || ''

        let parsedData
        try {
          const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/```\s*([\s\S]*?)\s*```/)
          const jsonStr = jsonMatch ? jsonMatch[1] : result
          parsedData = JSON.parse(jsonStr)
        } catch {
          parsedData = {
            hooks: [
              { text: "Arretez de poster du contenu. Faites CECI a la place 👇", platform: "tiktok", viralScore: 92, type: "shock" },
              { text: "J'ai gagne 10K abonnes en 30 jours avec cette methode...", platform: "instagram", viralScore: 88, type: "curiosity" },
              { text: "Le secret que les gros comptes ne veulent pas que vous sachiez", platform: "x", viralScore: 85, type: "curiosity" },
              { text: "Vous faites tous la meme erreur sur LinkedIn. Voici pourquoi.", platform: "x", viralScore: 90, type: "shock" },
              { text: "POV: Tu decouvres l'IA qui fait ton contenu a ta place", platform: "tiktok", viralScore: 87, type: "curiosity" },
            ],
            posts: [
              { platform: "instagram", content: "5 outils IA que j'utilise chaque jour 🔧\n\n1️⃣ ChatGPT - Ideation\n2️⃣ Midjourney - Visuels\n3️⃣ Descript - Montage\n4️⃣ Canva - Design\n5️⃣ Notre outil - Tout automatiser\n\n💾 Enregistre ce post pour plus tard !", hashtags: ["#IA", "#ContentCreator", "#Tools", "#Productivite"], bestTime: "12:00", estimatedReach: "5K-15K", type: "carousel" },
              { platform: "tiktok", content: "POV: Tu passes de 3h a 15min pour creer ton contenu 🤯\n\n#productivite #ia #contentcreator", hashtags: ["#fyp", "#pourtoi", "#ia", "#contentcreator"], bestTime: "18:00", estimatedReach: "10K-50K", type: "reel" },
              { platform: "linkedin", content: "J'ai automatise 80% de ma creation de contenu.\n\nVoici ce que j'ai appris en 3 mois :\n\n📌 L'IA ne remplace pas la creativite\n📌 Elle accelere l'execution\n📌 La qualite augmente quand on a plus de temps\n\nResultat : 3x plus de contenu, meilleur engagement.\n\nQuel outil utilisez-vous pour votre contenu ?", hashtags: ["#ContentMarketing", "#IA", "#Productivite"], bestTime: "08:30", estimatedReach: "2K-8K", type: "post" },
              { platform: "x", content: "Les createurs qui n'utilisent pas l'IA en 2024 sont comme ceux qui refusaient les reseaux sociaux en 2015.\n\nDans 2 ans, ils regretteront.", hashtags: ["#IA", "#Content"], bestTime: "09:00", estimatedReach: "1K-5K", type: "post" },
            ],
            calendar: [
              { day: "Lundi", posts: [{ time: "08:30", platform: "LinkedIn", content_summary: "Post educatif IA" }, { time: "12:00", platform: "Instagram", content_summary: "Carrousel tips" }] },
              { day: "Mardi", posts: [{ time: "09:00", platform: "X", content_summary: "Take controverse" }, { time: "18:00", platform: "TikTok", content_summary: "Reel POV" }] },
              { day: "Mercredi", posts: [{ time: "12:00", platform: "YouTube", content_summary: "Video longue" }, { time: "14:00", platform: "LinkedIn", content_summary: "Behind the scenes" }] },
              { day: "Jeudi", posts: [{ time: "08:30", platform: "Instagram", content_summary: "Story interactive" }, { time: "18:00", platform: "TikTok", content_summary: "Hook viral" }] },
              { day: "Vendredi", posts: [{ time: "09:00", platform: "X", content_summary: "Thread temoignage" }, { time: "12:00", platform: "LinkedIn", content_summary: "Recap semaine" }] },
            ],
            trends: [
              { trend: "IA generative", relevance: "high", suggestion: "Creer du contenu montrant les coulisses de l'utilisation IA" },
              { trend: "Authenticite", relevance: "high", suggestion: "Montrer les echecs et les apprentissages" },
              { trend: "Format court", relevance: "medium", suggestion: "Adapter les contenus longs en shorts/reels" },
            ],
            abTests: [
              { variant_a: "Hook: Question directe", variant_b: "Hook: Statistique choc", metric: "Taux d'engagement" },
              { variant_a: "Post avec emojis", variant_b: "Post sans emojis", metric: "Taux de clic" },
            ]
          }
        }

        return NextResponse.json({ success: true, data: finalizeResult(parsedData), usage: { totalTokens: 2000 } })
      }

      case 'skill_execution': {
        if (!body.skillSlug) {
          return apiError('skillSlug est requis pour skill_execution', 400)
        }

        // 1. Fetch skill and its agent from DB
        const skill = await db.skill.findUnique({
          where: { slug: body.skillSlug },
          include: { agent: true }
        })

        // Built-in prompts for fallback when skill not found
        const builtInPrompts: Record<string, { system: string; user: string }> = {
          'youtube-extraction': {
            system: `You are an expert YouTube SEO specialist and copywriter. Generate optimized metadata for YouTube videos.

Rules:
- Titles should be engaging, under 60 characters, and include power words
- Description should be 200-500 words with timestamps
- Tags should be relevant and include long-tail keywords
- Hashtags should be trending and platform-appropriate
- SEO score should reflect title optimization, description quality, and tag relevance

Respond with a JSON object containing:
{
  "titles": ["title1", "title2", "title3"],
  "description": "full description with timestamps",
  "tags": ["tag1", "tag2", "tag3"],
  "hashtags": ["#hashtag1", "#hashtag2"],
  "seoScore": 85,
  "targetAudience": "description of target audience",
  "keyMoments": ["moment1", "moment2", "moment3"]
}`,
            user: `Generate YouTube video metadata for the following video context:

{CONTEXT}

Provide 3 different title options, a comprehensive description with timestamps, relevant tags, hashtags, SEO score, target audience description, and key moments for chapters.`
          },
          'artistic-directions': {
            system: `You are an expert creative director and graphic designer specializing in YouTube thumbnails.

Rules:
- Generate 3 distinct artistic directions
- Each direction should have a unique visual identity
- Color palettes should be high-contrast and attention-grabbing
- Typography should be readable and impactful

Respond with a JSON object containing:
{
  "directions": [
    {
      "name": "Direction Name",
      "style": "modern" | "retro" | "minimalist" | "bold" | "elegant" | "playful",
      "colorPalette": {
        "primary": "#hex",
        "secondary": "#hex",
        "accent": "#hex",
        "background": "#hex",
        "text": "#hex"
      },
      "typography": {
        "headingFont": "Font Name",
        "bodyFont": "Font Name",
        "headingWeight": "700",
        "emphasis": "uppercase" | "lowercase" | "capitalize" | "none"
      },
      "moodKeywords": ["keyword1", "keyword2", "keyword3"],
      "thumbnailConcept": "Brief concept description"
    }
  ]
}`,
            user: `Generate 3 artistic directions for YouTube thumbnails based on this video:

Context: {CONTEXT}

Each direction should have a unique style, color palette, typography recommendations, mood keywords, and a brief concept for the thumbnail design.`
          },
          'social-posts': {
            system: `You are an expert social media manager specializing in content creator marketing.

Rules for each platform:
- LinkedIn: Professional tone, focus on value and learnings, 1300 chars max, use emojis sparingly
- YouTube Community: Engaging, conversational, encourage interaction, 500 chars max
- TikTok: Fun, trendy, use viral hooks, 150 chars max, include trending hashtags
- X (Twitter): Short, punchy, controversial or surprising takes, 280 chars max
- Instagram: Visual focus, aesthetic emojis, 2200 chars max, use line breaks
- Facebook: Friendly, community-focused, 500 chars max, encourage sharing
- Threads: Conversational, authentic, 500 chars max, questions work well
- School: Educational focus, course-like structure, clear value proposition, 800 chars max

Respond with a JSON object containing:
{
  "posts": [
    {
      "platform": "linkedin" | "youtube_community" | "tiktok" | "x" | "instagram" | "facebook" | "threads" | "school",
      "content": "Post content optimized for platform",
      "hashtags": ["#hashtag1", "#hashtag2"]
    }
  ]
}`,
            user: `Generate social media posts for ALL these platforms: LinkedIn, YouTube Community, TikTok, X (Twitter), Instagram, Facebook, Threads, and School.

Video Context: {CONTEXT}

Create platform-optimized posts that will drive engagement and views. Each post must be unique and tailored to the platform's audience.`
          },
          'thumbnail-titles': {
            system: `You are an expert YouTube thumbnail copywriter. Generate catchy, attention-grabbing titles for YouTube thumbnails.

Rules:
- Main title should be 2-4 words MAX, all caps, attention-grabbing
- Short title should be 1-2 words MAX, creates urgency or curiosity
- Use power words like: SECRET, METHODE, MAINTENANT, RAPIDEMENT, FACILEMENT
- Avoid punctuation
- Make it click-worthy without being clickbait

Respond with a JSON object containing:
{
  "mainTitle": "MAIN TITLE HERE",
  "shortTitle": "SHORT",
  "alternatives": [
    {"mainTitle": "ALT 1", "shortTitle": "NOW"},
    {"mainTitle": "ALT 2", "shortTitle": "FAST"}
  ]
}`,
            user: `Generate catchy thumbnail titles for a YouTube video titled:

"{CONTEXT}"

Create a main title (2-4 words, uppercase) and a short title (1-2 words, uppercase) that will make people want to click. Focus on the core benefit or curiosity factor.`
          },
          'content-analyst': {
            system: `You are a senior content strategist and analyst. Analyze content and provide strategic insights.

Respond with a JSON object containing:
{
  "blueprint": {
    "summary": "Brief content summary",
    "targetAudience": "Who should watch this",
    "keyTopics": ["topic1", "topic2"],
    "contentAngle": "Unique angle or perspective",
    "recommendedPlatforms": ["platform1", "platform2"],
    "estimatedPerformance": "High/Medium/Low with reasoning",
    "improvementSuggestions": ["suggestion1", "suggestion2"]
  }
}`,
            user: `Analyze this content and provide strategic insights:

{CONTEXT}`
          },
          'guimkt-threads-viral-content': {
            system: `You are a viral content expert specializing in Threads and social media. Create engaging, shareable posts that maximize reach.

Focus on:
- Authentic, conversational tone
- Questions that spark discussion
- Relatable experiences
- Timely references

Respond with a JSON object containing:
{
  "posts": [
    {
      "platform": "threads" | "instagram" | "x" | "tiktok" | "linkedin" | "youtube_community" | "facebook" | "school",
      "content": "Post content optimized for platform",
      "hashtags": ["#hashtag1", "#hashtag2"]
    }
  ]
}`,
            user: `Generate viral social media posts for all platforms:

Context: {CONTEXT}

Create authentic, engaging posts optimized for each platform.`
          },
          'guimkt-classic-ad-creative-final': {
            system: `You are a professional advertising copywriter. Create conversion-focused social media posts with clear brand messaging.

Focus on:
- Clear value propositions
- Strong calls-to-action
- Professional tone
- Benefits-focused copy

Respond with a JSON object containing:
{
  "posts": [
    {
      "platform": "linkedin" | "youtube_community" | "tiktok" | "x" | "instagram" | "facebook" | "threads" | "school",
      "content": "Professional post content",
      "hashtags": ["#hashtag1", "#hashtag2"]
    }
  ]
}`,
            user: `Generate professional social media posts for all platforms:

Context: {CONTEXT}

Create conversion-focused posts with clear calls-to-action for each platform.`
          }
        }

        // FALLBACK: If skill not found, use built-in prompts
        if (!skill) {
          console.log(`[API] Skill "${body.skillSlug}" not found, using built-in fallback`)

          const builtIn = builtInPrompts[body.skillSlug]

          if (builtIn) {
            const userPrompt = builtIn.user.replace('{CONTEXT}', processedContext)

            const aiResponse = await generateAIResponse(builtIn.system, userPrompt, {
              model: body.model || 'anthropic/claude-3-5-sonnet',
              temperature: body.temperature || 0.7,
              userId: userId
            })

            return NextResponse.json({
              success: true,
              data: finalizeResult(aiResponse.content),
              usage: { totalTokens: aiResponse.tokensUsed, model: aiResponse.model }
            })
          }

          return apiError(`Skill introuvable: ${body.skillSlug}`, 404)
        }

        // 2. Prepare robust System Prompt with XML tagging for XML-native models like Claude
        const agentPersona = skill.agent?.systemPrompt || 'You are a professional AI assistant.'
        const skillKnowledge = skill.promptTemplate
        
        const systemPrompt = `<instruction_priority>
CRITICAL: You must respond in the EXACT same language as the user input (French, Spanish, etc.). 
NEVER use English unless the user speaks English to you.
Execute tasks directly. No meta-talk. No "Options A/B".
</instruction_priority>

<agent_persona>
${agentPersona}
</agent_persona>

<knowledge_base_esc>
${skillKnowledge}
</knowledge_base_esc>

<final_directive>
1. DETECT LANGUAGE: Identify the user's language and respond in that language ONLY.
2. LIVE CONTENT ANALYSIS: If you see a [CONTENU RÉEL DE L'URL] block, YOU MUST ANALYZE THIS SPECIFIC CONTENT. 
3. NO PLACEHOLDERS: NEVER use generic placeholders like "widgets bleus" or "example.com" if real content is provided. Be surgical.
4. DIRECT TASK EXECUTION: Execute the request NOW using the knowledge base + the real URL content.
5. DO NOT offer a consultation. DO NOT ask "what is your sector?". You have the URL, analyze it.
</final_directive>`

        // 3. User Prompt
        const userPrompt = processedContext

        // 4. Generate response using the universal AI provider (with fallbacks)
        console.log(`[API Generate] Calling AI for skill: ${body.skillSlug}`)
        console.log(`[API Generate] System prompt length: ${systemPrompt.length}`)
        console.log(`[API Generate] User prompt length: ${userPrompt.length}`)
        
        const aiResponse = await generateAIResponse(systemPrompt, userPrompt, {
          model: body.model || 'anthropic/claude-3-5-sonnet',
          temperature: body.temperature || 0.7,
          userId: userId
        })

        console.log(`[API Generate] AI Response received. Tokens: ${aiResponse.tokensUsed}`)
        console.log(`[API Generate] Content preview: ${aiResponse.content?.slice(0, 200)}...`)

        // 5. Sauvegarder en DB si sessionId fourni
        if (sessionId && userId) {
          await db.usageRecord.create({
            data: {
              userId,
              action: `skill_execute_${body.skillSlug}`,
              resourceId: sessionId,
              resourceType: 'content_session',
              tokensUsed: aiResponse.tokensUsed,
              cost: 0, // Calculated later or handled by service
              metadata: JSON.stringify({ slug: body.skillSlug, model: aiResponse.model })
            }
          })
        }

        return NextResponse.json({
          success: true,
          data: finalizeResult(aiResponse.content),
          usage: { totalTokens: aiResponse.tokensUsed, model: aiResponse.model }
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid generation type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
