const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function globalPurge() {
    const targetUserId = '7e352010-eb43-4567-be68-3e0bc4be20b5';
    console.log(`--- GLOBAL OVERLAP PURGE FOR USER: ${targetUserId} ---`);

    const sessions = await prisma.session.findMany({
        where: { user_id: targetUserId },
        orderBy: { start_time: 'asc' }
    });

    const toDelete = [];
    
    for (let i = 0; i < sessions.length; i++) {
        for (let j = i + 1; j < sessions.length; j++) {
            const s1 = sessions[i];
            const s2 = sessions[j];
            
            if (toDelete.includes(s2.id)) continue;

            // OVERLAP LOGIC:
            // A session is a duplicate/overlap if it starts before the previous one ends,
            // or if it starts within 15 minutes of the previous one for the same category.
            const s1End = s1.end_time ? s1.end_time.getTime() : Infinity;
            const s2Start = s2.start_time.getTime();

            const sameCategory = s1.category_id === s2.category_id;
            const startTimeDiff = Math.abs(s1.start_time.getTime() - s2.start_time.getTime());

            const isOverlap = s2Start < s1End && sameCategory;
            const isFuzzyDuplicate = startTimeDiff < 900000 && sameCategory; // 15 minutes

            if (isOverlap || isFuzzyDuplicate) {
                console.log(`[PURGE] Redundant Session: ${s2.id} | Collides with ${s1.id}`);
                console.log(`   Type: ${isOverlap ? 'OVERLAP' : 'FUZZY'}`);
                toDelete.push(s2.id);
            }
        }
    }

    console.log(`Total identified for destruction: ${toDelete.length}`);

    if (toDelete.length > 0) {
        const res = await prisma.session.deleteMany({
            where: { id: { in: toDelete } }
        });
        console.log(`Successfully annihilated ${res.count} records.`);
    }

    await prisma.$disconnect();
}

globalPurge();
