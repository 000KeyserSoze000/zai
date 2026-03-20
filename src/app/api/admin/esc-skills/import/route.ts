import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-utils"

const GITHUB_MANIFEST_URL = "https://raw.githubusercontent.com/guilhermemarketing/esc-skills/main/manifest.json"
const GITHUB_BASE_URL = "https://raw.githubusercontent.com/guilhermemarketing/esc-skills/main"

export const dynamic = 'force-dynamic'

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
    const { url } = body

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

    return await handleGitHubBulkSync(logs)

  } catch (error) {
    console.error("[ESC Import] Error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal Server Error",
      logs
    }, { status: 500 })
  }
}

async function fetchGitHubFile(owner: string, repo: string, branch: string, path: string) {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return null
  return await res.text()
}

async function fetchGitHubDirectory(owner: string, repo: string, branch: string, path: string, depth = 0): Promise<Record<string, string>> {
  if (depth > 2) return {} 
  
  const files: Record<string, string> = {}
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
  
  try {
    const res = await fetch(apiUrl, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Zai-ESC-Importer"
      },
      cache: 'no-store'
    })
    
    if (!res.ok) {
      const content = await fetchGitHubFile(owner, repo, branch, path)
      if (content) files[path.split("/").pop() || "SKILL.md"] = content
      return files
    }

    const items = await res.json()
    if (!Array.isArray(items)) {
      const content = await fetchGitHubFile(owner, repo, branch, path)
      if (content) files[path.split("/").pop() || "SKILL.md"] = content
      return files
    }

    for (const item of items) {
      if (item.type === "file") {
        const ext = item.name.split(".").pop()?.toLowerCase()
        const allowed = ["md", "txt", "json", "js", "ts", "yml", "yaml", "xml", "csv"]
        if (allowed.includes(ext || "")) {
          const content = await fetchGitHubFile(owner, repo, branch, item.path)
          if (content) {
            // Use relative path from the initial starting path
            const relativePath = item.path.split(path + "/").pop() || item.name
            files[relativePath] = content
          }
        }
      } else if (item.type === "dir" && depth < 1) {
        const subFiles = await fetchGitHubDirectory(owner, repo, branch, item.path, depth + 1)
        Object.assign(files, subFiles)
      }
    }
  } catch (error) {
    console.error("Error fetching directory:", error)
  }
  
  return files
}

async function handleGitHubImport(url: string, logs: string[]) {
  // Clean URL (remove trailing junk like ) or \ from scraped HTML)
  const cleanUrl = url.replace(/[\\\)\]"'].*$/, "").split("?")[0].replace(/\/$/, "")
  
  // Format 1: https://github.com/user/repo/tree/branch/path (Directory)
  // Format 2: https://github.com/user/repo/blob/branch/path (File)
  const treeMatch = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)/)
  const blobMatch = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/)
  const rootMatch = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)$/) // No path, assume main/root
  
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
    throw new Error(`URL GitHub invalide: ${cleanUrl}. Utilisez un lien vers un dossier (tree) ou un fichier (blob).`)
  }

  logs.push(`Starting recursive scan for ${owner}/${repo} at ${path} (${branch})`)
  const files = await fetchGitHubDirectory(owner, repo, branch, path)
  
  if (Object.keys(files).length === 0) {
    throw new Error(`Aucun fichier texte pertinent trouvé. Vérifiez que le chemin '${path}' est correct sur la branche '${branch}'.`)
  }

  const skillContent = files["SKILL.md"] || files["COMPÉTENCE.md"] || Object.values(files)[0]
  const name = skillContent.substring(0, 100).split("\n")[0].replace("#", "").trim() || path.split("/").pop() || repo
  const slug = path.split("/").pop() || repo.toLowerCase()

  const data = {
    name, slug, promptContent: skillContent, files, source: "github", providerUrl: cleanUrl,
    isActive: true, category: "Importé", version: "1.0.0", icon: "Box", color: "blue"
  }

  const result = await (db as any).escSkill.upsert({
    where: { slug },
    create: data,
    update: { ...data, updatedAt: new Date() }
  })

  return NextResponse.json({ success: true, results: { added: 1, updated: 1 }, logs })
}

async function handleSmitheryImport(url: string, logs: string[]) {
  logs.push(`Detecting GitHub repository from Smithery page...`)
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  })
  const html = await res.text()
  
  if (html.includes("Vercel Security Checkpoint") || html.includes("cf-browser-verification")) {
    throw new Error("L'importation Smithery est bloquée par une protection anti-robot. Veuillez copier le lien 'Repository' (GitHub) en bas à droite de la page Smithery et le coller ici directement.")
  }

  // Look for github.com links (handle escaped slashes too)
  const repoMatch = html.match(/https:\\?\/\\?\/github\.com\\?\/[^"']+/g)
  if (!repoMatch) {
    throw new Error("Impossible de trouver le dépôt GitHub sur cette page. Essayez de coller le lien GitHub directement.")
  }

  // Clean the matches (remove \ slashes)
  const cleanedMatches = repoMatch.map(m => m.replace(/\\/g, ""))
  
  // Priority order: /tree/ > /blob/ > root
  const treeLinks = cleanedMatches.filter(m => m.includes("/tree/"))
  const blobLinks = cleanedMatches.filter(m => m.includes("/blob/"))
  
  let bestUrl = ""
  if (treeLinks.length > 0) {
    bestUrl = treeLinks.reduce((a, b) => a.length > b.length ? a : b)
  } else if (blobLinks.length > 0) {
    bestUrl = blobLinks.reduce((a, b) => a.length > b.length ? a : b)
  } else {
    bestUrl = cleanedMatches.reduce((a, b) => a.length > b.length ? a : b)
  }

  logs.push(`Selected GitHub URL from Smithery: ${bestUrl}`)
  return handleGitHubImport(bestUrl, logs)
}

async function handleGitHubBulkSync(logs: string[]) {
  logs.push(`Starting bulk manifest sync...`)
  const manifestRes = await fetch(GITHUB_MANIFEST_URL, { cache: 'no-store' })
  if (!manifestRes.ok) throw new Error("Impossible de récupérer le manifeste")
  
  const manifest = await manifestRes.json()
  const skillEntries = Object.entries(manifest.skills || {})
  const results = { added: 0, updated: 0, errors: 0 }

  for (const [slug, skillInfo] of skillEntries) {
    try {
      const { path, version, category } = skillInfo as any
      const skillMdUrl = `${GITHUB_BASE_URL}/${path}`
      const skillMdRes = await fetch(skillMdUrl, { cache: 'no-store' })
      if (!skillMdRes.ok) continue
      
      const promptContent = await skillMdRes.text()
      const name = promptContent.substring(0, 50).split("\n")[0].replace("#", "").trim()
      
      const data = {
        name, slug, version: version || "1.0.0", 
        category: category || "general", 
        promptContent, source: "github", 
        providerUrl: `https://github.com/guilhermemarketing/esc-skills/tree/main/${path}`,
        isActive: false, files: { "SKILL.md": promptContent }
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

  return NextResponse.json({ success: true, results, logs })
}
