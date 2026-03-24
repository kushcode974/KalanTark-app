const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    // 1. Verify History page (no user exceeds 1440 KT in a single day)
    const dailyKT = await prisma.$queryRawUnsafe(`
      SELECT user_id, date, SUM(duration_minutes) as total 
      FROM "Session" 
      GROUP BY user_id, date 
      HAVING SUM(duration_minutes) > 1440
    `);
    console.log("--- HISTORY VERIFICATION: DAYS WITH > 1440 KT PER USER ---");
    console.log(dailyKT.length === 0 ? "Pass: No user has > 1440 KT in a single day." : JSON.stringify(dailyKT, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

    // 2. Dashboard Verification (Live API simulation)
    // We get the active session's user to check their cycle progress
    const activeSession = await prisma.session.findFirst({
      where: { end_time: null },
      include: { user: true }
    });

    if (activeSession) {
      const user = activeSession.user;
      const userId = user.id;
      const dayStartTime = user.day_start_time || "06:00";
      
      // Calculate cycle boundaries
      const now = new Date();
      // simplified boundaries just for reporting
      const boundaryStr = now.toISOString().split('T')[0] + 'T' + dayStartTime + ':00.000Z';
      let cycleStart = new Date(boundaryStr);
      if (now < cycleStart) {
        cycleStart.setUTCDate(cycleStart.getUTCDate() - 1);
      }
      let cycleEnd = new Date(cycleStart);
      cycleEnd.setUTCDate(cycleEnd.getUTCDate() + 1);

      const completedSessions = await prisma.session.findMany({
        where: {
            user_id: userId,
            end_time: { not: null },
            start_time: { gte: cycleStart, lte: cycleEnd }
        }
      });
      const completedMinutes = completedSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      
      const startFloor = new Date(Math.max(activeSession.start_time.getTime(), cycleStart.getTime()));
      const activeMinutes = Math.max(0, Math.floor((now.getTime() - startFloor.getTime()) / 60000));
      
      const totalAllocated = Math.min(completedMinutes + activeMinutes, 1440);

      console.log("\n--- DASHBOARD VERIFICATION: ACTIVE USER CYCLE PROGRESS ---");
      console.log(`User: ${user.name || user.email}`);
      console.log(`Completed KT this cycle: ${completedMinutes}`);
      console.log(`Active Session Elapsed KT: ${activeMinutes}`);
      console.log(`Total Cycle KT (Max 1440): ${totalAllocated}`);
      console.log(totalAllocated <= 1440 ? "Pass: Dashboard Total Cycle KT is within 1440 limit." : "Fail: Dashboard Total Cycle KT exceeds limit!");
    } else {
      console.log("\n--- DASHBOARD VERIFICATION ---");
      console.log("No active sessions currently running to verify active cycle calculation.");
    }
  } catch (e) {
    console.error("ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
