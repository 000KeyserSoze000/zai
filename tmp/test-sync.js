const GITHUB_MANIFEST_URL = "https://raw.githubusercontent.com/guilhermemarketing/esc-skills/main/manifest.json"
const GITHUB_BASE_URL = "https://raw.githubusercontent.com/guilhermemarketing/esc-skills/main"

async function testSync() {
  try {
    const manifestRes = await fetch(GITHUB_MANIFEST_URL)
    const manifest = await manifestRes.json()
    const skillsMap = manifest.skills || {}
    const skillEntries = Object.entries(skillsMap)
    
    console.log(`Found ${skillEntries.length} skills`)
    
    for (const [slug, skillInfo] of skillEntries.slice(0, 3)) {
      const { path } = skillInfo
      const skillMdUrl = `${GITHUB_BASE_URL}/${path}`
      console.log(`Testing skill ${slug} at ${skillMdUrl}`)
      const skillMdRes = await fetch(skillMdUrl)
      if (skillMdRes.ok) {
        const text = await skillMdRes.text()
        console.log(`  Success! Length: ${text.length}`)
      } else {
        console.log(`  Failed! Status: ${skillMdRes.status}`)
      }
    }
  } catch (err) {
    console.error(err)
  }
}

testSync()
