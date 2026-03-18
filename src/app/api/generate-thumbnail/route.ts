import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, checkRateLimit, apiError } from '@/lib/api-utils'
import { getBrandSubstitutions, applyBrandSubstitutions, generateAIResponse } from '@/lib/ai-provider'

// Supported thumbnail sizes
const THUMBNAIL_SIZES = {
  '1024x1024': { width: 1024, height: 1024 },
  '768x1344': { width: 768, height: 1344 },
  '864x1152': { width: 864, height: 1152 },
  '1344x768': { width: 1344, height: 768 },
  '1152x864': { width: 1152, height: 864 },
  '1440x720': { width: 1440, height: 720 },
  '720x1440': { width: 720, height: 1440 },
} as const

// Generate a gradient image as placeholder
function generateGradientImage(width: number, height: number, colors: { primary: string; secondary: string }): string {
  // Create a simple SVG with gradient
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
    </svg>
  `
  return Buffer.from(svg).toString('base64')
}

// Generate image using Pollinations.ai (free, no API key required)
async function generateImageWithPollinations(prompt: string, width: number, height: number): Promise<string | null> {
  try {
    const encodedPrompt = encodeURIComponent(prompt.slice(0, 500))
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true`
    
    console.log('[Image Gen] Using Pollinations.ai for image generation')
    
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/*'
      }
    })
    
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      return base64
    }
    
    return null
  } catch (error) {
    console.error('[Image Gen] Pollinations error:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication - pass request to get auth token from cookies
    const user = await requireAuth(request)

    // Check rate limit
    checkRateLimit(user.id)

    // Parse request body
    const body = await request.json()
    const { prompt, size = '1344x768', referenceImage, style, direction } = body

    if (!prompt) {
      return apiError('Prompt is required', 400)
    }

    // Apply brand substitutions
    const brandSubs = await getBrandSubstitutions(user.id)
    const processedPrompt = await applyBrandSubstitutions(prompt, brandSubs)

    // Get dimensions
    const dimensions = THUMBNAIL_SIZES[size as keyof typeof THUMBNAIL_SIZES] || { width: 1344, height: 768 }
    
    // Extract colors from direction if available
    const colors = {
      primary: direction?.colorPalette?.primary || '#FF6B00',
      secondary: direction?.colorPalette?.secondary || '#1A1A2E'
    }

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

    console.log('[Image Gen] Starting image generation...')
    
    // Try Pollinations.ai first (free, no API key needed)
    let imageBase64 = await generateImageWithPollinations(
      enhancedPrompt,
      dimensions.width,
      dimensions.height
    )
    
    // If Pollinations fails, generate a gradient placeholder
    if (!imageBase64) {
      console.log('[Image Gen] Pollinations failed, generating placeholder')
      imageBase64 = generateGradientImage(dimensions.width, dimensions.height, colors)
    }

    console.log('[Image Gen] Image generation complete')

    // Return base64 image directly
    return NextResponse.json({
      success: true,
      images: [
        {
          url: `data:image/svg+xml;base64,${imageBase64}`,
          base64: imageBase64
        }
      ],
      revisedPrompt: enhancedPrompt,
      usage: { totalTokens: 0, imagesGenerated: 1 },
      source: 'pollinations'
    })

  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Image generation failed' },
      { status: 500 }
    )
  }
}
