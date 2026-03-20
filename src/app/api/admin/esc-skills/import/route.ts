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

const GITHUB_MANIFEST_URL = "https://raw.githubusercontent.com/guilhermemarketing/esc-skills/main/manifest.json"
const GITHUB_BASE_URL = "https://raw.githubusercontent.com/guilhermemarketing/esc-skills/main"

export const dynamic = 'force-dynamic'

function extractSkillName(content: string, fallback: string): string {
  const lines = content.split("\n")
  let inFrontmatter = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith("<!--")) continue
    if (line === "---") { inFrontmatter = !inFrontmatter; continue }
    if (inFrontmatter) continue
    if (/^\[.*\]:/.test(line)) continue
    return line.replace(/^#+\s*/, "").replace(/^[*-]\s*/, "").replace(/[*:].*$/, "").trim()
  }
  return fallback
}

export async function POST(request: NextRequest) {
  const logs: string[] = []
  try {
    const user = await requireAuth(request)
    if (user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    const body = await request.json().catch(() => ({}))
    const { url, providerId } = body
    if (url) {
      if (url.includes('smithery.ai/')) return await handleSmitheryImport(url, logs)
      if (url.includes('github.com')) return await handleGitHubImport(url, logs)
      throw new Error("URL non supportée.")
    }
    return await handleGitHubBulkSync(logs, providerId)
  } catch (error: any) {
    return NextResponse.json({ error: error.message, logs }, { status: 500 })
  }
}

async function fetchFileContent(url: string) {
  const res = await fetch(url, { cache: 'no-store' })
  return res.ok ? await res.text() : null
}

async function fetchGitHubDirectory(owner: string, repo: string, branch: string, path: string, logs: string[], depth = 0): Promise<Record<string, string>> {
  if (depth > 2) return {}
  const files: Record<string, string> = {}
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
  try {
    const res = await fetch(apiUrl, { headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "Zai-ESC" }, cache: 'no-store' })
    if (!res.ok) {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
        const content = await fetchFileContent(rawUrl)
        if (content) files[path.split("/").pop() || "SKILL.md"] = content
        return files
    }
    const items = await res.json()
    if (!Array.isArray(items)) {
        const content = await fetchFileContent(items.download_url || `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`)
        if (content) files[path.split("/").pop() || "SKILL.md"] = content
        return files
    }
    for (const item of items) {
      if (item.type === "file") {
        const ext = item.name.split(".").pop()?.toLowerCase() || ""
        const allowed = ["md", "txt", "json", "js", "ts", "yml", "yaml", "xml", "csv", "py", "sh", "sql", "css", "html"]
        if (allowed.includes(ext)) {
          const content = await fetchFileContent(item.download_url || item.url)
          if (content) files[item.path.split(path + "/")[1] || item.name] = content
        }
      } else if (item.type === "dir" && depth < 1) {
        Object.assign(files, await fetchGitHubDirectory(owner, repo, branch, item.path, logs, depth + 1))
      }
    }
  } catch (e: any) { logs.push(`Error dir ${path}: ${e.message}`) }
  return files
}

async function handleGitHubImport(url: string, logs: string[]) {
  const gh = parseGitHubUrl(url)
  if (!gh) throw new Error("URL GitHub invalide")
  const files = await fetchGitHubDirectory(gh.owner, gh.repo, gh.branch, gh.path, logs)
  if (Object.keys(files).length === 0) throw new Error("Aucun fichier trouvé.")
  const skillFileName = Object.keys(files).find(f => f.toLowerCase().endsWith("skill.md")) || Object.keys(files)[0]
  const content = files[skillFileName]
  const name = extractSkillName(content, gh.path.split("/").pop() || gh.repo)
  const slug = gh.path.split("/").pop() || gh.repo.toLowerCase()
  const data = { name, slug, promptContent: content, files, source: "github", providerUrl: url.split("/tree/")[0].split("/blob/")[0], isActive: true, category: "Importé", version: "1.0.0" }
  await (db as any).escSkill.upsert({ where: { slug }, create: data, update: { ...data, updatedAt: new Date() } })
  return NextResponse.json({ success: true, results: { added: 1 }, logs })
}

