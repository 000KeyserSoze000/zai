import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Get single orchestration config
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
    const config = await db.orchestrationConfig.findUnique({
      where: { id }
    })

    if (!config) {
      return NextResponse.json({ error: "Configuration non trouvée" }, { status: 404 })
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error("Error fetching orchestration config:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PUT - Update orchestration config
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
    const { name, isDefault, isActive, categories } = body

    // If setting as default, remove default from others
    if (isDefault) {
      await db.orchestrationConfig.updateMany({
        where: { isDefault: true, NOT: { id } },
        data: { isDefault: false }
      })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (isDefault !== undefined) updateData.isDefault = isDefault
    if (isActive !== undefined) updateData.isActive = isActive
    if (categories !== undefined) updateData.categories = categories

    const config = await db.orchestrationConfig.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error("Error updating orchestration config:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
  }
}

// DELETE - Delete orchestration config
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
    await db.orchestrationConfig.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting orchestration config:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
  }
}
