import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Get single plan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params
    const plan = await db.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: { subscriptions: true }
        }
      }
    })

    if (!plan) {
      return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ plan })
  } catch (error) {
    console.error("Error fetching plan:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PUT - Update plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params
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

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (type !== undefined) updateData.type = type
    if (priceMonthly !== undefined) updateData.priceMonthly = parseFloat(priceMonthly)
    if (sessionsIncluded !== undefined) updateData.sessionsIncluded = parseInt(sessionsIncluded)
    if (pricePerExtraSession !== undefined) updateData.pricePerExtraSession = parseFloat(pricePerExtraSession)
    if (maxUsers !== undefined) updateData.maxUsers = parseInt(maxUsers)
    if (features !== undefined) updateData.features = features
    if (isActive !== undefined) updateData.isActive = isActive

    const plan = await db.plan.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ success: true, plan })
  } catch (error) {
    console.error("Error updating plan:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
  }
}

// DELETE - Delete plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params

    // Check if plan has subscriptions
    const subscriptionsCount = await db.subscription.count({
      where: { planId: id }
    })

    if (subscriptionsCount > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer un plan avec des abonnements actifs" },
        { status: 400 }
      )
    }

    await db.plan.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting plan:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
  }
}
