import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { requireAuth, checkRateLimit, apiError } from '@/lib/api-utils'

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

    // Create ZAI instance
    const zai = await ZAI.create()

    // Analyze the thumbnail using vision model
    const analysis = await zai.chat.completions.createVision({
      model: 'z-ai/vlm',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this YouTube thumbnail image and extract visual design information.

Video URL: ${videoUrl}
${context ? `Additional context: ${context}` : ''}

Please provide a detailed analysis in JSON format:
{
  "colorPalette": {
    "primary": "#hex color code",
    "secondary": "#hex color code", 
    "accent": "#hex color code",
    "background": "#hex color code",
    "text": "#hex color code"
  },
  "style": "modern|retro|minimalist|bold|elegant|playful",
  "typography": {
    "headingFont": "Font name suggestion",
    "bodyFont": "Font name suggestion",
    "headingWeight": "700",
    "emphasis": "uppercase|lowercase|capitalize|none"
  },
  "moodKeywords": ["keyword1", "keyword2", "keyword3"],
  "compositionNotes": "Description of layout and design elements",
  "recommendations": "Suggestions for creating similar thumbnails"
}

Respond ONLY with valid JSON, no additional text.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${thumbnailData.mimeType};base64,${thumbnailData.base64}`
              }
            }
          ]
        }
      ],
      thinking: { type: 'disabled' }
    })

    const responseText = analysis.choices[0]?.message?.content || ''

    // Parse the JSON from the response
    let visualAnalysis
    try {
      // Try to extract JSON from markdown code blocks or raw response
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/```\s*([\s\S]*?)\s*```/)
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText
      visualAnalysis = JSON.parse(jsonStr.trim())
    } catch {
      console.log('Failed to parse JSON from response:', responseText.substring(0, 200))
      // Default fallback based on common YouTube styles
      visualAnalysis = {
        colorPalette: {
          primary: '#FF0000',
          secondary: '#282828',
          accent: '#FFFFFF',
          background: '#0F0F0F',
          text: '#FFFFFF'
        },
        style: 'modern',
        typography: {
          headingFont: 'Roboto',
          bodyFont: 'Roboto',
          headingWeight: '700',
          emphasis: 'uppercase'
        },
        moodKeywords: ['dynamic', 'engaging', 'professional'],
        compositionNotes: 'Modern YouTube style with high contrast',
        recommendations: 'Use vibrant colors and readable text'
      }
    }

    // Create an artistic direction from the analysis
    const direction = {
      id: 'dir-from-video-' + Date.now(),
      name: `Style Extracted - ${visualAnalysis.style?.charAt(0).toUpperCase() + visualAnalysis.style?.slice(1) || 'Custom'}`,
      style: visualAnalysis.style || 'modern',
      colorPalette: visualAnalysis.colorPalette || {
        primary: '#FF0000',
        secondary: '#282828',
        accent: '#FFFFFF',
        background: '#0F0F0F',
        text: '#FFFFFF'
      },
      typography: visualAnalysis.typography || {
        headingFont: 'Roboto',
        bodyFont: 'Roboto',
        headingWeight: '700',
        emphasis: 'uppercase'
      },
      moodKeywords: visualAnalysis.moodKeywords || ['youtube', 'modern'],
      thumbnailConcept: visualAnalysis.compositionNotes || '',
      recommendations: visualAnalysis.recommendations || '',
      sourceVideo: videoUrl,
      sourceThumbnail: thumbnailData.url,
      selected: true
    }

    return NextResponse.json({
      success: true,
      videoId,
      thumbnailUrl: thumbnailData.url,
      analysis: finalizeResult(visualAnalysis),
      direction: finalizeResult(direction),
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
