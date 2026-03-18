import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

// GET /api/sessions - List all sessions for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where = {
      userId: user.id,
      ...(status && { status: status as any })
    }

    const [sessions, total] = await Promise.all([
      db.contentSession.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          title: true,
          status: true,
          tokensUsed: true,
          cost: true,
          createdAt: true,
          updatedAt: true,
          completedAt: true,
        }
      }),
      db.contentSession.count({ where })
    ])

    return NextResponse.json({
      sessions,
      total,
      hasMore: offset + limit < total
    })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/sessions - Create a new session
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { title, context } = body

    // Check user's subscription limits
    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
      include: { plan: true }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Aucun abonnement trouvé' }, { status: 400 })
    }

    if (subscription.sessionsUsed >= subscription.sessionsLimit) {
      return NextResponse.json({ 
        error: 'Limite de sessions atteinte',
        sessionsUsed: subscription.sessionsUsed,
        sessionsLimit: subscription.sessionsLimit
      }, { status: 403 })
    }

    // Create session
    const session = await db.contentSession.create({
      data: {
        userId: user.id,
        title: title || 'Nouvelle session',
        context: context || '',
        status: 'DRAFT',
      }
    })

    // Increment usage
    await db.subscription.update({
      where: { userId: user.id },
      data: { sessionsUsed: { increment: 1 } }
    })

    // Log usage
    await db.usageRecord.create({
      data: {
        userId: user.id,
        action: 'session_created',
        resourceId: session.id,
        resourceType: 'content_session',
      }
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
