import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - List all agents
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")
    const status = searchParams.get("status")

    const where: Record<string, unknown> = {}
    if (categoryId) where.categoryId = categoryId
    if (status) where.status = status

    const agents = await db.agent.findMany({
      where,
      include: {
        category: true,
        _count: { select: { skills: true, executions: true } }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ agents })
  } catch (error) {
    console.error("Error fetching agents:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Create new agent
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name, slug, description, avatar, color,
      systemPrompt, modelProvider, modelName, temperature, maxTokens,
      categoryId, status
    } = body

    if (!name || !slug || !systemPrompt || !categoryId) {
      return NextResponse.json({ error: "Nom, slug, prompt système et catégorie requis" }, { status: 400 })
    }

    // Check if slug exists
    const existing = await db.agent.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 400 })
    }

    // Verify category exists
    const category = await db.agentCategory.findUnique({ where: { id: categoryId } })
    if (!category) {
      return NextResponse.json({ error: "Catégorie non trouvée" }, { status: 400 })
    }

    const agent = await db.agent.create({
      data: {
        name,
        slug,
        description,
        avatar,
        color: color || "orange",
        systemPrompt,
        modelProvider: modelProvider || "openrouter",
        modelName: modelName || "anthropic/claude-3.5-sonnet",
        temperature: temperature ?? 0.7,
        maxTokens: maxTokens || 4096,
        categoryId,
        status: status || "ACTIVE"
      },
      include: { category: true }
    })

    return NextResponse.json({ success: true, agent })
  } catch (error) {
    console.error("Error creating agent:", error)
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 })
  }
}
