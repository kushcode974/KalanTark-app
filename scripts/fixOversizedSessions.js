const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getCycleBoundaries(date = new Date(), dayStartTime = "06:00") {
    const localStartHour = parseInt(dayStartTime.split(':')[0], 10) || 6;
    const localStartMinute = parseInt(dayStartTime.split(':')[1], 10) || 0;

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

    const cycleStart = new Date(date);
    cycleStart.setUTCHours(utcStartHour, utcStartMinute, 0, 0);

    if (date.getTime() < cycleStart.getTime()) {
        cycleStart.setUTCDate(cycleStart.getUTCDate() - 1);
    }

    const cycleEnd = new Date(cycleStart);
    cycleEnd.setUTCDate(cycleEnd.getUTCDate() + 1);
    cycleEnd.setTime(cycleEnd.getTime() - 1);

    return { start: cycleStart, end: cycleEnd };
}

function getCycleDate(date, dayStartTime) {
    const cycleBoundaries = getCycleBoundaries(date, dayStartTime);
    const timezoneShiftedForLabel = new Date(cycleBoundaries.start.getTime() + (5.5 * 60 * 60 * 1000));
    const cycleDate = new Date(timezoneShiftedForLabel);
    cycleDate.setUTCHours(0, 0, 0, 0);
    return cycleDate;
}

function splitSessionByCycles(startTime, endTime, dayStartTime, timezone) {
    const splits = [];
    let currentStart = new Date(startTime);
    let maxIterations = 1000; 

    while (currentStart < endTime && maxIterations-- > 0) {
        const boundaries = getCycleBoundaries(currentStart, dayStartTime);
        const cycleDate = getCycleDate(currentStart, dayStartTime);

        let currentEnd;
        if (endTime.getTime() <= boundaries.end.getTime()) {
            currentEnd = new Date(endTime);
        } else {
            currentEnd = new Date(boundaries.start.getTime() + 24 * 60 * 60 * 1000); 
        }

        const durationMs = currentEnd.getTime() - currentStart.getTime();
        const durationMinutes = Math.max(0, Math.floor(durationMs / 60000));

        splits.push({
            cycleDate,
            startTime: currentStart,
            endTime: currentEnd,
            durationMinutes
        });

        currentStart = new Date(currentEnd); // Advance
    }
    return splits;
}

async function fixOversizedSessions() {
    console.log("Searching for oversized sessions (duration > 1440 minutes)...");

    const oversizedSessions = await prisma.session.findMany({
        where: {
            duration_minutes: { gt: 1440 }
        },
        include: { user: true }
    });

    if (oversizedSessions.length === 0) {
        console.log("✨ No oversized sessions found! Database is clean.");
        return;
    }

    console.log(`Found ${oversizedSessions.length} oversized sessions to fix.`);

    for (const session of oversizedSessions) {
        const user = session.user;
        const dayStartTime = user.day_start_time || "06:00";
        const timezone = user.timezone || undefined;

        console.log(`\nFixing Session ${session.id} (User: ${user.name || user.email})`);
        console.log(`Original Duration: ${session.duration_minutes} minutes`);
        console.log(`Original Start: ${session.start_time.toISOString()}, Original End: ${session.end_time?.toISOString()}`);

        if (!session.end_time) continue;

        try {
            const splits = splitSessionByCycles(session.start_time, session.end_time, dayStartTime, timezone);

            console.log(`Generated ${splits.length} perfectly bounded splits:`);
            let redistributedTotal = 0;

            const splitData = splits.map(split => {
                redistributedTotal += split.durationMinutes;
                console.log(`  -> Cycle: ${split.cycleDate.toISOString().split('T')[0]} | Duration: ${split.durationMinutes}m | Start: ${split.startTime.toISOString()}`);
                return {
                    user_id: session.user_id,
                    category_id: session.category_id,
                    category_type: session.category_type,
                    title: session.title,
                    start_time: split.startTime,
                    end_time: split.endTime,
                    duration_minutes: split.durationMinutes,
                    date: split.cycleDate
                };
            });

            console.log(`Total KT Redistributed: ${redistributedTotal}`);

            await prisma.$transaction([
                prisma.session.delete({ where: { id: session.id } }),
                prisma.session.createMany({ data: splitData })
            ]);

            console.log(`✅ Fixed Session ${session.id} successfully.`);

        } catch (err) {
            console.error(`❌ Failed to fix session ${session.id}:`, err);
        }
    }
    console.log("\nAll fixes applied.");
}

fixOversizedSessions().catch(console.error).finally(() => prisma.$disconnect());
