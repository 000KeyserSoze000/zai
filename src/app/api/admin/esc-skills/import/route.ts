import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-utils"

const GITHUB_MANIFEST_URL = "https://raw.githubusercontent.com/guilhermemarketing/esc-skills/main/manifest.json"
const GITHUB_BASE_URL = "https://raw.githubusercontent.com/guilhermemarketing/esc-skills/main"

export const dynamic = 'force-dynamic'

/**
 * Helper to extract skill name from content, skipping comments and frontmatter
 */
function extractSkillName(content: string, fallback: string): string {
  const lines = content.split("\n")
  let inFrontmatter = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // Skip frontmatter
    if (line === "---") {
      inFrontmatter = !inFrontmatter
      continue
    }
    if (inFrontmatter) continue

    // Skip HTML Comments
    if (line.startsWith("<!--")) continue

    // Skip other metadata markers [KEY]: VALUE
    if (/^\[.*\]:/.test(line)) continue

    // We found the first real content line!
    // Strip Markdown heading markers #
    return line.replace(/^#+\s*/, "").replace(/^[*-]\s*/, "").replace(/[*:].*$/, "").trim()
  }
  
  return fallback
}

/**
 * POST /api/admin/esc-skills/import
 */
export async function POST(request: NextRequest) {
  const logs: string[] = []
  try {
    const user = await requireAuth(request)
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { url, providerId } = body

    if (url) {
      logs.push(`Manual import requested for URL: ${url}`)
      
      if (url.includes('smithery.ai/skills/')) {
        return await handleSmitheryImport(url, logs)
      } else if (url.includes('github.com')) {
        return await handleGitHubImport(url, logs)
      } else {
        throw new Error("URL non supportée. Utilisez une URL Smithery Skill ou GitHub (Tree/Blob).")
      }
    }

    return await handleGitHubBulkSync(logs, providerId)

  } catch (error) {
    console.error("[ESC Import] Error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal Server Error",
      logs
    }, { status: 500 })
  }
}

async function fetchFileContent(url: string) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return null
  return await res.text()
}

