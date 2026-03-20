const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function deepCleanup() {
  console.log("Deep Cleaning Skill providerUrls...");

  const providers = await prisma.skillProvider.findMany();
  for (const p of providers) {
    const cleanUrl = p.url.replace(/\/$/, "");
    console.log(`Processing Provider: ${p.name} (${cleanUrl})`);

    // Match skills that belong to this provider but have wrong URL (e.g. specifically for github repos)
    // We'll search for skills where the providerUrl starts with the base repo URL
    const repoBase = cleanUrl.replace("https://github.com/", "https://raw.githubusercontent.com/")
                             .replace("/tree/", "/")
                             .replace("/blob/", "/");
    
    const result = await prisma.escSkill.updateMany({
      where: {
        providerUrl: {
          startsWith: repoBase
        }
      },
      data: {
        providerUrl: cleanUrl
      }
    });

    console.log(`  -> Updated ${result.count} skills to point to "${cleanUrl}"`);
  }
}

deepCleanup()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
