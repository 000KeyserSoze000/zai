const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function diag() {
  console.log("--- PROVIDERS ---");
  const providers = await prisma.skillProvider.findMany();
  providers.forEach(p => console.log(`ID: ${p.id} | Name: ${p.name} | URL: "${p.url}"`));

  console.log("\n--- SKILLS (sample with providerUrl) ---");
  const skills = await prisma.escSkill.findMany({
    where: { providerUrl: { not: null } },
    take: 10
  });
  skills.forEach(s => console.log(`ID: ${s.id} | Name: ${s.name} | providerUrl: "${s.providerUrl}"`));

  console.log("\n--- COUNT BY providerUrl ---");
  const grouped = await prisma.escSkill.groupBy({
    by: ['providerUrl'],
    _count: { _all: true }
  });
  grouped.forEach(g => console.log(`URL: "${g.providerUrl}" | Count: ${g._count._all}`));
}

diag()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
