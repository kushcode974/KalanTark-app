const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDuplicates() {
    const userId = '7e352010-eb43-4567-be68-3e0bc4be20b5';

    console.log("Finding all sessions for user...");
    const allSessions = await prisma.session.findMany({
        where: { user_id: userId },
        orderBy: { start_time: 'asc' }
    });

    console.log(`Found ${allSessions.length} total sessions`);

    // We will group sessions by exact start_time, category_id, and end_time (or null)
    // If multiple sessions have identical composite keys, we keep the first one and DELETE the rest.
    const uniqueMap = new Map();
    const toDeleteIds = [];

    for (const s of allSessions) {
        // Construct composite key
        const key = `${s.category_id}_${s.start_time.getTime()}_${s.end_time ? s.end_time.getTime() : 'active'}`;
        
        if (uniqueMap.has(key)) {
            // It's a duplicate!
            toDeleteIds.push(s.id);
        } else {
            uniqueMap.set(key, s.id);
        }
    }

    console.log(`Identified ${toDeleteIds.length} exact duplicate sessions to DELETE.`);

    if (toDeleteIds.length > 0) {
        const res = await prisma.session.deleteMany({
            where: {
                id: { in: toDeleteIds }
            }
        });
        console.log(`Deleted ${res.count} duplicate sessions.`);
    }

    // Now, let's verify if there's ONLY ONE active session left.
    const activeSessions = await prisma.session.findMany({
        where: { user_id: userId, end_time: null }
    });

    console.log(`Active sessions surviving: ${activeSessions.length}`);
    if (activeSessions.length > 1) {
        console.log("WARNING: Still Multiple active sessions of different categories/start times!");
        // Keep the one with the latest start time
        activeSessions.sort((a,b) => b.start_time.getTime() - a.start_time.getTime());
        const survivor = activeSessions[0];
        const rogueIds = activeSessions.slice(1).map(s => s.id);
        await prisma.session.deleteMany({ where: { id: { in: rogueIds } } });
        console.log(`Force-deleted ${rogueIds.length} non-primary active sessions. Survivor: ${survivor.start_time}`);
    }

    await prisma.$disconnect();
}

cleanDuplicates().catch(console.error);
