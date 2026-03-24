
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const activeSessions = await prisma.session.findMany({
      where: { end_time: null },
      orderBy: { start_time: 'asc' }
    });
    console.log("--- FINAL ACTIVE SESSIONS CHECK ---");
    console.log(JSON.stringify(activeSessions, null, 2));

    const overflowSessions = await prisma.$queryRawUnsafe('SELECT COUNT(*) FROM "Session" WHERE duration_minutes > 1440');
    console.log("\n--- FINAL DURATION OVERFLOW CHECK ---");
    console.log("Count:", overflowSessions[0].count.toString());

    // Check for any days with sum of KT > 1440
    const dailyKT = await prisma.$queryRawUnsafe('SELECT date, SUM(duration_minutes) as total FROM "Session" GROUP BY date HAVING SUM(duration_minutes) > 1440');
    console.log("\n--- DAILY KT LIMIT CHECK (>1440 per day) ---");
    console.log(JSON.stringify(dailyKT, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

  } catch (e) {
    console.error("DATABASE ERROR:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
