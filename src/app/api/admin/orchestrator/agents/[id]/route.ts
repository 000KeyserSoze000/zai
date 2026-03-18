import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Get single agent with skills and stats
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

    const agent = await db.agent.findUnique({
      where: { id },
      include: {
        category: true,
        skills: {
          include: {
            _count: { select: { executions: true } }
          }
        },
        _count: {
          select: { skills: true, executions: true }
        }
      }
    })

    if (!agent) {
      return NextResponse.json({ error: "Agent non trouvé" }, { status: 404 })
    }

    // Get recent executions
    const recentExecutions = await db.executionLog.findMany({
      where: { agentId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        success: true,
        tokensInput: true,
        tokensOutput: true,
        cost: true,
        latencyMs: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      agent,
      recentExecutions
    })
  } catch (error) {
    console.error("Error fetching agent:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PATCH - Update agent
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
      name, slug, description, avatar, color,
      systemPrompt, modelProvider, modelName, temperature, maxTokens,
      categoryId, status
    } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) {
      const existing = await db.agent.findFirst({
        where: { slug, NOT: { id } }
      })
      if (existing) {
        return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 400 })
      }
      updateData.slug = slug
    }
    if (description !== undefined) updateData.description = description
    if (avatar !== undefined) updateData.avatar = avatar
    if (color !== undefined) updateData.color = color
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt
    if (modelProvider !== undefined) updateData.modelProvider = modelProvider
    if (modelName !== undefined) updateData.modelName = modelName
    if (temperature !== undefined) updateData.temperature = temperature
    if (maxTokens !== undefined) updateData.maxTokens = maxTokens
    if (categoryId !== undefined) {
      const category = await db.agentCategory.findUnique({ where: { id: categoryId } })
      if (!category) {
        return NextResponse.json({ error: "Catégorie non trouvée" }, { status: 400 })
      }
      updateData.categoryId = categoryId
    }
    if (status !== undefined) updateData.status = status

    const agent = await db.agent.update({
      where: { id },
      data: updateData,
      include: { category: true }
    })

    return NextResponse.json({ success: true, agent })
  } catch (error) {
    console.error("Error updating agent:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
  }
}

// DELETE - Delete agent
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

    // Check if agent has skills
    const skillsCount = await db.skill.count({ where: { agentId: id } })
    if (skillsCount > 0) {
      // Delete skills first
      await db.skill.deleteMany({ where: { agentId: id } })
    }

    // Delete execution logs
    await db.executionLog.deleteMany({ where: { agentId: id } })

    // Delete scheduled tasks
    await db.scheduledTask.deleteMany({ where: { agentId: id } })

    // Delete agent
    await db.agent.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting agent:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
  }
}
