import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { db } from "@/lib/db"

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "ai-command-center-secret-key-2024"

interface SessionUser {
  id: string
  email: string
  role: string
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    
    if (!token) {
      console.log("[Session] No auth-token cookie found")
      return null
    }

    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    
    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: payload.id as string },
      select: { id: true, email: true, role: true }
    })

    if (!user) {
      console.log("[Session] User not found in database")
      return null
    }

    return user
  } catch (error) {
    console.error("Session error:", error)
    return null
  }
}
