const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
    const s = await prisma.session.findFirst({
        where: { end_time: null },
        orderBy: { start_time: 'desc' }
    });
    console.log(JSON.stringify(s, null, 2));
    await prisma.$disconnect();
}
check();
