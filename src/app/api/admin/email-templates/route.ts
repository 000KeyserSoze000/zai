import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET - Fetch all email templates
export async function GET() {
  try {
    const templates = await db.emailTemplate.findMany({
      orderBy: { type: 'asc' }
    })

    // If no templates exist, create default ones
    if (templates.length === 0) {
      const defaultTemplates = [
        {
          type: 'welcome',
          subject: 'Bienvenue sur {{siteName}} !',
          body: `<h1>Bienvenue {{userName}} !</h1>
<p>Merci de rejoindre {{siteName}}. Votre compte a été créé avec succès.</p>
<p>Vous pouvez maintenant accéder à toutes nos fonctionnalités.</p>
<p><a href="{{loginUrl}}">Se connecter</a></p>
<p>Cordialement,<br>L'équipe {{siteName}}</p>`,
          variables: JSON.stringify(['siteName', 'userName', 'loginUrl'])
        },
        {
          type: 'reset_password',
          subject: 'Réinitialisation de votre mot de passe',
          body: `<h1>Réinitialisation de mot de passe</h1>
<p>Bonjour {{userName}},</p>
<p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
<p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
<p><a href="{{resetUrl}}">Réinitialiser mon mot de passe</a></p>
<p>Ce lien expire dans 24 heures.</p>
<p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
<p>Cordialement,<br>L'équipe {{siteName}}</p>`,
          variables: JSON.stringify(['siteName', 'userName', 'resetUrl'])
        },
        {
          type: 'notification',
          subject: 'Notification de {{siteName}}',
          body: `<h1>{{title}}</h1>
<p>{{message}}</p>
<p><a href="{{actionUrl}}">{{actionText}}</a></p>
<p>Cordialement,<br>L'équipe {{siteName}}</p>`,
          variables: JSON.stringify(['siteName', 'title', 'message', 'actionUrl', 'actionText'])
        },
        {
          type: 'subscription',
          subject: 'Mise à jour de votre abonnement',
          body: `<h1>Mise à jour de votre abonnement</h1>
<p>Bonjour {{userName}},</p>
<p>Votre abonnement a été mis à jour.</p>
<p><strong>Plan :</strong> {{planName}}</p>
<p><strong>Statut :</strong> {{status}}</p>
<p><strong>Prochaine facturation :</strong> {{nextBillingDate}}</p>
<p><a href="{{subscriptionUrl}}">Gérer mon abonnement</a></p>
<p>Cordialement,<br>L'équipe {{siteName}}</p>`,
          variables: JSON.stringify(['siteName', 'userName', 'planName', 'status', 'nextBillingDate', 'subscriptionUrl'])
        },
        {
          type: 'trial_expiring',
          subject: 'Votre période d\'essai expire bientôt',
          body: `<h1>Votre période d'essai expire bientôt</h1>
<p>Bonjour {{userName}},</p>
<p>Votre période d'essai se termine dans {{daysRemaining}} jour(s).</p>
<p>Pour continuer à profiter de nos services, souscrivez à un de nos plans.</p>
<p><a href="{{subscriptionUrl}}">Voir les plans</a></p>
<p>Cordialement,<br>L'équipe {{siteName}}</p>`,
          variables: JSON.stringify(['siteName', 'userName', 'daysRemaining', 'subscriptionUrl'])
        }
      ]

      for (const template of defaultTemplates) {
        await db.emailTemplate.create({ data: template })
      }

      const newTemplates = await db.emailTemplate.findMany({
        orderBy: { type: 'asc' }
      })
      
      return NextResponse.json(newTemplates)
    }

    return NextResponse.json(templates)
  } catch (error) {
    console.error("Error fetching email templates:", error)
    return NextResponse.json(
      { error: "Failed to fetch email templates" },
      { status: 500 }
    )
  }
}

// PUT - Update email template
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      )
    }

    const template = await db.emailTemplate.update({
      where: { id },
      data: {
        subject: updateData.subject,
        body: updateData.body,
        variables: updateData.variables,
        isActive: updateData.isActive
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error("Error updating email template:", error)
    return NextResponse.json(
      { error: "Failed to update email template" },
      { status: 500 }
    )
  }
}

// POST - Create new email template
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const template = await db.emailTemplate.create({
      data: {
        type: data.type,
        subject: data.subject,
        body: data.body,
        variables: data.variables || null,
        isActive: data.isActive ?? true
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error("Error creating email template:", error)
    return NextResponse.json(
      { error: "Failed to create email template" },
      { status: 500 }
    )
  }
}

// DELETE - Delete email template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      )
    }

    await db.emailTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting email template:", error)
    return NextResponse.json(
      { error: "Failed to delete email template" },
      { status: 500 }
    )
  }
}
