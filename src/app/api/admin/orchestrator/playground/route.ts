import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { generateAIResponse, calculateCost } from "@/lib/ai-provider"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { agentId, skillId, input } = await request.json()

    if (!agentId || !input) {
      return NextResponse.json({ error: "Agent ID and input are required" }, { status: 400 })
    }

    // Fetch agent and skill context
    const agent = await db.agent.findUnique({
      where: { id: agentId },
      include: {
        category: true,
      }
    })

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    let skill: any = null
    if (skillId) {
      skill = await db.skill.findUnique({
        where: { id: skillId }
      })
    }

    // Capture start time
    const startTime = Date.now()

    // Create a log entry as 'RUNNING'
    const log = await db.executionLog.create({
      data: {
        status: "RUNNING",
        agentId,
        skillId,
        input: JSON.stringify(input),
      }
    })

    try {
      // 1. Prepare Prompt
      let systemPrompt = agent.systemPrompt
      let userPrompt = typeof input === 'string' ? input : JSON.stringify(input)

      // 2. Process Skill Template if any
      if (skill) {
        // Simple template replacement: {{topic}} or {{input}}
        userPrompt = skill.promptTemplate
          .replace(/{{topic}}/g, input)
          .replace(/{{input}}/g, input)
          .replace(/{{target}}/g, "YouTube Audience") // Default for now
      }

      // 3. Execute AI Request
      const aiResponse = await generateAIResponse(systemPrompt, userPrompt, {
        model: agent.modelName,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        userId: session.id
      })

      const durationMs = Date.now() - startTime
      const tokensUsed = aiResponse.tokensUsed
      const cost = calculateCost(aiResponse.model, tokensUsed)

      // Update log to 'SUCCESS'
      await db.executionLog.update({
        where: { id: log.id },
        data: {
          status: "SUCCESS",
          output: aiResponse.content,
          durationMs,
          tokensUsed,
          cost
        }
      })

      return NextResponse.json({
        id: log.id,
        result: aiResponse.content,
        durationMs,
        cost
      })

    } catch (execError: any) {
      // Update log to 'FAILED'
      await db.executionLog.update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          error: execError.message || "Execution error"
        }
      })
      throw execError
    }

  } catch (error: any) {
    console.error("Playground error:", error)
    return NextResponse.json({ error: error.message || "Failed to execute" }, { status: 500 })
  }
}
