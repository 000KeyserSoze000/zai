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
      throw new Error("Seules les URLs GitHub sont supportées en import direct.")
    }
    
    const providers = await (db as any).skillProvider.findMany({ where: { isActive: true, ...(providerId ? { id: providerId } : {}) } })
    const final = { added: 0, updated: 0, errors: 0 }

    for (const p of providers) {
      logs.push(`Sycing provider: ${p.name}...`)
      const gh = parseGitHubUrl(p.url)
      if (!gh) { logs.push(`URL Invalide: ${p.url}`); final.errors++; continue }
      
      const res = await syncGitHubTree(gh.owner, gh.repo, gh.branch, gh.path, logs, p.url)
      final.added += res.added; final.updated += res.updated; final.errors += res.errors
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

async function syncGitHubTree(owner: string, repo: string, branch: string, rootPath: string, logs: string[], providerUrl: string, isSingle: boolean = false) {
  const results = { added: 0, updated: 0, errors: 0 }
  try {
    // 1. Fetch entire tree (Single API call per provider/skill)
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
    const treeRes = await fetch(treeUrl, { headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "Zai-ESC" }, cache: 'no-store' })
    if (!treeRes.ok) throw new Error(`GitHub API Error: ${treeRes.status}`)
    const treeData = await treeRes.json()
    if (!treeData.tree) return results

    // 2. Identify skills (Directories containing a .md file)
    const normalizedRoot = rootPath ? rootPath.replace(/\/$/, "") : ""
    const skillGroups: Record<string, any[]> = {}
    
    for (const item of treeData.tree) {
      if (item.type !== "blob") continue
      if (normalizedRoot && !item.path.startsWith(normalizedRoot + "/")) continue
      
      const relPath = normalizedRoot ? item.path.substring(normalizedRoot.length + 1) : item.path
      const parts = relPath.split('/')
      if (parts.length < (isSingle ? 1 : 2)) continue // In single mode, files at root are OK
      
      const skillId = isSingle ? "target" : parts[0]
      if (!skillGroups[skillId]) skillGroups[skillId] = []
      skillGroups[skillId].push(item)
    }

    logs.push(`Found ${Object.keys(skillGroups).length} skill folders. Fetching contents...`)

    // 3. Process groups
    for (const [slugPrefix, items] of Object.entries(skillGroups)) {
      try {
        const leafFiles: Record<string, string> = {}
        let mainContent = ""
        let actualSlug = isSingle ? rootPath.split('/').pop() || repo : slugPrefix

        for (const item of items) {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`
          const content = await fetchFileContent(rawUrl) // RAW FETCH: NO RATE LIMIT
          if (content) {
            const fileName = item.path.split('/').pop() || "file"
            leafFiles[fileName] = content
            if (fileName.toLowerCase().endsWith("skill.md") || (fileName.toLowerCase().endsWith(".md") && !mainContent)) {
              mainContent = content
              if (!isSingle) actualSlug = item.path.split('/').slice(-2, -1)[0] || slugPrefix
            }
          }
        }

        if (mainContent) {
          const data = {
            name: extractSkillName(mainContent, actualSlug),
            slug: actualSlug.toLowerCase(),
            promptContent: mainContent,
            files: leafFiles,
            source: "github",
            providerUrl: providerUrl.replace(/\/$/, ""),
            isActive: true, version: "1.0.0", category: "Imported"
          }
          await (db as any).escSkill.upsert({ where: { slug: data.slug }, update: { ...data, updatedAt: new Date() }, create: data })
          results.added++
        }
      } catch (e) { results.errors++ }
    }
  } catch (e: any) { logs.push(`Sync Error: ${e.message}`); results.errors++ }
  return results
}
