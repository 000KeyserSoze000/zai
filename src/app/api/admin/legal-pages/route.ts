import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET - Fetch all legal pages
export async function GET() {
  try {
    const pages = await db.legalPage.findMany({
      orderBy: { type: 'asc' }
    })
    return NextResponse.json(pages)
  } catch (error) {
    console.error("Error fetching legal pages:", error)
    return NextResponse.json(
      { error: "Failed to fetch legal pages" },
      { status: 500 }
    )
  }
}

// POST - Create or update a legal page
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Upsert - create if not exists, update if exists
    const page = await db.legalPage.upsert({
      where: { type: data.type },
      create: {
        type: data.type,
        title: data.title,
        content: data.content,
      },
      update: {
        title: data.title,
        content: data.content,
      }
    })
    
    return NextResponse.json(page)
  } catch (error) {
    console.error("Error saving legal page:", error)
    return NextResponse.json(
      { error: "Failed to save legal page" },
      { status: 500 }
    )
  }
}
