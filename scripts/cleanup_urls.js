const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function cleanup() {
  console.log("Normalizing URLs (removing trailing slashes)...");

  // 1. Providers
  const providers = await prisma.skillProvider.findMany();
  for (const p of providers) {
    if (p.url.endsWith("/")) {
      const newUrl = p.url.replace(/\/$/, "");
      console.log(`Cleaning Provider: ${p.name} -> ${newUrl}`);
      await prisma.skillProvider.update({
        where: { id: p.id },
        data: { url: newUrl }
      });
    }
  }

  // 2. Skills
  const skills = await prisma.escSkill.findMany({
    where: { providerUrl: { not: null } }
  });
  let count = 0;
  for (const s of skills) {
    if (s.providerUrl && s.providerUrl.endsWith("/")) {
      const newUrl = s.providerUrl.replace(/\/$/, "");
      await prisma.escSkill.update({
        where: { id: s.id },
        data: { providerUrl: newUrl }
      });
      count++;
    }
  }

  console.log(`Cleaned ${count} skills.`);
}

cleanup()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
