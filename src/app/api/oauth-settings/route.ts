import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const settings = await db.siteSettings.findFirst()

    if (!settings) {
      console.log('[OAuth Settings] No settings found in database')
      return NextResponse.json({
        oauthEnabled: false,
        providers: {}
      })
    }

    console.log('[OAuth Settings] Raw settings:', {
      oauthEnabled: settings.oauthEnabled,
      facebookOAuth: settings.facebookOAuth,
      twitterOAuth: settings.twitterOAuth,
      linkedinOAuth: settings.linkedinOAuth,
      googleOAuth: settings.googleOAuth,
    })

    // Parse OAuth providers
    const providers: Record<string, { enabled: boolean }> = {}
    
    const oauthFields = [
      { field: 'facebookOAuth', id: 'facebook' },
      { field: 'twitterOAuth', id: 'twitter' },
      { field: 'linkedinOAuth', id: 'linkedin' },
      { field: 'googleOAuth', id: 'google' },
    ]
    
    for (const { field, id } of oauthFields) {
      const rawValue = settings[field as keyof typeof settings] as string | null
      
      if (rawValue) {
        try {
          const parsed = JSON.parse(rawValue)
          console.log(`[OAuth Settings] Parsed ${id}:`, parsed)
          providers[id] = {
            enabled: parsed.enabled === true
          }
        } catch (e) {
          console.log(`[OAuth Settings] Failed to parse ${id}:`, rawValue)
          providers[id] = { enabled: false }
        }
      } else {
        providers[id] = { enabled: false }
      }
    }

    const result = {
      oauthEnabled: settings.oauthEnabled || false,
      providers
    }

    console.log('[OAuth Settings] Returning:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[OAuth Settings] Error fetching settings:', error)
    return NextResponse.json({
      oauthEnabled: false,
      providers: {}
    })
  }
}
