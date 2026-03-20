import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-utils"

function parseGitHubUrl(url: string) {
  const clean = url.replace(/[\\\)\]"'].*$/, "").split("?")[0].replace(/\/$/, "")
  const treeMatch = clean.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)/)
  if (treeMatch) return { owner: treeMatch[1], repo: treeMatch[2], branch: treeMatch[3], path: treeMatch[4] }
  const blobMatch = clean.match(/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/)
  if (blobMatch) return { owner: blobMatch[1], repo: blobMatch[2], branch: blobMatch[3], path: blobMatch[4] }
  const rawMatch = clean.match(/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/)
  if (rawMatch) return { owner: rawMatch[1], repo: rawMatch[2], branch: rawMatch[3], path: rawMatch[4] }
  const rootMatch = clean.match(/github\.com\/([^/]+)\/([^/]+)$/)
  if (rootMatch) return { owner: rootMatch[1], repo: rootMatch[2], branch: "main", path: "" }
  const rawRootMatch = clean.match(/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)$/)
  if (rawRootMatch) return { owner: rawRootMatch[1], repo: rawRootMatch[2], branch: rawRootMatch[3], path: "" }
  return null
}

export const dynamic = 'force-dynamic'

function extractSkillName(content: string, fallback: string): string {
  const lines = content.split("\n")
  let inFrontmatter = false
  for (let l of lines) {
    const line = l.trim()
    if (!line || line.startsWith("<!--")) continue
    if (line === "---") { inFrontmatter = !inFrontmatter; continue }
    if (inFrontmatter) continue
    if (/^\[.*\]:/.test(line)) continue
    return line.replace(/^#+\s*/, "").replace(/^[*-]\s*/, "").replace(/[*:].*$/, "").trim()
  }
  return fallback
}

async function fetchFileContent(url: string) {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    return res.ok ? await res.text() : null
  } catch (e) { return null }
}

