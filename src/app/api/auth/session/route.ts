import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Same secret priority as login and middleware - CRITICAL for JWT verification
const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'ai-command-center-secret-key-2024'
)

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ user: null })
    }

    try {
      const { payload } = await jwtVerify(token, SECRET)

      return NextResponse.json({
        user: {
          id: payload.id,
          email: payload.email,
          name: payload.name,
          role: payload.role,
        },
      })
    } catch {
      // Token is invalid or expired, clear the cookie
      const response = NextResponse.json({ user: null })
      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      })
      return response
    }
  } catch (error) {
    console.error('[Session API] Error:', error)
    return NextResponse.json({ user: null })
  }
}
