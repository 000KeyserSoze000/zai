function parseGitHubUrl(url) {
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

const urls = [
  "https://github.com/anthropics/skills/tree/main/skills",
  "https://raw.githubusercontent.com/guilhermemarketing/esc-skills/main",
  "https://github.com/guilhermemarketing/esc-skills",
  "https://github.com/owner/repo/blob/dev/path/to/skill.md"
];

console.log("--- TESTING URL PARSER ---");
urls.forEach(u => {
  console.log(`URL: ${u}`);
  console.log(`Result:`, parseGitHubUrl(u));
});
