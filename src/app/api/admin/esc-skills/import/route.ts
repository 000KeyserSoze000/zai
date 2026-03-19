import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-utils"

const GITHUB_MANIFEST_URL = "https://raw.githubusercontent.com/guilhermemarketing/esc-skills/main/manifest.json"
const GITHUB_BASE_URL = "https://raw.githubusercontent.com/guilhermemarketing/esc-skills/main"

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/esc-skills/import
 * Synchronise les skills depuis le dépôt GitHub
 */
export async function POST(request: NextRequest) {
  const logs: string[] = []
  try {
    const user = await requireAuth(request)
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    logs.push("Auth success as ADMIN")

    // 1. Fetch manifest.json (no-cache)
    logs.push(`Fetching manifest: ${GITHUB_MANIFEST_URL}`)
    const manifestRes = await fetch(GITHUB_MANIFEST_URL, { cache: 'no-store' })
    if (!manifestRes.ok) {
      logs.push(`Failed to fetch manifest: ${manifestRes.status}`)
      throw new Error("Impossible de récupérer le manifeste ESC")
    }
    
    const manifest = await manifestRes.json()
    const skillsMap = manifest.skills || {}
    const skillEntries = Object.entries(skillsMap)

    logs.push(`Found ${skillEntries.length} skills in manifest`)

    const results = {
      added: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    }

    // 2. Parcourir les skills
    for (const [slug, skillInfo] of skillEntries) {
      try {
        const { path, version } = skillInfo as any
        
        const name = slug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        
        const skillMdUrl = `${GITHUB_BASE_URL}/${path}`
        
        const skillMdRes = await fetch(skillMdUrl, { cache: 'no-store' })
        if (!skillMdRes.ok) {
          logs.push(`Error fetching ${slug} at ${path}`)
          results.errors++
          continue
        }
        
        const promptContent = await skillMdRes.text()

        // Sync with DB
        const existing = await db.escSkill.findUnique({ where: { slug } })

        if (existing) {
          await db.escSkill.update({
            where: { slug },
            data: {
              name,
              version: version || "1.0.0",
              promptContent,
              updatedAt: new Date(),
            },
          })
          results.updated++
        } else {
          await db.escSkill.create({
            data: {
              name,
              slug,
              version: version || "1.0.0",
              category: "general",
              promptContent,
              source: "esc-skills",
              isActive: false,
            },
          })
          results.added++
        }
      } catch (err) {
        logs.push(`Error processing ${slug}: ${err instanceof Error ? err.message : String(err)}`)
        results.errors++
      }
    }

    logs.push(`Final results: added=${results.added}, updated=${results.updated}, errors=${results.errors}`)

    return NextResponse.json({
      success: true,
      results,
      logs
    })
  } catch (error) {
    console.error("[ESC Import] Global Error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal Server Error",
      logs
    }, { status: 500 })
  }
}
