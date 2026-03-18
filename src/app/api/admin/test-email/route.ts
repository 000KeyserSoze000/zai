import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import nodemailer from "nodemailer"

// POST - Send test email
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { to } = data

    // Get SMTP settings
    const settings = await db.siteSettings.findFirst()

    if (!settings?.smtpEnabled) {
      return NextResponse.json(
        { error: "SMTP is not enabled" },
        { status: 400 }
      )
    }

    if (!settings.smtpHost || !settings.smtpUser) {
      return NextResponse.json(
        { error: "SMTP configuration is incomplete" },
        { status: 400 }
      )
    }

    // Create transporter
    const transportConfig: {
      host: string
      port: number
      secure: boolean
      auth: { user: string; pass: string }
      tls?: { rejectUnauthorized: boolean }
    } = {
      host: settings.smtpHost,
      port: settings.smtpPort || 465,
      secure: settings.smtpEncryption === 'ssl',
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword || ''
      }
    }

    // Handle TLS/STARTTLS
    if (settings.smtpEncryption === 'tls' || settings.smtpEncryption === 'starttls') {
      transportConfig.secure = false
      transportConfig.tls = { rejectUnauthorized: false }
    }

    const transporter = nodemailer.createTransport(transportConfig)

    // Send test email
    const info = await transporter.sendMail({
      from: `"${settings.smtpFromName || 'ContentPro'}" <${settings.smtpFromEmail || settings.smtpUser}>`,
      to: to || settings.smtpFromEmail || settings.smtpUser,
      subject: 'Test Email - ContentPro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #FF6B00;">Test Email</h1>
          <p>Ceci est un email de test envoyé depuis ContentPro.</p>
          <p>Si vous recevez cet email, votre configuration SMTP fonctionne correctement !</p>
          <hr style="border: 1px solid #333; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">
            Envoyé depuis ContentPro<br />
            Hôte: ${settings.smtpHost}<br />
            Port: ${settings.smtpPort}
          </p>
        </div>
      `
    })

    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId,
      message: "Test email sent successfully"
    })
  } catch (error: unknown) {
    console.error("Error sending test email:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to send test email"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
