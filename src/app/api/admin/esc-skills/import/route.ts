import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-utils"

const GITHUB_MANIFEST_URL = "https://raw.githubusercontent.com/guilhermemarketing/esc-skills/main/manifest.json"
const GITHUB_BASE_URL = "https://raw.githubusercontent.com/guilhermemarketing/esc-skills/main"

/**
 * POST /api/admin/esc-skills/import
 * Synchronise les skills depuis le dépôt GitHub
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // 1. Fetch manifest.json
    console.log("[ESC Import] Fetching manifest from:", GITHUB_MANIFEST_URL)
    const manifestRes = await fetch(GITHUB_MANIFEST_URL)
    if (!manifestRes.ok) throw new Error("Impossible de récupérer le manifeste ESC")
    const manifest = await manifestRes.json()

    const results = {
      added: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    }

    // 2. Parcourir les skills du manifeste
    // Le format est { skills: { "slug": { path, version, hash } } }
    const skillsMap = manifest.skills || {}
    const skillEntries = Object.entries(skillsMap)

    console.log(`[ESC Import] Found ${skillEntries.length} skills in manifest`)

    for (const [slug, skillInfo] of skillEntries) {
      try {
        const { path, version } = skillInfo as any
        
        // Generer un nom lisible depuis le slug
        const name = slug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        
        // Fetch the SKILL.md content
        const skillMdUrl = `${GITHUB_BASE_URL}/${path}`
        console.log(`[ESC Import] Fetching ${slug} content from:`, skillMdUrl)
        
        const skillMdRes = await fetch(skillMdUrl)
        if (!skillMdRes.ok) {
          console.error(`[ESC Import] Failed to fetch content for ${slug} at ${skillMdUrl}`)
          results.errors++
          continue
        }
        const promptContent = await skillMdRes.text()

        // Check if exists
        const existing = await db.escSkill.findUnique({ where: { slug } })

        if (existing) {
          // Update
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
          // Create new
          await db.escSkill.create({
            data: {
              name,
              slug,
              version: version || "1.0.0",
              category: "general", // Par défaut
              promptContent,
              source: "esc-skills",
              isActive: false, // Inactif par défaut
            },
          })
          results.added++
        }
      } catch (err) {
        console.error(`[ESC Import] Error processing skill ${slug}:`, err)
        results.errors++
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("[ESC Import] Global Error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal Server Error" 
    }, { status: 500 })
  }
}
