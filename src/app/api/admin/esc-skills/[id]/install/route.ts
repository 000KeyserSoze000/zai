import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-utils"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req)
    const { id } = await params
    const { agentId } = await req.json()

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
    }

    const escSkill = await db.escSkill.findUnique({
      where: { id },
    })

    if (!escSkill) {
      return NextResponse.json({ error: "ESC Skill not found" }, { status: 404 })
    }

    // Check if skill already exists in regular Skill table
    let existingSkill = await db.skill.findUnique({
      where: { slug: escSkill.slug }
    })

    if (existingSkill) {
      // Update it
      existingSkill = await db.skill.update({
        where: { id: existingSkill.id },
        data: {
          name: escSkill.name,
          description: escSkill.description,
          promptTemplate: escSkill.promptContent,
          agentId: agentId,
          isActive: true
        }
      })
    } else {
      // Create new
      existingSkill = await db.skill.create({
        data: {
          name: escSkill.name,
          slug: escSkill.slug,
          description: escSkill.description,
          promptTemplate: escSkill.promptContent,
          inputSchema: JSON.stringify({ "type": "object", "properties": { "text": { "type": "string" } } }),
          outputSchema: JSON.stringify({ "type": "object", "properties": { "result": { "type": "string" } } }),
          agentId: agentId,
          isActive: true,
          type: "GENERATION",
          version: 1
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      skill: existingSkill,
      message: existingSkill ? "Skill mise à jour et assignée" : "Nouvelle skill créée et assignée"
    })
  } catch (error: any) {
    console.error("Installation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
