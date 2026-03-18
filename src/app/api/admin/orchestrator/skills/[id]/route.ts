import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Get single skill with versions and stats
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

    const skill = await db.skill.findUnique({
      where: { id },
      include: {
        agent: {
          include: { category: true }
        },
        tools: {
          include: { tool: true },
          orderBy: { order: "asc" }
        },
        versions: {
          orderBy: { version: "desc" },
          take: 10
        },
        _count: {
          select: { executions: true, versions: true }
        }
      }
    })

    if (!skill) {
      return NextResponse.json({ error: "Skill non trouvé" }, { status: 404 })
    }

    // Get execution stats
    const stats = await db.executionLog.aggregate({
      where: { skillId: id },
      _count: true,
      _avg: {
        tokensUsed: true,
        cost: true
      }
    })

    const successCount = await db.executionLog.count({
      where: { skillId: id, status: 'success' }
    })

    return NextResponse.json({
      skill,
      stats: {
        ...stats,
        successRate: (stats._count ?? 0) > 0 ? (successCount / (stats._count ?? 1)) * 100 : 0
      }
    })
  } catch (error) {
    console.error("Error fetching skill:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PATCH - Update skill
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
      promptTemplate, inputSchema, outputSchema,
      examples, fallbackPrompt, maxRetries, timeoutMs,
      modelOverride, temperatureOverride,
      isActive, createVersion, changeNote,
      toolIds
    } = body

    const skill = await db.skill.findUnique({ where: { id } })
    if (!skill) {
      return NextResponse.json({ error: "Skill non trouvé" }, { status: 404 })
    }

    // Check slug uniqueness if changing
    if (slug && slug !== skill.slug) {
      const existing = await db.skill.findFirst({
        where: { slug, NOT: { id } }
      })
      if (existing) {
        return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 400 })
      }
    }

    // Validate JSON schemas if provided
    if (inputSchema) {
      try { JSON.parse(inputSchema) } catch {
        return NextResponse.json({ error: "Input schema JSON invalide" }, { status: 400 })
      }
    }
    if (outputSchema) {
      try { JSON.parse(outputSchema) } catch {
        return NextResponse.json({ error: "Output schema JSON invalide" }, { status: 400 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    if (promptTemplate !== undefined) updateData.promptTemplate = promptTemplate
    if (inputSchema !== undefined) updateData.inputSchema = inputSchema
    if (outputSchema !== undefined) updateData.outputSchema = outputSchema
    if (examples !== undefined) updateData.examples = examples
    if (fallbackPrompt !== undefined) updateData.fallbackPrompt = fallbackPrompt
    if (maxRetries !== undefined) updateData.maxRetries = maxRetries
    if (timeoutMs !== undefined) updateData.timeoutMs = timeoutMs
    if (modelOverride !== undefined) updateData.modelOverride = modelOverride
    if (temperatureOverride !== undefined) updateData.temperatureOverride = temperatureOverride
    if (isActive !== undefined) updateData.isActive = isActive

    // Check if we need to create a new version
    const shouldCreateVersion = createVersion || (
      (promptTemplate && promptTemplate !== skill.promptTemplate) ||
      (inputSchema && inputSchema !== skill.inputSchema) ||
      (outputSchema && outputSchema !== skill.outputSchema)
    )

    if (shouldCreateVersion) {
      const newVersion = skill.version + 1
      updateData.version = newVersion

      await db.skillVersion.create({
        data: {
          skillId: id,
          version: newVersion,
          promptTemplate: promptTemplate || skill.promptTemplate,
          inputSchema: inputSchema || skill.inputSchema,
          outputSchema: outputSchema || skill.outputSchema,
          examples: examples || skill.examples,
          changeNote: changeNote || `Version ${newVersion}`
        }
      })
    }

    // Update skill
    const updatedSkill = await db.skill.update({
      where: { id },
      data: updateData,
      include: {
        agent: true,
        tools: { include: { tool: true } }
      }
    })

    // Update tools if provided
    if (toolIds !== undefined) {
      // Remove existing tools
      await db.skillTool.deleteMany({ where: { skillId: id } })
      
      // Add new tools
      if (toolIds.length > 0) {
        await db.skillTool.createMany({
          data: toolIds.map((toolId: string, index: number) => ({
            skillId: id,
            toolId,
            order: index
          }))
        })
      }
    }

    return NextResponse.json({ success: true, skill: updatedSkill })
  } catch (error) {
    console.error("Error updating skill:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
  }
}

// DELETE - Delete skill
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

    // Delete versions first
    await db.skillVersion.deleteMany({ where: { skillId: id } })
    
    // Delete tool associations
    await db.skillTool.deleteMany({ where: { skillId: id } })
    
    // Delete execution logs
    await db.executionLog.deleteMany({ where: { skillId: id } })
    
    // Delete scheduled tasks
    await db.scheduledTask.deleteMany({ where: { skillId: id } })
    
    // Delete skill
    await db.skill.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting skill:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
  }
}
