import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const settings = await db.siteSettings.findFirst()
    
    return NextResponse.json({
      maintenanceMode: settings?.maintenanceMode || false,
      maintenanceMessage: settings?.maintenanceMessage || null,
      siteName: settings?.siteName || "ContentPro"
    })
  } catch (error) {
    console.error("Error fetching maintenance status:", error)
    return NextResponse.json({
      maintenanceMode: false,
      maintenanceMessage: null,
      siteName: "ContentPro"
    })
  }
}
