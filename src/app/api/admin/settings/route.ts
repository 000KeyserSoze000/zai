import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET - Fetch site settings
export async function GET() {
  try {
    let settings = await db.siteSettings.findFirst()
    
    if (!settings) {
      settings = await db.siteSettings.create({
        data: {}
      })
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

// PUT - Update site settings
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    console.log('[Settings API] Received data keys:', Object.keys(data))
    
    let settings = await db.siteSettings.findFirst()
    
    if (!settings) {
      settings = await db.siteSettings.create({
        data: {}
      })
    }
    
    // Prepare OAuth data
    const facebookData = data.facebookOAuth || data.facebook
    const twitterData = data.twitterOAuth || data.twitter
    const linkedinData = data.linkedinOAuth || data.linkedin
    const googleData = data.googleOAuth || data.google
    
    // Update settings
    const updatedSettings = await db.siteSettings.update({
      where: { id: settings.id },
      data: {
        // General
        siteName: data.siteName,
        siteUrl: data.siteUrl,
        siteEmail: data.siteEmail,
        timezone: data.timezone,
        defaultUserGroup: data.defaultUserGroup,
        enableRecaptcha: data.enableRecaptcha,
        recaptchaSiteKey: data.recaptchaSiteKey,
        recaptchaSecretKey: data.recaptchaSecretKey,
        enableAnalytics: data.enableAnalytics,
        analyticsId: data.analyticsId,
        
        // OAuth
        oauthEnabled: data.oauthEnabled,
        facebookOAuth: facebookData ? JSON.stringify(facebookData) : undefined,
        twitterOAuth: twitterData ? JSON.stringify(twitterData) : undefined,
        linkedinOAuth: linkedinData ? JSON.stringify(linkedinData) : undefined,
        googleOAuth: googleData ? JSON.stringify(googleData) : undefined,
        
        // AI API Keys
        zaiApiKey: data.zaiApiKey,
        openaiApiKey: data.openaiApiKey,
        anthropicApiKey: data.anthropicApiKey,
        googleAiApiKey: data.googleAiApiKey,
        mistralApiKey: data.mistralApiKey,
        replicateApiKey: data.replicateApiKey,
        stabilityApiKey: data.stabilityApiKey,
        
        // Email Settings
        emailEnabled: data.emailEnabled,
        emailProvider: data.emailProvider,
        
        // SMTP Settings
        smtpEnabled: data.smtpEnabled,
        smtpHost: data.smtpHost,
        smtpPort: data.smtpPort ? parseInt(String(data.smtpPort)) : null,
        smtpUser: data.smtpUser,
        smtpPassword: data.smtpPassword,
        smtpFromEmail: data.smtpFromEmail,
        smtpFromName: data.smtpFromName,
        smtpEncryption: data.smtpEncryption,
        
        // Email Provider API Keys
        sendgridApiKey: data.sendgridApiKey,
        brevoApiKey: data.brevoApiKey,
        mailchimpApiKey: data.mailchimpApiKey,
        amazonSesApiKey: data.amazonSesApiKey,
        amazonSesSecretKey: data.amazonSesSecretKey,
        mailgunApiKey: data.mailgunApiKey,
        mailgunDomain: data.mailgunDomain,
        postmarkApiKey: data.postmarkApiKey,
        
        // Security
        twoFactorEnabled: data.twoFactorEnabled,
        rateLimitEnabled: data.rateLimitEnabled,
        rateLimitRequests: data.rateLimitRequests,
        rateLimitWindow: data.rateLimitWindow,
        
        // Maintenance
        maintenanceMode: data.maintenanceMode,
        maintenanceMessage: data.maintenanceMessage,
        
        // Legal/GDPR
        gdprEnabled: data.gdprEnabled,
        cookieValidityDays: data.cookieValidityDays,
        
        // Language
        defaultLanguage: data.defaultLanguage,
        availableLanguages: data.availableLanguages 
          ? (typeof data.availableLanguages === 'string' ? data.availableLanguages : JSON.stringify(data.availableLanguages))
          : undefined,
        
        // Currency
        defaultCurrency: data.defaultCurrency,
      }
    })
    
    console.log('[Settings API] Update successful, emailEnabled:', updatedSettings.emailEnabled)
    
    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
}
