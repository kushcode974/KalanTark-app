const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function lastFix() {
    const targetUserId = '7e352010-eb43-4567-be68-3e0bc4be20b5';
    
    // Fetch all sessions and filter locally for 2026-03-04
    const sessions = await prisma.session.findMany({
        where: { user_id: targetUserId }
    });

    const targetSessions = sessions.filter(s => s.date.toISOString().startsWith('2026-03-04'));
    console.log(`Found ${targetSessions.length} sessions on 2026-03-04`);

    if (targetSessions.length > 1) {
        let total = targetSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
        console.log(`Current total: ${total} KT`);

        // We will keep the first one and discard the rest as artifacts.
        const survivor = targetSessions[0];
        const toDeleteIds = targetSessions.slice(1).map(s => s.id);
        
        const res = await prisma.session.deleteMany({
            where: { id: { in: toDeleteIds } }
        });
        console.log(`Deleted ${res.count} ghost sessions for 2026-03-04.`);
    }

    await prisma.$disconnect();
}
lastFix();
