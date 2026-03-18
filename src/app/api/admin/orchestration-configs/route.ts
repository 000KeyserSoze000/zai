import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - List all orchestration configs
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const configs = await db.orchestrationConfig.findMany({
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ configs })
  } catch (error) {
    console.error("Error fetching orchestration configs:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Create new orchestration config
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { name, isDefault, isActive, categories } = body

    // If setting as default, remove default from others
    if (isDefault) {
      await db.orchestrationConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      })
    }

    const config = await db.orchestrationConfig.create({
      data: {
        name,
        isDefault: isDefault ?? false,
        isActive: isActive ?? true,
        categories: categories || "[]"
      }
    })

    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error("Error creating orchestration config:", error)
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 })
  }
}
