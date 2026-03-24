const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfill() {
    console.log("Starting backfill for session.category_type...");

    const sessions = await prisma.session.findMany({
        where: { category_type: null },
        include: { category: true }
    });

    console.log(`Found ${sessions.length} sessions to update.`);

    let updated = 0;
    for (const session of sessions) {
        if (session.category && session.category.category_type) {
            await prisma.session.update({
                where: { id: session.id },
                data: { category_type: session.category.category_type }
            });
            updated++;
        }
    }

    console.log(`Successfully updated ${updated} sessions.`);
}

backfill().catch(console.error).finally(() => prisma.$disconnect());
