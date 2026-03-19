import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-utils"

/**
 * GET /api/admin/esc-skills
 * Liste toutes les skills ESC importées
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const isActive = searchParams.get("isActive")

    const where: any = {}
    if (category) where.category = category
    if (isActive !== null) where.isActive = isActive === "true"

    const skills = await db.escSkill.findMany({
      where,
      orderBy: { name: "asc" },
    })

    return NextResponse.json(skills)
  } catch (error) {
    console.error("[ESC Skills GET] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * POST /api/admin/esc-skills
 * Créer manuellement une skill ESC
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const skill = await db.escSkill.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        category: body.category || "general",
        promptContent: body.promptContent,
        icon: body.icon || "Zap",
        color: body.color || "orange",
        isActive: body.isActive ?? false,
      },
    })

    return NextResponse.json(skill)
  } catch (error) {
    console.error("[ESC Skills POST] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
