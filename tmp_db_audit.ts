
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log("--- QUERY 3: Active Sessions ---");
    const query3 = await prisma.$queryRawUnsafe(`
      SELECT id, start_time, end_time, duration_minutes, date 
      FROM "Session" 
      WHERE end_time IS NULL
      ORDER BY start_time ASC
    `);
    console.log(JSON.stringify(query3, null, 2));

    console.log("\n--- QUERY 4: Sessions > 1440 mins ---");
    const query4 = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) FROM "Session" WHERE duration_minutes > 1440
    `);
    console.log(JSON.stringify(query4, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
