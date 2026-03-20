const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function aggressiveCleanup() {
  console.log("Aggressive URL Alignment...");

  const providers = await prisma.skillProvider.findMany();
  for (const p of providers) {
    const cleanUrl = p.url.replace(/\/$/, "");
    console.log(`Provider: ${p.name} -> "${cleanUrl}"`);

    const ownerRepo = cleanUrl.match(/github\.com\/([^/]+\/[^/]+)/)?.[1];
    if (ownerRepo) {
      console.log(`  Targeting owner/repo: ${ownerRepo}`);
      
      const result = await prisma.escSkill.updateMany({
        where: {
          OR: [
            { providerUrl: { contains: ownerRepo, mode: 'insensitive' } },
            // Also catch skills from this provider that might have null providerUrl but match the slug pattern?
            // No, safer to just use the URL content.
          ]
        },
        data: {
          providerUrl: cleanUrl
        }
      });
      console.log(`  -> Updated ${result.count} skills.`);
    }
  }
}

aggressiveCleanup()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
