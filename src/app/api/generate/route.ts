import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
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
        metadata: JSON.stringify({ type, model: 'openrouter' })
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
        { error: 'Invalid request body', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { type, context, title, url, metadata, direction, model, temperature, sessionId, skillSlug, userId } = parsed.data
    const effectiveUserId = userId || user.id

    // Apply brand substitutions
    const brandSubs = await getBrandSubstitutions(effectiveUserId)
    const processedContext = await applyBrandSubstitutions(context, brandSubs)
    const processedTitle = title ? await applyBrandSubstitutions(title, brandSubs) : undefined

    let result: any

    switch (type) {
      case 'metadata': {
        const systemPrompt = `You are an expert YouTube SEO specialist and copywriter. Generate optimized metadata for YouTube videos.
        
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
}`

        const userPrompt = `Generate YouTube video metadata for the following video context:

${processedContext}

Provide 3 different title options, a comprehensive description with timestamps, relevant tags, hashtags, SEO score, target audience description, and key moments for chapters.`

        const aiResponse = await generateAIResponse(systemPrompt, userPrompt, { 
          temperature: temperature || 0.7,
          userId: effectiveUserId 
        })
        result = aiResponse.content

        let parsedData
        try {
          const content = result
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/)
          const jsonStr = jsonMatch ? jsonMatch[1] : content
          parsedData = JSON.parse(jsonStr)
        } catch (err) {
          console.error('Metadata parsing error:', err)
          return NextResponse.json(
            { error: 'Failed to generate valid metadata JSON', details: err instanceof Error ? err.message : String(err) },
            { status: 500 }
          )
        }

        // Sauvegarder en DB si sessionId fourni
        if (sessionId && effectiveUserId) {
          await saveToSession(sessionId, effectiveUserId, 'metadata', parsedData, 1500, 0.02)
        }

        return NextResponse.json({
          success: true,
          data: finalizeResult(parsedData),
          usage: { totalTokens: 1500 }
        })
      }

      case 'artistic': {
        const systemPrompt = `You are an expert creative director and graphic designer specializing in YouTube thumbnails.

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
}`

        const userPrompt = `Generate 3 artistic directions for YouTube thumbnails based on this video:

Title: ${processedTitle || 'Video title'}
Context: ${processedContext}

Each direction should have a unique style, color palette, typography recommendations, mood keywords, and a brief concept for the thumbnail design.`

        const aiResponse = await generateAIResponse(systemPrompt, userPrompt, { 
          temperature: temperature || 0.7,
          userId: effectiveUserId 
        })
        result = aiResponse.content

        let parsedData
        try {
          const content = result
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/)
          const jsonStr = jsonMatch ? jsonMatch[1] : content
          parsedData = JSON.parse(jsonStr)
        } catch (err) {
          console.error('Artistic directions parsing error:', err)
          return NextResponse.json(
            { error: 'Failed to generate valid artistic directions JSON', details: err instanceof Error ? err.message : String(err) },
            { status: 500 }
          )
        }

        // Sauvegarder en DB si sessionId fourni
        if (sessionId && effectiveUserId) {
          await saveToSession(sessionId, effectiveUserId, 'artistic', parsedData, 1000, 0.015)
        }

        return NextResponse.json({
          success: true,
          data: finalizeResult(parsedData),
          usage: { totalTokens: 1000 }
        })
      }

      case 'social': {
        const systemPrompt = `You are an expert social media manager specializing in content creator marketing.

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
}`

        const userPrompt = `Generate social media posts for ALL these platforms: LinkedIn, YouTube Community, TikTok, X (Twitter), Instagram, Facebook, Threads, and School.

Video Title: ${processedTitle || 'Video title'}
Video Context: ${processedContext}
Video Tags: ${metadata?.tags?.join(', ') || 'N/A'}

Create platform-optimized posts that will drive engagement and views. Each post must be unique and tailored to the platform's audience.`

        const aiResponse = await generateAIResponse(systemPrompt, userPrompt, { 
          temperature: temperature || 0.7,
          userId: effectiveUserId 
        })
        result = aiResponse.content

        let parsedData
        try {
          const content = result
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/)
          const jsonStr = jsonMatch ? jsonMatch[1] : content
          parsedData = JSON.parse(jsonStr)
        } catch (err) {
          console.error('Social posts parsing error:', err)
          return NextResponse.json(
            { error: 'Failed to generate valid social posts JSON', details: err instanceof Error ? err.message : String(err) },
            { status: 500 }
          )
        }

        // Sauvegarder en DB si sessionId fourni
        if (sessionId && effectiveUserId) {
          await saveToSession(sessionId, effectiveUserId, 'social', parsedData, 1500, 0.02)
        }

        return NextResponse.json({
          success: true,
          data: finalizeResult(parsedData),
          usage: { totalTokens: 1500 }
        })
      }

      case 'thumbnail_prompt': {
        const systemPrompt = `You are an expert prompt engineer for AI image generation, specializing in YouTube thumbnails. Generate detailed image prompts that will create compelling, click-worthy thumbnails. The prompts should describe visual compositions optimized for 16:9 aspect ratio.`

        const userPrompt = `Create a detailed image generation prompt for a YouTube thumbnail based on:

Title: ${processedTitle || 'Video title'}
Artistic Direction: ${JSON.stringify(direction)}
Context: ${processedContext}

The prompt should:
- Describe a compelling, click-worthy thumbnail composition
- Include color guidance matching the palette
- Specify text overlay placement (leave space for text)
- Be optimized for AI image generation
- Result in a 16:9 aspect ratio image`

        const aiResponse = await generateAIResponse(systemPrompt, userPrompt, { 
          temperature: temperature || 0.7,
          userId: effectiveUserId 
        })
        result = aiResponse.content

        return NextResponse.json({
          success: true,
          data: finalizeResult(result),
          usage: { totalTokens: 500 }
        })
      }

      case 'thumbnail-titles': {
        const systemPrompt = `You are an expert YouTube thumbnail copywriter. Generate catchy, attention-grabbing titles for YouTube thumbnails.

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
}`

        const userPrompt = `Generate catchy thumbnail titles for a YouTube video based on:

"${processedContext}"

Create a main title (2-4 words, uppercase) and a short title (1-2 words, uppercase) that will make people want to click. Focus on the core benefit or curiosity factor.`

        const aiResponse = await generateAIResponse(systemPrompt, userPrompt, { 
          temperature: temperature || 0.7,
          userId: effectiveUserId 
        })
        result = aiResponse.content

        let parsedData
        try {
          const content = result
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/)
          const jsonStr = jsonMatch ? jsonMatch[1] : content
          parsedData = JSON.parse(jsonStr)
        } catch (err) {
          console.error('Thumbnail titles parsing error:', err)
          return NextResponse.json(
            { error: 'Failed to generate valid thumbnail titles JSON', details: err instanceof Error ? err.message : String(err) },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          data: finalizeResult(parsedData),
          usage: { totalTokens: 300 }
        })
      }

      case 'finance': {
        const systemPrompt = `You are a senior financial analyst and CFO consultant. Generate comprehensive financial analysis and projections.

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
}`

        const userPrompt = `Analyze and generate financial projections for:\n\n${processedContext}\n\nProvide a comprehensive financial report with revenue projections, expense analysis, cashflow forecasting, KPIs, risks, and strategic recommendations.`

        const aiResponse = await generateAIResponse(systemPrompt, userPrompt, { 
          temperature: temperature || 0.7,
          userId: effectiveUserId 
        })
        result = aiResponse.content

        let parsedData
        try {
          const content = result
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/)
          const jsonStr = jsonMatch ? jsonMatch[1] : content
          parsedData = JSON.parse(jsonStr)
        } catch (err) {
          console.error('Finance parsing error:', err)
          return NextResponse.json(
            { error: 'Failed to generate valid finance JSON', details: err instanceof Error ? err.message : String(err) },
            { status: 500 }
          )
        }

        return NextResponse.json({ success: true, data: finalizeResult(parsedData), usage: { totalTokens: 2000 } })
      }

      case 'marketing': {
        const systemPrompt = `You are a world-class marketing strategist and growth hacker. Generate comprehensive marketing plans.

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
}`

        const userPrompt = `Create a comprehensive marketing strategy for:\n\n${processedContext}\n\nInclude buyer personas, campaign ideas, content calendar, funnel strategy, budget allocation, and timeline.`

        const aiResponse = await generateAIResponse(systemPrompt, userPrompt, { 
          temperature: temperature || 0.7,
          userId: effectiveUserId 
        })
        result = aiResponse.content

        let parsedData
        try {
          const content = result
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/)
          const jsonStr = jsonMatch ? jsonMatch[1] : content
          parsedData = JSON.parse(jsonStr)
        } catch (err) {
          console.error('Marketing parsing error:', err)
          return NextResponse.json(
            { error: 'Failed to generate valid marketing JSON', details: err instanceof Error ? err.message : String(err) },
            { status: 500 }
          )
        }

        return NextResponse.json({ success: true, data: finalizeResult(parsedData), usage: { totalTokens: 2500 } })
      }

      case 'business': {
        const systemPrompt = `You are a senior business consultant specializing in document generation. Create professional business documents.

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
}`

        const userPrompt = `Generate a professional business document for:\n\n${processedContext}\n\nCreate a comprehensive, well-structured document with all necessary sections, metrics, and action items.`

        const aiResponse = await generateAIResponse(systemPrompt, userPrompt, { 
          temperature: temperature || 0.7,
          userId: effectiveUserId 
        })
        result = aiResponse.content

        let parsedData
        try {
          const content = result
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/)
          const jsonStr = jsonMatch ? jsonMatch[1] : content
          parsedData = JSON.parse(jsonStr)
        } catch (err) {
          console.error('Business parsing error:', err)
          return NextResponse.json(
            { error: 'Failed to generate valid business JSON', details: err instanceof Error ? err.message : String(err) },
            { status: 500 }
          )
        }

        return NextResponse.json({ success: true, data: finalizeResult(parsedData), usage: { totalTokens: 3000 } })
      }

      case 'social_batch': {
        const systemPrompt = `You are a viral content expert and social media strategist. Generate batch social media content optimized for engagement.

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
}`

        const userPrompt = `Generate a batch of social media content for:\n\n${processedContext}\n\nCreate viral hooks, platform-optimized posts, a weekly calendar, trend suggestions, and A/B test ideas. Focus on maximum engagement.`

        const aiResponse = await generateAIResponse(systemPrompt, userPrompt, { 
          temperature: temperature || 0.7,
          userId: effectiveUserId 
        })
        result = aiResponse.content

        let parsedData
        try {
          const content = result
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/)
          const jsonStr = jsonMatch ? jsonMatch[1] : content
          parsedData = JSON.parse(jsonStr)
        } catch (err) {
          console.error('Social batch parsing error:', err)
          return NextResponse.json(
            { error: 'Failed to generate valid social batch JSON', details: err instanceof Error ? err.message : String(err) },
            { status: 500 }
          )
        }

        return NextResponse.json({ success: true, data: finalizeResult(parsedData), usage: { totalTokens: 2000 } })
      }

      case 'skill_execution': {
        if (!skillSlug) {
          return NextResponse.json({ error: 'skillSlug is required for skill_execution' }, { status: 400 })
        }

        // 1. Try to find the skill in the main Skill table
        let skill = await db.skill.findUnique({
          where: { slug: skillSlug }
        })

        let skillSystemPrompt: string
        let skillName: string

        if (skill) {
          skillSystemPrompt = skill.promptTemplate
          skillName = skill.name
        } else {
          // 2. Try to find it in the EscSkill table if it's active
          const escSkill = await db.escSkill.findUnique({
            where: { slug: skillSlug, isActive: true }
          })
          
          if (escSkill) {
            skillSystemPrompt = escSkill.promptContent
            skillName = escSkill.name
          } else {
            // Fallback for known critical skills if DB is empty or connection fails
            const fallbacks: Record<string, string> = {
              'content-analyst': "You are a senior content analyst. Create a 'Content Blueprint' for the given context. Respond in JSON.",
              'youtube-extraction': "You are a YouTube SEO expert. Extract metadata (titles, description, tags) from the context. Respond in JSON.",
              'artistic-directions': "You are a creative director. Generate 3 artistic directions for thumbnails. Respond in JSON.",
              'social-posts': "You are a social media manager. Generate posts for multiple platforms. Respond in JSON."
            }
            
            if (fallbacks[skillSlug]) {
              skillSystemPrompt = fallbacks[skillSlug]
              skillName = `Fallback ${skillSlug}`
            } else {
              skillSystemPrompt = `You are an expert AI assistant executing the skill: ${skillSlug}.`
              skillName = skillSlug
            }
          }
        }
        
        // Apply tags if any (e.g. {{context}})
        const finalSystemPrompt = skillSystemPrompt.replace(/\{\{context\}\}/g, processedContext)
        const userPrompt = `Context: ${processedContext}\n\nExecute the skill and return the expected structured output.`

        console.log(`[API Generate] Executing skill: ${skillName} (${skillSlug})`)

        const aiResponse = await generateAIResponse(finalSystemPrompt, userPrompt, { 
          temperature: temperature || 0.7,
          userId: effectiveUserId 
        })
        
        result = aiResponse.content

        return NextResponse.json({ 
          success: true, 
          data: finalizeResult(result), 
          usage: { totalTokens: 1500 } 
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid generation type' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
