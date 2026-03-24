const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const userId = '7e352010-eb43-4567-be68-3e0bc4be20b5';
    const s = await prisma.session.findMany({ 
        where: { user_id: userId, duration_minutes: { gt: 1440 } } 
    });
    console.log("Oversized Sessions for correct user:", JSON.stringify(s, null, 2));

    const recent = await prisma.session.findMany({
        where: { user_id: userId },
        orderBy: { start_time: 'desc' },
        take: 10
    });
    console.log("Recent sessions for user:", JSON.stringify(recent, null, 2));

    await prisma.$disconnect();
}
run();
