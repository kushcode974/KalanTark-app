const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
    const targetUserId = '7e352010-eb43-4567-be68-3e0bc4be20b5';
    
    const corruptedDates = ['2026-03-19', '2026-03-04'];
    
    for (const dateStr of corruptedDates) {
        console.log(`\n--- SESSIONS FOR ${dateStr} ---`);
        const sessions = await prisma.session.findMany({
            where: { 
                user_id: targetUserId,
                date: new Date(dateStr)
            }
        });
        
        console.log(JSON.stringify(sessions, null, 2));
    }

    await prisma.$disconnect();
}

debug();
