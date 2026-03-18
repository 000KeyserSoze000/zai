import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
      include: {
        plan: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    })

    if (!subscription) {
      // Return default trial subscription for new users
      return NextResponse.json({
        id: null,
        status: 'TRIAL',
        sessionsUsed: 0,
        sessionsLimit: 1,
        plan: {
          name: 'Free Trial',
          type: 'TRIAL',
        },
      })
    }

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
