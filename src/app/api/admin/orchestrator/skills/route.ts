import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - List all skills
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agentId")
    const type = searchParams.get("type")
    const isActive = searchParams.get("isActive")

    const where: Record<string, unknown> = {}
    if (agentId) where.agentId = agentId
    if (type) where.type = type
    if (isActive !== null) where.isActive = isActive === "true"

    const skills = await db.skill.findMany({
      where,
      include: {
        agent: {
          include: { category: true }
        },
        tools: {
          include: { tool: true }
        },
        _count: { select: { executions: true, versions: true } }
      },
      orderBy: [{ agent: { name: "asc" } }, { name: "asc" }]
    })

    return NextResponse.json({ skills })
  } catch (error) {
    console.error("Error fetching skills:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Create new skill
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name, slug, description, type,
      promptTemplate, inputSchema, outputSchema,
      examples, fallbackPrompt, maxRetries, timeoutMs,
      modelOverride, temperatureOverride,
      agentId, toolIds
    } = body

    if (!name || !slug || !promptTemplate || !inputSchema || !outputSchema || !agentId) {
      return NextResponse.json({
        error: "Nom, slug, prompt, schemas et agent requis"
      }, { status: 400 })
    }

    // Check if slug exists
    const existing = await db.skill.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 400 })
    }

    // Verify agent exists
    const agent = await db.agent.findUnique({ where: { id: agentId } })
    if (!agent) {
      return NextResponse.json({ error: "Agent non trouvé" }, { status: 400 })
    }

    // Validate JSON schemas
    try {
      JSON.parse(inputSchema)
      JSON.parse(outputSchema)
    } catch {
      return NextResponse.json({ error: "Schemas JSON invalides" }, { status: 400 })
    }

    // Create skill with tools
    const skill = await db.skill.create({
      data: {
        name,
        slug,
        description,
        type: type || "GENERATION",
        promptTemplate,
        inputSchema,
        outputSchema,
        examples,
        fallbackPrompt,
        maxRetries: maxRetries ?? 3,
        timeoutMs: timeoutMs ?? 30000,
        modelOverride,
        temperatureOverride,
        agentId,
        version: 1,
        tools: toolIds ? {
          create: toolIds.map((toolId: string, index: number) => ({
            toolId,
            order: index
          }))
        } : undefined
      },
      include: {
        agent: true,
        tools: { include: { tool: true } }
      }
    })

    // Create initial version
    await db.skillVersion.create({
      data: {
        skillId: skill.id,
        version: 1,
        promptTemplate,
        inputSchema,
        outputSchema,
        examples,
        changeNote: "Version initiale"
      }
    })

    return NextResponse.json({ success: true, skill })
  } catch (error) {
    console.error("Error creating skill:", error)
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 })
  }
}