async function handleSmitheryImport(url: string, logs: string[]) {
  const res = await fetch(url)
  const html = await res.text()
  const repoMatch = html.match(/https:\/\/github\.com\/[^"']+/g)
  if (!repoMatch) throw new Error("GitHub non trouvé sur Smithery.")
  return handleGitHubImport(repoMatch[0].replace(/\\/g, ""), logs)
}

async function handleGitHubFolderSync(owner: string, repo: string, branch: string, rootPath: string, logs: string[], providerUrl: string) {
  const results = { added: 0, updated: 0, errors: 0 }
  try {
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
    const treeRes = await fetch(treeUrl, { headers: { "User-Agent": "Zai-ESC" }, cache: 'no-store' })
    const treeData = await treeRes.json()
    if (!treeData.tree) return results
    const skillMds = treeData.tree.filter((i: any) => i.type === "blob" && i.path.startsWith(rootPath ? rootPath + "/" : "") && i.path.toLowerCase().endsWith("skill.md"))
    for (const smd of skillMds) {
      try {
        const fpath = smd.path
        const dpath = fpath.substring(0, fpath.lastIndexOf('/'))
        const slug = dpath.split('/').pop() || "skill"
        const folderFiles = await fetchGitHubDirectory(owner, repo, branch, dpath, logs, 0)
        const content = folderFiles[fpath.split('/').pop() || "SKILL.md"]
        if (content) {
          const data = { name: extractSkillName(content, slug), slug, promptContent: content, files: folderFiles, source: "github", providerUrl, isActive: true, category: "Imported" }
          await (db as any).escSkill.upsert({ where: { slug }, update: { ...data, updatedAt: new Date() }, create: data })
          results.added++
        }
      } catch (e) { results.errors++ }
    }
  } catch (e) { logs.push(`Tree error: ${e.message}`) }
  return results
}

async function handleGitHubBulkSyncByUrl(manifestUrl: string, baseUrl: string, logs: string[], providerUrl: string) {
  const res = await fetch(manifestUrl, { cache: 'no-store' })
  if (!res.ok) throw new Error("Manifest failed")
  const manifest = await res.json()
  const gh = parseGitHubUrl(baseUrl)
  if (!gh) throw new Error("Base URL invalide")
  const results = { added: 0, updated: 0, errors: 0 }
  for (const [slug, info] of Object.entries(manifest.skills || {})) {
    try {
      const { path } = info as any
      const dpath = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : ""
      const folderFiles = await fetchGitHubDirectory(gh.owner, gh.repo, gh.branch, dpath, logs, 0)
      const content = folderFiles[path.split('/').pop() || "SKILL.md"] || Object.values(folderFiles)[0]
      if (content) {
        const data = { name: extractSkillName(content, slug), slug, promptContent: content, files: folderFiles, source: "github", providerUrl, isActive: false, category: (info as any).category || "general" }
        await (db as any).escSkill.upsert({ where: { slug }, update: { ...data, updatedAt: new Date() }, create: data })
        results.added++
      }
    } catch (e) { results.errors++ }
  }
  return results
}

async function handleGitHubBulkSync(logs: string[], providerId?: string) {
  const providers = await (db as any).skillProvider.findMany({ where: { isActive: true, ...(providerId ? { id: providerId} : {}) } })
  const final = { added: 0, updated: 0, errors: 0 }
  for (const p of providers) {
    try {
      const cleanUrl = p.url.replace(/\/$/, "")
      const baseUrl = cleanUrl.replace("github.com", "raw.githubusercontent.com").replace("/tree/", "/").replace("/blob/", "/").replace(/\/$/, '')
      try {
        const res = await handleGitHubBulkSyncByUrl(baseUrl + "/manifest.json", baseUrl, logs, cleanUrl)
        final.added += res.added; final.errors += res.errors
      } catch (e) {
        const gh = parseGitHubUrl(p.url)
        if (gh) {
          const res = await handleGitHubFolderSync(gh.owner, gh.repo, gh.branch, gh.path, logs, cleanUrl)
          final.added += res.added; final.errors += res.errors
        }
      }
    } catch (e) { final.errors++ }
  }
  return NextResponse.json({ success: true, results: final, logs })
}
