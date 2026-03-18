import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const logs = await db.executionLog.findMany({
      include: {
        agent: true,
        skill: true,
        tool: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limit for performance
    })
    return NextResponse.json({ logs })
  } catch (error) {
    console.error("[OBSERVABILITY_GET]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
