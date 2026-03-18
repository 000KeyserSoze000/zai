import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// PATCH - Update subscription
export async function PATCH(
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
    const { status, sessionsLimit, planId } = body

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (typeof sessionsLimit === "number") updateData.sessionsLimit = sessionsLimit
    
    // If planId is provided, update the plan and sessions limit from the new plan
    if (planId) {
      const plan = await db.plan.findUnique({ where: { id: planId } })
      if (!plan) {
        return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 })
      }
      updateData.planId = planId
      // Update sessionsLimit to match new plan if not explicitly provided
      if (typeof sessionsLimit !== "number") {
        updateData.sessionsLimit = plan.sessionsIncluded
      }
    }

    const subscription = await db.subscription.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { email: true, name: true } },
        plan: true
      }
    })

    return NextResponse.json({ success: true, subscription })
  } catch (error) {
    console.error("Error updating subscription:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
  }
}

// DELETE - Delete subscription
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

    await db.subscription.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting subscription:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
  }
}
