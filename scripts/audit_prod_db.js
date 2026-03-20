const { PrismaClient } = require("@prisma/client");

const url = "postgresql://florentpostgree:laureenqWeR55t@212.227.84.152:5432/contentpropostgree";
const prisma = new PrismaClient({
    datasources: {
        db: { url }
    }
});

async function checkProd() {
  console.log("--- AUDITING PRODUCTION DATABASE ---");
  const count = await prisma.escSkill.count();
  console.log(`Total ESC Skills in PROD: ${count}`);
  
  if (count > 0) {
    const samples = await prisma.escSkill.findMany({ take: 5 });
    console.log("Sample Skills:");
    samples.forEach(s => console.log(` - [${s.slug}] ${s.name} | providerUrl: ${s.providerUrl}`));
  }

  const providers = await prisma.skillProvider.findMany();
  console.log(`\nProviders in PROD: ${providers.length}`);
  providers.forEach(p => console.log(` - ${p.name}: ${p.url} (Active: ${p.isActive})`));
}

checkProd()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
