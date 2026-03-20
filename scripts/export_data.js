const { PrismaClient } = require("@prisma/client");
const fs = require('fs');
const path = require('path');

const url = "postgresql://florentpostgree:laureenqWeR55t@212.227.84.152:5432/contentpropostgree";
const prisma = new PrismaClient({
    datasources: { db: { url } }
});

const DATE = "2026-03-20";
const BACKUP_FILE = path.join(__dirname, '..', 'backups', `skills_export_${DATE}.json`);

async function exportData() {
  console.log("--- EXPORTING DATA FROM PROD ---");
  try {
    const [skills, providers] = await Promise.all([
      prisma.escSkill.findMany(),
      prisma.skillProvider.findMany()
    ]);

    const data = {
      exportedAt: new Date().toISOString(),
      skills,
      providers
    };

    fs.writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2));
    console.log(`Success! Exported ${skills.length} skills and ${providers.length} providers.`);
    console.log(`Saved to: ${BACKUP_FILE}`);
  } catch (e) {
    console.error("EXPORT FAILED:", e.message);
  }
}

exportData()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
