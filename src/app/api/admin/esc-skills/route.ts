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
    const search = searchParams.get("search")
    const source = searchParams.get("source")
    const providerUrl = searchParams.get("providerUrl")

    const where: any = {}
    
    if (category && category !== "all") {
      where.category = category
    }
    
    if (source && source !== "all") {
      where.source = source
    }

    if (providerUrl && providerUrl !== "all") {
      where.providerUrl = providerUrl
    }
    
    if (isActive !== null && isActive !== "") {
      where.isActive = isActive === "true"
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [skills, installedSkills] = await Promise.all([
      (db as any).escSkill.findMany({
        where,
        orderBy: { updatedAt: "desc" },
      }),
      db.skill.findMany({
        select: { slug: true, agent: { select: { name: true } } }
      })
    ])

    const results = skills.map(s => {
      const installed = installedSkills.find(is => is.slug === s.slug)
      return {
        ...s,
        isInstalled: !!installed,
        installedAgentName: installed?.agent?.name
      }
    })

    return NextResponse.json(results)
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
    const skill = await (db as any).escSkill.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        category: body.category || "general",
        source: body.source || "manual",
        providerUrl: body.providerUrl,
        version: body.version || "1.0.0",
        promptContent: body.promptContent,
        files: body.files || {},
        tags: body.tags,
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
