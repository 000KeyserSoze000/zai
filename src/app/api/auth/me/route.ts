import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { db } from '@/lib/db'

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'ai-command-center-secret-key-2024'
)

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ user: null })
    }

    const { payload } = await jwtVerify(token, SECRET)

    // Get full user data with subscription
    const user = await db.user.findUnique({
      where: { id: payload.id as string },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription: user.subscription,
      },
    })
  } catch (error) {
    console.error('[Me API] Error:', error)
    return NextResponse.json({ user: null })
  }
}