export async function POST(request: NextRequest) {
  const logs: string[] = []
  try {
    const user = await requireAuth(request)
    if (user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    const { url, providerId } = await request.json().catch(() => ({}))
    
    if (url) {
      if (url.includes('github.com')) return await handleGitHubImport(url, logs)
      if (url.includes('smithery.ai/skills')) return await handleSmitheryImport(url, logs)
      throw new Error("Seules les URLs GitHub et Smithery.ai sont supportées.")
    }
    
    const providers = await (db as any).skillProvider.findMany({ where: { isActive: true, ...(providerId ? { id: providerId } : {}) } })
    const final = { added: 0, updated: 0, errors: 0 }

    for (const p of providers) {
      const gh = parseGitHubUrl(p.url)
      if (gh) {
        const res = await syncGitHubTree(gh.owner, gh.repo, gh.branch, gh.path, logs, p.url)
        final.added += res.added; final.updated += res.updated; final.errors += res.errors
      } else if (p.url.includes('smithery.ai/skills')) {
        const res = await handleSmitheryImport(p.url, logs)
        const data = await res.json()
        if (data.results) {
          final.added += data.results.added; final.updated += data.results.updated; final.errors += data.results.errors
        }
      } else { 
        logs.push(`URL Invalide ou non supportée: ${p.url}`); final.errors++; 
      }
    }
    
    return NextResponse.json({ success: true, results: final, logs })
  } catch (error: any) {
    return NextResponse.json({ error: error.message, logs }, { status: 500 })
  }
}

async function handleGitHubImport(url: string, logs: string[]) {
  const gh = parseGitHubUrl(url)
  if (!gh) throw new Error("URL GitHub invalide")
  const res = await syncGitHubTree(gh.owner, gh.repo, gh.branch, gh.path, logs, url, true)
  return NextResponse.json({ success: true, results: res, logs })
}

async function handleSmitheryImport(url: string, logs: string[]) {
  logs.push(`Exploring Smithery: ${url}...`)
  try {
    const html = await fetchFileContent(url)
    if (!html) throw new Error("Impossible de lire la page Smithery.")

    // Smithery pages are SSR'd, we can find the GitHub URL in the source
    const githubMatch = html.match(/https:\/\/github\.com\/[^"'\s>]+/)
    if (!githubMatch) throw new Error("Aucun lien GitHub trouvé sur cette page Smithery.")
    
    logs.push(`Found GitHub link from Smithery: ${githubMatch[0]}`)
    const gh = parseGitHubUrl(githubMatch[0])
    if (!gh) throw new Error("Lien GitHub extrait invalide")

    const res = await syncGitHubTree(gh.owner, gh.repo, gh.branch, gh.path, logs, url, true)
    return NextResponse.json({ success: true, results: res, logs })
  } catch (error: any) {
    logs.push(`Smithery Error: ${error.message}`)
    return NextResponse.json({ success: false, error: error.message, logs }, { status: 500 })
  }
}

async function syncGitHubTree(owner: string, repo: string, branch: string, rootPath: string, logs: string[], providerUrl: string, isSingle: boolean = false) {
  const results = { added: 0, updated: 0, errors: 0 }
  try {
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
    const treeRes = await fetch(treeUrl, { headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "Zai-ESC" }, cache: 'no-store' })
    if (!treeRes.ok) throw new Error(`GitHub API Error: ${treeRes.status}`)
    const treeData = await treeRes.json()
    if (!treeData.tree) return results

    // 1. Identify all SKILL.md files - these are our unique skill markers
    const skillMarkers = treeData.tree.filter((item: any) => 
      item.type === "blob" && 
      item.path.startsWith(rootPath ? rootPath.replace(/\/$/, "") + "/" : "") &&
      (item.path.toLowerCase().endsWith("skill.md") || item.path.toLowerCase().endsWith("compétence.md"))
    )

    logs.push(`Found ${skillMarkers.length} unique skills markers in tree.`)

    // 2. Identify and Process each skill
    for (const marker of skillMarkers) {
      try {
        const fullPath = marker.path
        const folderPath = fullPath.substring(0, fullPath.lastIndexOf('/')) || ""
        
        // Find ALL files under this folder (including subfolders)
        const allSkillSubFiles = treeData.tree.filter((item: any) => 
          item.type === "blob" && 
          item.path.startsWith(folderPath + (folderPath ? "/" : ""))
        )

        let mainContent = ""
        const leafFiles: Record<string, string> = {}
        const actualSlug = folderPath.replace(/\//g, "-").toLowerCase() || repo.toLowerCase()
        const displayName = folderPath.split('/').pop() || actualSlug

        for (const item of allSkillSubFiles) {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`
          const content = await fetchFileContent(rawUrl)
          if (content) {
            // Keep the relative path inside the skill folder (e.g. "scripts/helper.js")
            const fileName = folderPath 
                ? item.path.substring(folderPath.length + 1) 
                : item.path
            
            leafFiles[fileName] = content
            if (item.path === marker.path) mainContent = content
          }
        }

        if (mainContent) {
          const defaultName = extractSkillName(mainContent, displayName)
          const actualSlug = folderPath.replace(/\//g, "-").toLowerCase() || repo.toLowerCase()
          
          // Data Protection: Check if skill exists and preserve user changes
          const existing = await (db as any).escSkill.findUnique({ where: { slug: actualSlug } })
          
          const data = {
            slug: actualSlug,
            promptContent: mainContent,
            files: leafFiles,
            source: providerUrl.includes('smithery.ai') ? "smithery" : "github",
            providerUrl: providerUrl.replace(/\/$/, ""),
            updatedAt: new Date()
          }

          if (!existing) {
            // New skill: full create
            await (db as any).escSkill.create({
              data: {
                ...data,
                name: defaultName,
                isActive: true,
                version: "1.0.0",
                category: "Imported"
              }
            })
            results.added++
          } else {
            // Existing skill: ONLY update content, NOT name/category if the user changed them
            const updatePayload: any = { ...data }
            
            // If the name is still the "auto-generated" one, we can update it
            // Otherwise, we leave it as the user renamed it
            if (existing.category === "Imported") {
              // We can update details freely if it was never moved from Imported
            }

            await (db as any).escSkill.update({
              where: { id: existing.id },
              data: updatePayload
            })
            results.updated++
          }
        }
      } catch (e) { results.errors++ }
    }
  } catch (e: any) { logs.push(`Sync Error: ${e.message}`); results.errors++ }
  return results
}
