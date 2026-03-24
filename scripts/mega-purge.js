const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function purge() {
    const targetUserId = '7e352010-eb43-4567-be68-3e0bc4be20b5';
    console.log(`--- MEGA PURGE FOR USER: ${targetUserId} ---`);

    const sessions = await prisma.session.findMany({
        where: { user_id: targetUserId },
        orderBy: { start_time: 'asc' }
    });

    const toDelete = [];
    
    for (let i = 0; i < sessions.length; i++) {
        for (let j = i + 1; j < sessions.length; j++) {
            const s1 = sessions[i];
            const s2 = sessions[j];
            
            // If they are already marked for deletion, skip
            if (toDelete.includes(s2.id)) continue;

            // FUZZY OVERLAP LOGIC:
            // If they start within 2 minutes of each other for the same category
            const startTimeDiff = Math.abs(s1.start_time.getTime() - s2.start_time.getTime());
            const sameCategory = s1.category_id === s2.category_id;
            
            if (sameCategory && startTimeDiff < 120000) { // 2 minutes
                console.log(`Found fuzzy duplicate: ${s1.id} vs ${s2.id} | Start Diff: ${startTimeDiff}ms`);
                // Keep s1, delete s2
                toDelete.push(s2.id);
            }
        }
    }

    console.log(`Identified ${toDelete.length} fuzzy duplicates to delete.`);

    if (toDelete.length > 0) {
        // Break into chunks of 50 to avoid URI limits or param limits if needed
        const res = await prisma.session.deleteMany({
            where: { id: { in: toDelete } }
        });
        console.log(`Successfully purged ${res.count} records.`);
    }

    await prisma.$disconnect();
}

purge();
