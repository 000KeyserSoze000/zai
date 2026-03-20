import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-utils"

/**
 * POST /api/admin/esc-skills/bulk
 * Mass actions on ESC Skills (Delete, Move)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { ids, action, targetCategory, category, providerUrl } = await request.json()

    if (action === "DELETE") {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "No IDs provided" }, { status: 400 })
      }
      await (db as any).escSkill.deleteMany({
        where: { id: { in: ids } }
      })
      return NextResponse.json({ success: true, count: ids.length })
    }

    if (action === "DELETE_BY_CATEGORY" && category) {
      const result = await (db as any).escSkill.deleteMany({
        where: { category }
      })
      return NextResponse.json({ success: true, count: result.count })
    }

    if (action === "DELETE_BY_PROVIDER" && providerUrl) {
      const result = await (db as any).escSkill.deleteMany({
        where: { providerUrl }
      })
      return NextResponse.json({ success: true, count: result.count })
    }

    if (action === "MOVE" && targetCategory) {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "No IDs provided" }, { status: 400 })
      }
      await (db as any).escSkill.updateMany({
        where: { id: { in: ids } },
        data: { category: targetCategory }
      })
      return NextResponse.json({ success: true, count: ids.length })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[Bulk Action POST] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
