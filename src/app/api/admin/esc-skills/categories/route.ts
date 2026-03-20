import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-utils"

/**
 * POST /api/admin/esc-skills/categories
 * Renaming or Deleting a whole category
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { oldName, newName, action } = await request.json()

    if (!oldName) {
      return NextResponse.json({ error: "Old category name required" }, { status: 400 })
    }

    if (action === "RENAME" && newName) {
      const result = await db.escSkill.updateMany({
        where: { category: oldName },
        data: { category: newName }
      })
      return NextResponse.json({ success: true, count: result.count })
    }

    if (action === "DELETE") {
      const result = await db.escSkill.deleteMany({
        where: { category: oldName }
      })
      return NextResponse.json({ success: true, count: result.count })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[Categories Action POST] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
