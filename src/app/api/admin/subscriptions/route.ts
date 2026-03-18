import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - List all subscriptions
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const planId = searchParams.get("planId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (planId) where.planId = planId

    const [subscriptions, total] = await Promise.all([
      db.subscription.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, name: true }
          },
          plan: true
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      db.subscription.count({ where })
    ])

    return NextResponse.json({
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching subscriptions:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Create new subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const {
      userId,
      planId,
      status,
      sessionsLimit,
      trialDays
    } = body

    // Check if user already has a subscription
    const existingSubscription = await db.subscription.findUnique({
      where: { userId }
    })

    if (existingSubscription) {
      return NextResponse.json(
        { error: "Cet utilisateur a déjà un abonnement" },
        { status: 400 }
      )
    }

    // Get plan to copy sessionsLimit if not provided
    const plan = await db.plan.findUnique({ where: { id: planId } })
    if (!plan) {
      return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 })
    }

    const now = new Date()
    const trialEnd = trialDays ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : null

    const subscription = await db.subscription.create({
      data: {
        userId,
        planId,
        status: status || "TRIAL",
        sessionsLimit: sessionsLimit || plan.sessionsIncluded,
        trialStartsAt: status === "TRIAL" || !status ? now : null,
        trialEndsAt: status === "TRIAL" || !status ? trialEnd : null,
        currentPeriodStart: status === "ACTIVE" ? now : null,
        currentPeriodEnd: status === "ACTIVE" ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) : null
      },
      include: {
        user: {
          select: { id: true, email: true, name: true }
        },
        plan: true
      }
    })

    return NextResponse.json({ success: true, subscription })
  } catch (error) {
    console.error("Error creating subscription:", error)
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 })
  }
}
