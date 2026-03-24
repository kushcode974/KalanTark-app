const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    if (users.length === 0) return;
    const userId = users[0].id;

    console.log('--- ALL SESSIONS MAR 1 TO MAR 5 ---');
    const boundsStart = new Date(Date.UTC(2026, 2, 1));
    const boundsEnd = new Date(Date.UTC(2026, 2, 6));

    const sessions = await prisma.session.findMany({
        where: {
            user_id: userId,
            start_time: {
                gte: boundsStart,
                lte: boundsEnd
            }
        },
        include: {
            category: true
        },
        orderBy: {
            start_time: 'asc'
        }
    });

    sessions.forEach(s => {
        console.log(`- Start: ${s.start_time.toISOString()} | Duration: ${s.duration_minutes}m | Category: ${s.category?.name} (${s.category?.category_type})`);
    });
}

main()
    .then(async () => await prisma.$disconnect())
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    });
