import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - List all tools
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const isActive = searchParams.get("isActive")

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (isActive !== null) where.isActive = isActive === "true"

    const tools = await db.tool.findMany({
      where,
      include: {
        _count: { select: { skills: true, executions: true } }
      },
      orderBy: { name: "asc" }
    })

    return NextResponse.json({ tools })
  } catch (error) {
    console.error("Error fetching tools:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Create new tool
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name, slug, description, type,
      endpoint, method, headers, authentication,
      inputSchema, outputSchema, costPerCall
    } = body

    if (!name || !slug || !inputSchema) {
      return NextResponse.json({ error: "Nom, slug et input schema requis" }, { status: 400 })
    }

    // Check if slug exists
    const existing = await db.tool.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 400 })
    }

    // Validate input schema
    try { JSON.parse(inputSchema) } catch {
      return NextResponse.json({ error: "Input schema JSON invalide" }, { status: 400 })
    }

    if (outputSchema) {
      try { JSON.parse(outputSchema) } catch {
        return NextResponse.json({ error: "Output schema JSON invalide" }, { status: 400 })
      }
    }

    const tool = await db.tool.create({
      data: {
        name,
        slug,
        description,
        type: type || "API",
        endpoint,
        method: method || "POST",
        headers,
        authentication,
        inputSchema,
        outputSchema,
        costPerCall: costPerCall || 0
      }
    })

    return NextResponse.json({ success: true, tool })
  } catch (error) {
    console.error("Error creating tool:", error)
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 })
  }
}