async function fetchGitHubDirectory(owner: string, repo: string, branch: string, path: string, logs: string[], depth = 0): Promise<Record<string, string>> {
  if (depth > 2) return {} 
  
  const files: Record<string, string> = {}
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
  
  try {
    logs.push(`Listing directory [depth=${depth}]: ${path || '(root)'}`)
    const res = await fetch(apiUrl, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Zai-ESC-Importer"
      },
      cache: 'no-store'
    })
    
    if (!res.ok) {
      logs.push(`API List failed (${res.status}). Falling back to single file fetch for path: ${path}`)
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
      const content = await fetchFileContent(rawUrl)
      if (content) files[path.split("/").pop() || "SKILL.md"] = content
      return files
    }

    const items = await res.json()
    if (!Array.isArray(items)) {
      logs.push(`Not a directory. Fetching single file: ${path}`)
      const downloadUrl = items.download_url || `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
      const content = await fetchFileContent(downloadUrl)
      if (content) files[path.split("/").pop() || "SKILL.md"] = content
      return files
    }

    logs.push(`Found ${items.length} items in ${path || 'root'}`)

    for (const item of items) {
      if (item.type === "file") {
        const ext = item.name.split(".").pop()?.toLowerCase() || ""
        const allowed = ["md", "txt", "json", "js", "ts", "yml", "yaml", "xml", "csv", "py", "sh", "sql", "css", "html"]
        
        if (allowed.includes(ext)) {
          logs.push(`- Allowing file: ${item.name}`)
          const content = await fetchFileContent(item.download_url || item.url)
          if (content) {
            const suffix = item.path.includes(path + "/") ? item.path.split(path + "/")[1] : item.name
            files[suffix] = content
          }
        }
      } else if (item.type === "dir" && depth < 1) {
        const subFiles = await fetchGitHubDirectory(owner, repo, branch, item.path, logs, depth + 1)
        Object.assign(files, subFiles)
      }
    }
  } catch (error: any) {
    logs.push(`Error in fetchGitHubDirectory: ${error.message}`)
  }
  
  return files
}

async function handleGitHubImport(url: string, logs: string[]) {
  const cleanUrl = url.replace(/[\\\)\]"'].*$/, "").split("?")[0].replace(/\/$/, "")
  logs.push(`Cleaned GitHub URL: ${cleanUrl}`)
  
  const treeMatch = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)/)
  const blobMatch = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/)
  const rootMatch = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)$/)
  
  let owner, repo, branch, path: string
  
  if (treeMatch || blobMatch) {
    const match = treeMatch || blobMatch
    if (match) [, owner, repo, branch, path] = match
    else throw new Error("Format URL GitHub non résolu")
  } else if (rootMatch) {
    [, owner, repo] = rootMatch
    branch = "main"
    path = ""
  } else {
    throw new Error(`URL GitHub invalide: ${cleanUrl}`)
  }

  const files = await fetchGitHubDirectory(owner, repo, branch, path, logs)
  if (Object.keys(files).length === 0) throw new Error("Aucun fichier valide identifié.")

  logs.push(`Total files imported: ${Object.keys(files).join(", ")}`)

  const skillFileName = Object.keys(files).find(f => f.toLowerCase() === "skill.md" || f.toLowerCase() === "compétence.md")
  const skillContent = skillFileName ? files[skillFileName] : Object.values(files)[0]
  
  const name = extractSkillName(skillContent, path.split("/").pop() || repo)
  const slug = path.split("/").pop() || repo.toLowerCase()

  const data = {
    name, slug, promptContent: skillContent, files, source: "github", providerUrl: cleanUrl,
    isActive: true, category: "Importé", version: "1.0.0", icon: "Box", color: "blue"
  }

  await (db as any).escSkill.upsert({
    where: { slug },
    create: data,
    update: { ...data, updatedAt: new Date() }
  })

  return NextResponse.json({ success: true, results: { added: 1, updated: 1, filesCount: Object.keys(files).length }, logs })
}

async function handleSmitheryImport(url: string, logs: string[]) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
  })
  const html = await res.text()
  
  if (html.includes("Vercel Security Checkpoint")) {
    throw new Error("Smithery bloque l'accès (Bot Detection). Utilisez le lien GitHub directement.")
  }

  const repoMatch = html.match(/https:\\?\/\\?\/github\.com\\?\/[^"']+/g)
  if (!repoMatch) throw new Error("Répertoire GitHub introuvable sur Smithery.")

  const cleanedMatches = repoMatch.map(m => m.replace(/\\/g, ""))
  const treeLinks = cleanedMatches.filter(m => m.includes("/tree/"))
  const bestUrl = treeLinks.length > 0 ? treeLinks.reduce((a, b) => a.length > b.length ? a : b) : cleanedMatches.reduce((a, b) => a.length > b.length ? a : b)

  return handleGitHubImport(bestUrl, logs)
}

async function handleGitHubBulkSyncByUrl(manifestUrl: string, baseUrl: string, logs: string[]) {
  const manifestRes = await fetch(manifestUrl, { cache: 'no-store' })
  if (!manifestRes.ok) throw new Error(`Impossible de récupérer le manifeste à ${manifestUrl}`)
  
  const manifest = await manifestRes.json()
  const skillEntries = Object.entries(manifest.skills || {})
  const results = { added: 0, updated: 0, errors: 0 }

  for (const [slug, skillInfo] of skillEntries) {
    try {
      const { path, version, category } = skillInfo as any
      const skillMdUrl = `${baseUrl}/${path}`
      const content = await fetchFileContent(skillMdUrl)
      if (!content) continue
      
      const name = extractSkillName(content, slug)
      const data = {
        name, slug, version: version || "1.0.0", category: category || "general", 
        promptContent: content, source: "github", 
        providerUrl: `${baseUrl}/${path}`,
        isActive: false, files: { "SKILL.md": content }
      }

      const existing = await (db as any).escSkill.findUnique({ where: { slug } })
      if (existing) {
        await (db as any).escSkill.update({ where: { slug }, data: { ...data, updatedAt: new Date() } })
        results.updated++
      } else {
        await (db as any).escSkill.create({ data })
        results.added++
      }
    } catch (err) { results.errors++ }
  }
  return results
}

async function handleGitHubBulkSync(logs: string[], providerId?: string) {
  const where: any = { isActive: true }
  if (providerId) where.id = providerId

  const providers = await (db as any).skillProvider.findMany({ where })
  const finalResults = { added: 0, updated: 0, errors: 0 }

  if (providers.length === 0) {
    if (providerId) throw new Error("Fournisseur introuvable ou inactif.")
    logs.push("No providers found in DB, using default.")
    const res = await handleGitHubBulkSyncByUrl(GITHUB_MANIFEST_URL, GITHUB_BASE_URL, logs)
    return NextResponse.json({ success: true, results: res, logs })
  }

  for (const provider of providers) {
    try {
      logs.push(`Syncing from provider: ${provider.name} (${provider.url})`)
      // Convert github.com URL to raw.githubusercontent.com
      let baseUrl = provider.url.replace("github.com", "raw.githubusercontent.com").replace("/tree/", "/").replace("/blob/", "/")
      // Remove trailing slash to avoid double slash
      baseUrl = baseUrl.replace(/\/$/, '')
      const manifestUrl = baseUrl + "/manifest.json"
      
      logs.push(`Attempting sync from: ${manifestUrl}`)
      const res = await handleGitHubBulkSyncByUrl(manifestUrl, baseUrl, logs)
      finalResults.added += res.added
      finalResults.updated += res.updated
      finalResults.errors += res.errors
    } catch (err: any) {
      logs.push(`Error syncing ${provider.name}: ${err.message}`)
      finalResults.errors++
    }
  }

  return NextResponse.json({ success: true, results: finalResults, logs })
}
