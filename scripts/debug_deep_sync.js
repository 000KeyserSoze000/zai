const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fetchGitHubDirectory(owner, repo, branch, path, logs, depth = 0) {
    try {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
        console.log(`[FetchDir] Depth ${depth} | Path: ${path} | URL: ${apiUrl}`);
        const res = await fetch(apiUrl, { headers: { "User-Agent": "ZAI-App" } });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const items = await res.json();
        if (!Array.isArray(items)) return {};
        
        let files = {};
        for (const item of items) {
            if (item.type === "file") {
                console.log(`  - Found File: ${item.name}`);
                files[item.name] = "MOCKED CONTENT"; // We don't need real content for check
            } else if (item.type === "dir" && depth < 1) {
                const sub = await fetchGitHubDirectory(owner, repo, branch, item.path, logs, depth + 1);
                Object.assign(files, sub);
            }
        }
        return files;
    } catch (e) {
        console.log(`  !! FetchDir Error: ${e.message}`);
        return {};
    }
}

async function testDeepSync() {
  const owner = "anthropics", repo = "skills", branch = "main", path = "skills";
  
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  console.log(`Main Folder API: ${apiUrl}`);
  const res = await fetch(apiUrl, { headers: { "User-Agent": "ZAI-App" } });
  const items = await res.json();
  
  let totalSkills = 0;
  for (const item of items.slice(0, 5)) { // Test first 5 only
    if (item.type === "dir") {
      console.log(`\nTesting Skill Folder: ${item.name}`);
      const folderFiles = await fetchGitHubDirectory(owner, repo, branch, item.path, [], 0);
      const hasSkillMd = Object.keys(folderFiles).some(k => k.toLowerCase().endsWith("skill.md"));
      console.log(`  -> Files found: ${Object.keys(folderFiles).join(", ")} | Has SKILL.md: ${hasSkillMd}`);
      if (hasSkillMd) totalSkills++;
    }
  }
  console.log(`\nTOTAL POTENTIAL SKILLS: ${totalSkills}`);
}

testDeepSync().finally(() => prisma.$disconnect());
