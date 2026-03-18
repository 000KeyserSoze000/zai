import { NextRequest } from "next/server"
import { verify } from "jsonwebtoken"
import { db } from "./db"

const JWT_SECRET = process.env.JWT_SECRET || "contentpro-jwt-secret-key-change-in-production"

interface DecodedToken {
  userId: string
  email: string
  role: string
  iat: number
  exp: number
}

export async function verifyAuth(request: NextRequest): Promise<{ id: string; email: string; role: string } | null> {
  try {
    // Get token from cookie
    const token = request.cookies.get("auth-token")?.value
    
    if (!token) {
      return null
    }

    // Verify token
    const decoded = verify(token, JWT_SECRET) as DecodedToken
    
    // Verify user still exists in database
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true }
    })

    return user
  } catch (error) {
    console.error("Auth verification error:", error)
    return null
  }
}

export function isAdmin(user: { role: string } | null): boolean {
  return user?.role === "ADMIN"
}

export function hasActiveSubscription(subscription: { status: string } | null): boolean {
  return subscription?.status === "ACTIVE" || subscription?.status === "TRIAL"
}
