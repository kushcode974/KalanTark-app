
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const query4 = await prisma.$queryRawUnsafe('SELECT COUNT(*) FROM "Session" WHERE duration_minutes > 1440');
    console.log("--- QUERY 4 RESULTS ---");
    console.log("Count:", query4[0].count.toString());
  } catch (e) {
    console.error("DATABASE ERROR:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
