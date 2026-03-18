import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const tasks = await db.scheduledTask.findMany({
      include: {
        skill: {
          include: {
            agent: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("[SCHEDULER_GET]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, cron, skillId, inputData, description } = body

    const task = await db.scheduledTask.create({
      data: {
        name,
        cron,
        skillId,
        inputData,
        description,
        status: "ACTIVE",
        isActive: true
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error("[SCHEDULER_POST]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
