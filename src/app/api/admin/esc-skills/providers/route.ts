import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-utils"

/**
 * GET /api/admin/esc-skills/providers
 * List all providers
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const providers = await (db as any).skillProvider.findMany({
      orderBy: { createdAt: "asc" }
    })
    return NextResponse.json(providers)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * POST /api/admin/esc-skills/providers
 * Create or Update a provider
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const body = await request.json()
    const { id, name, url, type, isActive } = body

    if (!name || !url) {
      return NextResponse.json({ error: "Name and URL are required" }, { status: 400 })
    }

    const cleanUrl = url.replace(/\/$/, "")
    if (id) {
      // Update
      const provider = await (db as any).skillProvider.update({
        where: { id },
        data: { name, url: cleanUrl, type, isActive }
      })
      return NextResponse.json(provider)
    } else {
      // Create
      const provider = await (db as any).skillProvider.create({
        data: { name, url: cleanUrl, type: type || "GITHUB_REPO", isActive: isActive ?? true }
      })
      return NextResponse.json(provider)
    }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Cette URL est déjà enregistrée." }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/esc-skills/providers
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    await (db as any).skillProvider.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
