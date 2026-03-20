const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Mocking some dependencies if needed, or just let it use the real DB
// We want to test handleGitHubBulkSync from route.ts
// But since it's an API route with Next.js imports, it's hard to run directly.
// I'll replicate the core logic here.

async function testSync() {
  console.log("--- STARTING SYNC DEBUG ---");
  const logs = [];
  
  // 1. Get providers
  const providers = await prisma.skillProvider.findMany({ where: { isActive: true } });
  console.log(`Found ${providers.length} providers.`);

  for (const provider of providers) {
    console.log(`\nSyncing ${provider.name} (${provider.url})...`);
    
    const cleanProviderUrl = provider.url.replace(/\/$/, "");
    let baseUrl = cleanProviderUrl.replace("github.com", "raw.githubusercontent.com").replace("/tree/", "/").replace("/blob/", "/");
    baseUrl = baseUrl.replace(/\/$/, '');
    const manifestUrl = baseUrl + "/manifest.json";

    console.log(`Manifest URL: ${manifestUrl}`);
    
    try {
      const res = await fetch(manifestUrl);
      console.log(`Manifest Fetch Status: ${res.status}`);
      if (!res.ok) {
        throw new Error(`Impossible de récupérer le manifeste (${res.status})`);
      }
      const manifest = await res.json();
      console.log(`Manifest found with ${Object.keys(manifest.skills || {}).length} skills.`);
    } catch (err) {
      console.log(`Manifest sync failed: ${err.message}. Attempting folder scan...`);
      
      // Replication of folder scan logic
      const url = provider.url.replace(/[\\\)\]"'].*$/, "").split("?")[0].replace(/\/$/, "");
      const treeMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)/);
      const rootMatch = url.match(/github\.com\/([^/]+)\/([^/]+)$/);
      
      let owner, repo, branch = "main", path = "";
      if (treeMatch) [, owner, repo, branch, path] = treeMatch;
      else if (rootMatch) [, owner, repo] = rootMatch;

      console.log(`Folder Scan Params: owner=${owner}, repo=${repo}, branch=${branch}, path=${path}`);
      
      if (owner && repo) {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
        console.log(`GitHub API URL: ${apiUrl}`);
        const apiRes = await fetch(apiUrl, { headers: { "User-Agent": "ZAI-App" } });
        console.log(`GitHub API Status: ${apiRes.status}`);
        
        if (apiRes.ok) {
          const items = await apiRes.json();
          console.log(`Found ${items.length} items in directory.`);
          items.forEach(i => console.log(` - [${i.type}] ${i.name}`));
        } else {
          const errData = await apiRes.text();
          console.log(`GitHub API Error Body: ${errData}`);
        }
      }
    }
  }
}

testSync().finally(() => prisma.$disconnect());
