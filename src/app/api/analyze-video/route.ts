import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, checkRateLimit, apiError } from '@/lib/api-utils'
import { generateAIResponse } from '@/lib/ai-provider'

// Helper to finalize results (sanitize for JSON serialization)
function finalizeResult(data: any): any {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch {
      return data
    }
  }
  return data
}

// Extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Fetch YouTube thumbnail
async function fetchYouTubeThumbnail(videoId: string): Promise<{ url: string; base64: string; mimeType: string } | null> {
  const thumbnailUrls = [
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
  ]

  for (const url of thumbnailUrls) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        return {
          url,
          base64,
          mimeType: 'image/jpeg'
        }
      }
    } catch (error) {
      console.error(`Failed to fetch thumbnail from ${url}:`, error)
    }
  }
  return null
}

// Fetch YouTube video info using noembed (free, no API key needed)
async function fetchYouTubeVideoInfo(videoId: string): Promise<{ title: string; author_name: string } | null> {
  try {
    const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
    if (response.ok) {
      const data = await response.json()
      return {
        title: data.title || 'Unknown Title',
        author_name: data.author_name || 'Unknown Author'
      }
    }
  } catch (error) {
    console.error('Failed to fetch video info:', error)
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication - pass request to get auth token from cookies
    const user = await requireAuth(request)

    // Check rate limit
    checkRateLimit(user.id)

    // Parse request body
    const body = await request.json()
    const { videoUrl, context } = body

    if (!videoUrl) {
      return apiError('Video URL is required', 400)
    }

    // Extract video ID
    const videoId = extractVideoId(videoUrl)
    if (!videoId) {
      return apiError('Invalid YouTube URL', 400)
    }

    // Fetch thumbnail
    const thumbnailData = await fetchYouTubeThumbnail(videoId)
    if (!thumbnailData) {
      return apiError('Could not fetch video thumbnail', 404)
    }

    // Fetch video info
    const videoInfo = await fetchYouTubeVideoInfo(videoId)

    // Generate artistic direction using AI
    const systemPrompt = `You are an expert creative director and graphic designer specializing in YouTube thumbnails.

Based on the video information provided, generate 3 artistic directions for a YouTube thumbnail.

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

    const userPrompt = `Generate 3 artistic directions for a YouTube thumbnail for this video:

Video Title: ${videoInfo?.title || 'Unknown'}
Channel: ${videoInfo?.author_name || 'Unknown'}
Video URL: ${videoUrl}
${context ? `Additional context: ${context}` : ''}

Each direction should have a unique style, color palette, typography recommendations, mood keywords, and a brief concept for the thumbnail design.`

    const aiResponse = await generateAIResponse(systemPrompt, userPrompt, 0.7)

    let directions = []
    try {
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || aiResponse.match(/```\s*([\s\S]*?)\s*```/)
      const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse
      const parsed = JSON.parse(jsonStr)
      directions = parsed.directions || []
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      // Fallback directions
      directions = [
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

    // Create direction objects with IDs
    const formattedDirections = directions.map((dir: any, index: number) => ({
      id: `dir-${videoId}-${index}`,
      ...dir,
      sourceVideo: videoUrl,
      sourceThumbnail: thumbnailData.url,
      selected: index === 0
    }))

    return NextResponse.json({
      success: true,
      videoId,
      thumbnailUrl: thumbnailData.url,
      videoInfo,
      directions: formattedDirections,
      usage: { totalTokens: 500 }
    })

  } catch (error) {
    console.error('Video analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Video analysis failed' },
      { status: 500 }
    )
  }
}
