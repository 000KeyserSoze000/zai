import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - List all plans
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const plans = await db.plan.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        priceMonthly: true,
        sessionsIncluded: true,
        pricePerExtraSession: true,
        maxUsers: true,
        features: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { subscriptions: true }
        }
      },
      orderBy: { priceMonthly: "asc" }
    })

    console.log(`[Plans API] Found ${plans.length} plans`)
    
    return NextResponse.json({ plans })
  } catch (error) {
    console.error("Error fetching plans:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Create new plan
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      type,
      priceMonthly,
      sessionsIncluded,
      pricePerExtraSession,
      maxUsers,
      features,
      isActive
    } = body

    // Check if plan type already exists
    const existingPlan = await db.plan.findUnique({
      where: { type }
    })

    if (existingPlan) {
      return NextResponse.json(
        { error: "Un plan avec ce type existe déjà" },
        { status: 400 }
      )
    }

    const plan = await db.plan.create({
      data: {
        name,
        type,
        priceMonthly: parseFloat(priceMonthly),
        sessionsIncluded: parseInt(sessionsIncluded),
        pricePerExtraSession: parseFloat(pricePerExtraSession || 0),
        maxUsers: parseInt(maxUsers || 1),
        features: features || "{}",
        isActive: isActive ?? true
      }
    })

    return NextResponse.json({ success: true, plan })
  } catch (error) {
    console.error("Error creating plan:", error)
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 })
  }
}
