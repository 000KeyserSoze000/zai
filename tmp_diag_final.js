const { PrismaClient } = require("@prisma/client");
const url = "postgresql://florentpostgree:laureenqWeR55t@127.0.0.1:5432/contentpropostgree";
const prisma = new PrismaClient({
  datasources: {
    db: { url }
  }
});

async function check() {
  console.log("CHECKING ESC_SKILLS...");
  const escSkills = await prisma.escSkill.findMany({
    select: { slug: true, files: true }
  });
  console.log("ESC SKILLS FOUND:", escSkills.length);
  escSkills.forEach(s => {
    console.log(`- [${s.slug}] Files Keys:`, s.files ? Object.keys(s.files) : "NULL");
  });

  console.log("\nCHECKING ORCHESTRATOR SKILLS...");
  const skills = await prisma.skill.findMany({
     select: { slug: true, files: true }
  });
  console.log("ORCHESTRATOR SKILLS FOUND:", skills.length);
  skills.forEach(s => {
    console.log(`- [${s.slug}] Files Keys:`, s.files ? Object.keys(s.files) : "NULL (Table might not have the column if push failed)");
  });
}

check().catch(e => {
  console.error("DIAGNOSTIC FAILED:", e.message);
  if (e.message.includes("files") && e.message.includes("column")) {
    console.log("\n>>> THE 'files' COLUMN IS MISSING! DB PUSH FAILED! <<<");
  }
}).finally(() => prisma.$disconnect());
