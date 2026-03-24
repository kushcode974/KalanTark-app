const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    if (users.length === 0) {
        console.log('No users found.');
        return;
    }
    const userId = users[0].id;

    console.log('--- 1. STREAK TABLE RECORD ---');
    const streak = await prisma.streak.findUnique({
        where: { user_id: userId }
    });
    console.log(streak);
    console.log('\n(Note: primary_kt_this_streak is calculated dynamically by the API, it is NOT stored in the database)');

    console.log('\n--- 2. SESSIONS FOR MARCH 3RD CYCLE ---');
    // March 3rd cycle for 06:00 IST = March 3rd 00:30:00 UTC to March 4th 00:29:59 UTC
    const cycleStart = new Date(Date.UTC(2026, 2, 3, 0, 30, 0)); // Month is 0-indexed, so 2 = March
    const cycleEnd = new Date(Date.UTC(2026, 2, 4, 0, 29, 59, 999));

    console.log(`Searching bounds: ${cycleStart.toISOString()} to ${cycleEnd.toISOString()}`);

    const sessions = await prisma.session.findMany({
        where: {
            user_id: userId,
            start_time: {
                gte: cycleStart,
                lte: cycleEnd
            }
        },
        include: {
            category: true
        },
        orderBy: {
            start_time: 'asc'
        }
    });

    if (sessions.length === 0) {
        console.log('No sessions found for this cycle.');
    } else {
        sessions.forEach(s => {
            console.log(`- Start: ${s.start_time.toISOString()} | Duration: ${s.duration_minutes}m | Category: ${s.category?.name} (${s.category?.category_type})`);
        });

        const total = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
        console.log(`\nTotal KT for cycle: ${total}m`);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    });
