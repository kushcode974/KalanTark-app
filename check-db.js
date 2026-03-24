const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const sessions = await prisma.session.findMany({
        take: 10,
        orderBy: { start_time: 'desc' },
        include: { category: true }
    });
    
    console.log("RECENT SESSIONS:");
    sessions.forEach(s => {
        console.log(`ID: ${s.id}`);
        console.log(`Duration: ${s.duration_minutes}`);
        console.log(`category_type (Session): ${s.category_type}`);
        console.log(`category_type (Category table): ${s.category?.category_type}`);
        console.log('---');
    });
}

check().catch(console.error).finally(() => prisma.$disconnect());
