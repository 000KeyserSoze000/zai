import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-utils"

/**
 * PATCH /api/admin/esc-skills/[id]
 * Mettre à jour une skill ESC (activation, contenu, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()

    const skill = await db.escSkill.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        category: body.category,
        isActive: body.isActive,
        icon: body.icon,
        color: body.color,
        promptContent: body.promptContent,
      },
    })

    return NextResponse.json(skill)
  } catch (error) {
    console.error("[ESC Skill PATCH] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/esc-skills/[id]
 * Supprimer une skill ESC de la collection
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = params
    await db.escSkill.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Skill supprimée" })
  } catch (error) {
    console.error("[ESC Skill DELETE] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
