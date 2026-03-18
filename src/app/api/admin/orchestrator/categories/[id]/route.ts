import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Get single category
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

    const category = await db.agentCategory.findUnique({
      where: { id },
      include: {
        agents: {
          include: {
            _count: { select: { skills: true } }
          }
        },
        _count: { select: { agents: true } }
      }
    })

    if (!category) {
      return NextResponse.json({ error: "Catégorie non trouvée" }, { status: 404 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error("Error fetching category:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PATCH - Update category
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
    const { 
      name, nameEn, nameEs, 
      slug, 
      description, descriptionEn, descriptionEs, 
      icon, color, isActive, accessLevel, displayOrder 
    } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (nameEn !== undefined) updateData.nameEn = nameEn
    if (nameEs !== undefined) updateData.nameEs = nameEs
    
    if (slug !== undefined) {
      // Check if slug exists for another category
      const existing = await db.agentCategory.findFirst({
        where: { slug, NOT: { id } }
      })
      if (existing) {
        return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 400 })
      }
      updateData.slug = slug
    }
    
    if (description !== undefined) updateData.description = description
    if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn
    if (descriptionEs !== undefined) updateData.descriptionEs = descriptionEs
    
    if (icon !== undefined) updateData.icon = icon
    if (color !== undefined) updateData.color = color
    if (isActive !== undefined) updateData.isActive = isActive
    if (accessLevel !== undefined) updateData.accessLevel = accessLevel
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder

    const category = await db.agentCategory.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
  }
}

// DELETE - Delete category
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

    // Check if category has agents
    const agentsCount = await db.agent.count({ where: { categoryId: id } })
    if (agentsCount > 0) {
      return NextResponse.json({
        error: `Impossible de supprimer: ${agentsCount} agent(s) appartiennent à cette catégorie`
      }, { status: 400 })
    }

    await db.agentCategory.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
  }
}
