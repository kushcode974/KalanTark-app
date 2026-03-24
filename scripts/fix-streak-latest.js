const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Finding user...');
    const users = await prisma.user.findMany();
    if (users.length === 0) return;
    const userId = users[0].id;

    console.log('Update streak to 3 and last evaluated cycle to today UTC bounds.');
    const updated = await prisma.streak.update({
        where: { user_id: userId },
        data: {
            current_streak: 3,
            last_evaluated_cycle: new Date('2026-03-06T01:30:00.000Z')
        }
    });
    console.log(updated);
}

main()
    .then(async () => await prisma.$disconnect())
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    });
