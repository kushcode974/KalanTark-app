const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
    const targetUserId = '7e352010-eb43-4567-be68-3e0bc4be20b5';
    console.log(`--- DEBUGGING SESSIONS FOR USER: ${targetUserId} ---`);

    // 1. Get ALL sessions for this user
    const sessions = await prisma.session.findMany({
        where: { user_id: targetUserId },
        orderBy: { start_time: 'desc' }
    });

    console.log(`Total sessions found: ${sessions.length}`);

    // 2. Log any session where duration > 1440 OR end_time is null
    console.log("\n--- SUSPICIOUS SESSIONS (LOGGED) ---");
    sessions.filter(s => (s.duration_minutes && s.duration_minutes > 1440) || s.end_time === null).forEach(s => {
        console.log(`ID: ${s.id} | Date: ${s.date.toISOString().split('T')[0]} | Start: ${s.start_time.toISOString()} | End: ${s.end_time?.toISOString() || 'ACTIVE'} | Duration: ${s.duration_minutes}`);
    });

    // 3. Aggregate daily totals manually to see what History API sees
    const dailyTotals = {};
    sessions.forEach(s => {
        const d = s.date.toISOString().split('T')[0];
        if (!dailyTotals[d]) dailyTotals[d] = 0;
        dailyTotals[d] += (s.duration_minutes || 0);
    });

    console.log("\n--- MANUAL DAILY TOTALS (sum of duration_minutes) ---");
    Object.entries(dailyTotals).sort((a,b) => b[0].localeCompare(a[0])).forEach(([date, total]) => {
        console.log(`${date}: ${total} KT`);
    });

    await prisma.$disconnect();
}

debug();
