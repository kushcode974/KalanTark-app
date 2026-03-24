const { PrismaClient } = require('@prisma/client');
const { splitSessionByCycles } = require('../lib/timeEngine');
const prisma = new PrismaClient();

async function fixOversized() {
    console.log("Starting oversized session cleanup...");
    
    // Find all sessions > 1440 minutes
    const oversizedSessions = await prisma.session.findMany({
        where: {
            duration_minutes: { gt: 1440 },
            end_time: { not: null }
        },
        include: { user: true }
    });

    if (oversizedSessions.length === 0) {
        console.log("No completed sessions greater than 1440 minutes found.");
    }

    for (const session of oversizedSessions) {
        const dayStartTime = session.user.day_start_time || "06:00";
        const timezone = session.user.timezone || undefined;

        console.log(`Fixing Session ${session.id} | Duration: ${session.duration_minutes}m | Start: ${session.start_time.toISOString()} | End: ${session.end_time.toISOString()}`);
        
        try {
            const splits = splitSessionByCycles(session.start_time, session.end_time, dayStartTime, timezone);
            
            // Execute perfectly transactionally 
            await prisma.$transaction(async (tx) => {
                await tx.session.delete({ where: { id: session.id } });
                
                for (const split of splits) {
                    await tx.session.create({
                        data: {
                            user_id: session.user_id,
                            category_id: session.category_id,
                            category_type: session.category_type,
                            title: session.title,
                            start_time: split.startTime,
                            end_time: split.endTime,
                            duration_minutes: split.durationMinutes,
                            date: split.cycleDate
                        }
                    });
                    console.log(`  -> Created split: Date ${split.cycleDate.toISOString().split('T')[0]}, Duration ${split.durationMinutes}m`);
                }
            });
            console.log(`Successfully fixed ${session.id}\n`);
        } catch (error) {
            console.error(`Failed to process session ${session.id}:`, error);
        }
    }
    
    // Also clean up ACTIVE oversized sessions (though live route patches this usually)
    // Wait, the user specifically said: "fix for all sessions where duration_minutes > 1440". Active sessions have duration_minutes = null.
    // The instructions say "duration_minutes > 1440". We will stick to the exact specification.
    
    console.log("Cleanup complete.");
    await prisma.$disconnect();
}

fixOversized().catch(e => {
    console.error(e);
    process.exit(1);
});
