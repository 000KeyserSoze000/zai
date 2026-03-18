import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { requireAuth, checkRateLimit, apiError } from '@/lib/api-utils'
import { getBrandSubstitutions, applyBrandSubstitutions } from '@/lib/ai-provider'

// Supported thumbnail sizes
const THUMBNAIL_SIZES = {
  '1024x1024': '1024x1024',
  '768x1344': '768x1344',
  '864x1152': '864x1152',
  '1344x768': '1344x768',
  '1152x864': '1152x864',
  '1440x720': '1440x720',
  '720x1440': '720x1440',
} as const

export async function POST(request: NextRequest) {
  try {
    // Check authentication - pass request to get auth token from cookies
    const user = await requireAuth(request)

    // Check rate limit
    checkRateLimit(user.id)

    // Parse request body
    const body = await request.json()
    const { prompt, size = '1344x768', referenceImage, style } = body

    if (!prompt) {
      return apiError('Prompt is required', 400)
    }

    // Apply brand substitutions
    const brandSubs = await getBrandSubstitutions(user.id)
    const processedPrompt = await applyBrandSubstitutions(prompt, brandSubs)

    // Create ZAI instance
    const zai = await ZAI.create()

    // Enhance prompt for thumbnail generation
    const enhancedPrompt = `YouTube thumbnail design, professional quality, high contrast, eye-catching:

${processedPrompt}

Style guidelines:
- Ultra high definition, sharp details
- Bold colors with strong contrast
- Clean composition with clear focal point
- Space for text overlay
- 16:9 aspect ratio composition
- Cinematic lighting
- Professional photography style${style ? `\n- Style: ${style}` : ''}`

    // Map the size to a supported size
    const supportedSize = THUMBNAIL_SIZES[size as keyof typeof THUMBNAIL_SIZES] || '1344x768'

    const response = await zai.images.generations.create({
      prompt: enhancedPrompt,
      size: supportedSize as '1024x1024' | '768x1344' | '864x1152' | '1344x768' | '1152x864' | '1440x720' | '720x1440',
      n: 1,
    })

    const imageBase64 = response.data[0]?.base64

    if (!imageBase64) {
      throw new Error('No image generated')
    }

    // Return base64 image directly
    return NextResponse.json({
      success: true,
      images: [
        {
          url: `data:image/png;base64,${imageBase64}`,
          base64: imageBase64
        }
      ],
      revisedPrompt: enhancedPrompt,
      usage: { totalTokens: 0, imagesGenerated: 1 }
    })

  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Image generation failed' },
      { status: 500 }
    )
  }
}
