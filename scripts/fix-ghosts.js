const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    // Delete the 2 ghost active sessions from March 10
    // These belong to a DIFFERENT user (4b7d43c3) but are polluting the global query
    const ghostIds = [
        '295f2cc3-7a66-4cbf-9099-a07411227922',
        '82835405-dc2b-4a7e-87fb-dee80887b119'
    ];
    
    const res = await prisma.session.deleteMany({
        where: { id: { in: ghostIds } }
    });
    console.log(`Deleted ${res.count} ghost active sessions from March 10.`);

    // Verify only 1 active session remains
    const remaining = await prisma.$queryRawUnsafe(`SELECT id, user_id, start_time, date FROM "Session" WHERE end_time IS NULL`);
    console.log("Remaining active sessions:", JSON.stringify(remaining, null, 2));

    await prisma.$disconnect();
}
fix();
