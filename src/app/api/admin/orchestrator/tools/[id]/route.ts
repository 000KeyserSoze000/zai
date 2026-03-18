import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Get single tool
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

    const tool = await db.tool.findUnique({
      where: { id },
      include: {
        skills: {
          include: {
            skill: { include: { agent: true } }
          }
        },
        executions: {
          take: 20,
          orderBy: { createdAt: "desc" }
        },
        _count: {
          select: { skills: true, executions: true }
        }
      }
    })

    if (!tool) {
      return NextResponse.json({ error: "Tool non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ tool })
  } catch (error) {
    console.error("Error fetching tool:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PATCH - Update tool
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
      name, slug, description, type,
      endpoint, method, headers, authentication,
      inputSchema, outputSchema, costPerCall,
      isActive
    } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) {
      const existing = await db.tool.findFirst({
        where: { slug, NOT: { id } }
      })
      if (existing) {
        return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 400 })
      }
      updateData.slug = slug
    }
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    if (endpoint !== undefined) updateData.endpoint = endpoint
    if (method !== undefined) updateData.method = method
    if (headers !== undefined) updateData.headers = headers
    if (authentication !== undefined) updateData.authentication = authentication
    if (inputSchema !== undefined) {
      try { JSON.parse(inputSchema) } catch {
        return NextResponse.json({ error: "Input schema JSON invalide" }, { status: 400 })
      }
      updateData.inputSchema = inputSchema
    }
    if (outputSchema !== undefined) {
      try { JSON.parse(outputSchema) } catch {
        return NextResponse.json({ error: "Output schema JSON invalide" }, { status: 400 })
      }
      updateData.outputSchema = outputSchema
    }
    if (costPerCall !== undefined) updateData.costPerCall = costPerCall
    if (isActive !== undefined) updateData.isActive = isActive

    const tool = await db.tool.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ success: true, tool })
  } catch (error) {
    console.error("Error updating tool:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
  }
}

// DELETE - Delete tool
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

    // Remove skill associations
    await db.skillTool.deleteMany({ where: { toolId: id } })
    
    // Delete execution logs
    await db.executionLog.deleteMany({ where: { toolId: id } })
    
    // Delete tool
    await db.tool.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting tool:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
  }
}
