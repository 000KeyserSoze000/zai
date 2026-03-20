const { PrismaClient } = require("@prisma/client");

const url = "postgresql://florentpostgree:laureenqWeR55t@212.227.84.152:5432/contentpropostgree";
const prisma = new PrismaClient({
    datasources: {
        db: { url }
    }
});

async function testWrite() {
  console.log("--- TESTING WRITE TO PROD ---");
  try {
    const data = {
      name: "TEST_SKILL",
      slug: "test-skill-" + Date.now(),
      promptContent: "TEST CONTENT",
      source: "manual",
      isActive: true,
      category: "test"
    };

    console.log("Attempting to create skill...");
    const skill = await prisma.escSkill.create({ data });
    console.log("Success! Created skill ID:", skill.id);

    // Verify
    const count = await prisma.escSkill.count();
    console.log("Total skills now:", count);
  } catch (e) {
    console.error("WRITE FAILED:", e.message);
  }
}

testWrite()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
