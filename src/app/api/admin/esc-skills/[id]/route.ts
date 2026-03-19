import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-utils"

/**
 * PATCH /api/admin/esc-skills/[id]
 * Mettre à jour une skill ESC (activation, contenu, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await requireAuth(request)
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Await params for Next.js 15+ support
    const resolvedParams = await (params as any)
    const id = resolvedParams.id
    
    console.log(`[ESC Skill PATCH] Updating skill ${id}`)
    
    const body = await request.json()

    // Clean data to avoid sending undefined to required fields if they are in the body
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.description !== undefined) updateData.description = body.description
    if (body.category !== undefined) updateData.category = body.category
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.icon !== undefined) updateData.icon = body.icon
    if (body.color !== undefined) updateData.color = body.color
    if (body.promptContent !== undefined) updateData.promptContent = body.promptContent

    const skill = await db.escSkill.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(skill)
  } catch (error) {
    console.error("[ESC Skill PATCH] Error:", error)
    return NextResponse.json({ 
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/esc-skills/[id]
 * Supprimer une skill ESC de la collection
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await requireAuth(request)
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const resolvedParams = await (params as any)
    const id = resolvedParams.id
    
    await db.escSkill.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Skill supprimée" })
  } catch (error) {
    console.error("[ESC Skill DELETE] Error:", error)
    return NextResponse.json({ 
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
