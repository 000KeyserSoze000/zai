import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { SessionStatus } from '@prisma/client'

// GET /api/sessions/[id] - Get a specific session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params

    const session = await db.contentSession.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    }

    // Parse JSON fields
    const parsedSession = {
      ...session,
      metadata: session.metadata ? JSON.parse(session.metadata) : null,
      artisticDir: session.artisticDir ? JSON.parse(session.artisticDir) : null,
      thumbnails: session.thumbnails ? JSON.parse(session.thumbnails) : null,
      socialPosts: session.socialPosts ? JSON.parse(session.socialPosts) : null,
    }

    return NextResponse.json({ session: parsedSession })
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/sessions/[id] - Update a session
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Verify ownership
    const existingSession = await db.contentSession.findFirst({
      where: { id, userId: user.id }
    })

    if (!existingSession) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    }

    if (body.title !== undefined) updateData.title = body.title
    if (body.context !== undefined) updateData.context = body.context
    if (body.status !== undefined) updateData.status = body.status as SessionStatus
    if (body.metadata !== undefined) updateData.metadata = JSON.stringify(body.metadata)
    if (body.artisticDir !== undefined) updateData.artisticDir = JSON.stringify(body.artisticDir)
    if (body.thumbnails !== undefined) updateData.thumbnails = JSON.stringify(body.thumbnails)
    if (body.socialPosts !== undefined) updateData.socialPosts = JSON.stringify(body.socialPosts)
    if (body.tokensUsed !== undefined) updateData.tokensUsed = body.tokensUsed
    if (body.cost !== undefined) updateData.cost = body.cost
    
    if (body.status === 'COMPLETED') {
      updateData.completedAt = new Date()
    }

    const session = await db.contentSession.update({
      where: { id },
      data: updateData
    })

    // Log usage if tokens were used
    if (body.tokensUsed && body.tokensUsed > 0) {
      await db.usageRecord.create({
        data: {
          userId: user.id,
          action: body.operation || 'session_update',
          resourceId: id,
          resourceType: 'content_session',
          tokensUsed: body.tokensUsed,
          cost: body.cost || 0,
          metadata: JSON.stringify({ operation: body.operation || 'update' })
        }
      })
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/sessions/[id] - Delete a session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const session = await db.contentSession.findFirst({
      where: { id, userId: user.id }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    }

    // Delete session
    await db.contentSession.delete({
      where: { id }
    })

    // Decrement usage
    await db.subscription.update({
      where: { userId: user.id },
      data: { sessionsUsed: { decrement: 1 } }
    })

    // Log deletion
    await db.usageRecord.create({
      data: {
        userId: user.id,
        action: 'session_deleted',
        resourceId: id,
        resourceType: 'content_session',
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting session:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
