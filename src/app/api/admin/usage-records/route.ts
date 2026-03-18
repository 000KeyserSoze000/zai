import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - List all usage records with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const action = searchParams.get("action")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (action) where.action = action
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) (where.createdAt as Record<string, string>).gte = startDate
      if (endDate) (where.createdAt as Record<string, string>).lte = endDate
    }

    const [records, total] = await Promise.all([
      db.usageRecord.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, name: true }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      db.usageRecord.count({ where })
    ])

    // Calculate totals
    const totals = await db.usageRecord.aggregate({
      where,
      _sum: {
        tokensUsed: true,
        cost: true
      }
    })

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      totals: {
        tokensUsed: totals._sum.tokensUsed || 0,
        cost: totals._sum.cost || 0
      }
    })
  } catch (error) {
    console.error("Error fetching usage records:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
