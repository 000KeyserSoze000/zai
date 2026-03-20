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

    const body = await request.json().catch(() => ({}))
    const { url } = body

    // 1. If URL is provided, handle single skill import
    if (url) {
      logs.push(`Manual import requested for URL: ${url}`)
      
      if (url.includes('smithery.ai/skills/')) {
        return await handleSmitheryImport(url, logs)
      } else if (url.includes('raw.githubusercontent.com')) {
        return await handleGitHubRawImport(url, logs)
      } else {
        throw new Error("URL non supportée. Utilisez une URL Smithery Skill ou GitHub Raw.")
      }
    }

    // 2. Default logic: Sync from hardcoded GitHub Manifest
    return await handleGitHubBulkSync(logs)

  } catch (error) {
    console.error("[ESC Import] Error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal Server Error",
      logs
    }, { status: 500 })
  }
}

async function handleGitHubBulkSync(logs: string[]) {
  logs.push(`Starting bulk sync from: ${GITHUB_MANIFEST_URL}`)
  const manifestRes = await fetch(GITHUB_MANIFEST_URL, { cache: 'no-store' })
  if (!manifestRes.ok) throw new Error("Impossible de récupérer le manifeste ESC")
  
  const manifest = await manifestRes.json()
  const skillEntries = Object.entries(manifest.skills || {})
  const results = { added: 0, updated: 0, errors: 0 }

  for (const [slug, skillInfo] of skillEntries) {
    try {
      const { path, version, category } = skillInfo as any
      const name = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      const skillMdUrl = `${GITHUB_BASE_URL}/${path}`
      const skillMdRes = await fetch(skillMdUrl, { cache: 'no-store' })
      if (!skillMdRes.ok) continue
      
      const promptContent = await skillMdRes.text()
      const existing = await db.escSkill.findUnique({ where: { slug } })

      if (existing) {
        await db.escSkill.update({
          where: { slug },
          data: { name, version: version || "1.0.0", promptContent, updatedAt: new Date() }
        })
        results.updated++
      } else {
        await db.escSkill.create({
          data: {
            name, slug, version: version || "1.0.0", 
            category: category || "general", 
            promptContent, source: "github", 
            providerUrl: `https://github.com/guilhermemarketing/esc-skills/tree/main/${path}`,
            isActive: false
          }
        })
        results.added++
      }
    } catch (err) { results.errors++ }
  }

  return NextResponse.json({ success: true, results, logs })
}

async function handleSmitheryImport(url: string, logs: string[]) {
  // Extraction du slug: https://smithery.ai/skills/author/slug -> author/slug
  const parts = url.split('/skills/')[1]?.split('/')
  if (!parts || parts.length < 2) throw new Error("URL Smithery invalide")
  
  const author = parts[0]
  const slug = parts[1]
  const name = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  logs.push(`Smithery metadata: Author=${author}, Slug=${slug}`)
  
  // Simulation: En attendant une API officielle, on crée une entrée avec l'URL
  // On mettra le contenu du prompt plus tard ou on tente de le deviner si c'est public
  const existing = await db.escSkill.findUnique({ where: { slug } })
  
  const data = {
    name,
    slug,
    description: `Importé depuis Smithery.ai (${author})`,
    source: "smithery.ai",
    providerUrl: url,
    version: "1.0.0",
    category: "smithery",
    promptContent: `-- IMPORTÉ DE SMITHERY --\nURL: ${url}\n\nNote: Le contenu complet (SKILL.md) doit être récupéré manuellement ou via le crawler si disponible.`,
    files: { "SOURCE_URL": url },
    isActive: true
  }

  if (existing) {
    await db.escSkill.update({ where: { slug }, data })
  } else {
    await db.escSkill.create({ data })
  }

  return NextResponse.json({ success: true, results: { added: existing ? 0 : 1, updated: existing ? 1 : 0 }, logs })
}

async function handleGitHubRawImport(url: string, logs: string[]) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error("Impossible de lire le fichier Raw GitHub")
  
  const promptContent = await res.text()
  const slug = url.split('/').pop()?.replace('.md', '') || 'manual-github'
  const name = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  const data = {
    name, slug, promptContent,
    source: "github-raw",
    providerUrl: url,
    isActive: true
  }

  const existing = await db.escSkill.findUnique({ where: { slug } })
  if (existing) {
    await db.escSkill.update({ where: { slug }, data })
  } else {
    await db.escSkill.create({ data })
  }

  return NextResponse.json({ success: true, results: { added: existing ? 0 : 1, updated: existing ? 1 : 0 }, logs })
}
