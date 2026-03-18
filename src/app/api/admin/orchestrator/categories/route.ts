import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - List all categories with agents
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get("includeInactive") === "true"

    const categories = await db.agentCategory.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: {
        _count: {
          select: { agents: true }
        },
        agents: {
          select: { id: true, name: true, status: true }
        }
      },
      orderBy: { displayOrder: "asc" }
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, nameEn, nameEs, 
      slug, 
      description, descriptionEn, descriptionEs, 
      icon, color, accessLevel, displayOrder 
    } = body

    if (!name || !slug) {
      return NextResponse.json({ error: "Nom et slug requis" }, { status: 400 })
    }

    // Check if slug already exists
    const existing = await db.agentCategory.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 400 })
    }

    const category = await db.agentCategory.create({
      data: {
        name,
        nameEn,
        nameEs,
        slug,
        description,
        descriptionEn,
        descriptionEs,
        icon: icon || "Bot",
        color: color || "orange",
        accessLevel: accessLevel || "ALL",
        displayOrder: displayOrder || 0
      }
    })

    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 })
  }
}
