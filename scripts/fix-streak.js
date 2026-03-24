const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Finding user...');
    const users = await prisma.user.findMany();
    if (users.length === 0) {
        console.error('No users found in database.');
        return;
    }
    const userId = users[0].id; // Assuming single user environment
    console.log(`Targeting User ID: ${userId}`);

    const existingStreak = await prisma.streak.findUnique({
        where: { user_id: userId }
    });

    if (!existingStreak) {
        console.error('No streak record found to update. (Is the user initialized?)');
        return;
    }

    console.log('Current streak data:', existingStreak);

    // Calculate today's cycle start safely based on 06:00 IST logic for the override
    // Simple naive JS implementation for this script:
    const now = new Date();
    // Move slightly into IST timezone representation (-5.5h relative to UTC)
    // Actually simpler: just find start of 06:00 UTC and shift manually if needed.
    // However, cycle util is best. For raw DB update, we'll recreate the basic math:
    const localStartHour = 6;
    const localStartMinute = 0;
    const IST_OFFSET_HOURS = 5;
    const IST_OFFSET_MINUTES = 30;

    let utcStartHour = localStartHour - IST_OFFSET_HOURS;
    let utcStartMinute = localStartMinute - IST_OFFSET_MINUTES;

    if (utcStartMinute < 0) {
        utcStartMinute += 60;
        utcStartHour -= 1;
    }
    if (utcStartHour < 0) {
        utcStartHour += 24;
    }

    const todayCycleStart = new Date(now);
    todayCycleStart.setUTCHours(utcStartHour, utcStartMinute, 0, 0);

    if (now.getTime() < todayCycleStart.getTime()) {
        todayCycleStart.setUTCDate(todayCycleStart.getUTCDate() - 1);
    }

    console.log(`Setting last_evaluated_cycle to newly calculated today cycle start: ${todayCycleStart.toISOString()}`);

    const updated = await prisma.streak.update({
        where: { user_id: userId },
        data: {
            current_streak: 3,
            longest_streak: Math.max(existingStreak.longest_streak, 3), // Ensure longest isn't lower than 3
            last_evaluated_cycle: todayCycleStart
        }
    });

    console.log('Successfully updated Streak record to:');
    console.log(updated);

    console.log('\nNOTE: primary_kt_this_streak is calculated dynamically in the API route based on current_streak count. Setting current_streak to 3 will automatically cause the engine to sum the last 3 days of Primary KT (which you noted is 1821).');
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
