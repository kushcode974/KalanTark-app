const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getCycleBoundaries(date = new Date(), dayStartTime = "06:00") {
    const localStartHour = parseInt(dayStartTime.split(':')[0], 10) || 6;
    const localStartMinute = parseInt(dayStartTime.split(':')[1], 10) || 0;
    const IST_OFFSET_HOURS = 5;
    const IST_OFFSET_MINUTES = 30;
    let utcStartHour = localStartHour - IST_OFFSET_HOURS;
    let utcStartMinute = localStartMinute - IST_OFFSET_MINUTES;
    if (utcStartMinute < 0) { utcStartMinute += 60; utcStartHour -= 1; }
    if (utcStartHour < 0) { utcStartHour += 24; }
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

function splitSessionByCycles(startTime, endTime, dayStartTime) {
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
            // Get the NEXT cycle's start properly
            const nextCycleStart = new Date(boundaries.end.getTime() + 1);
            const nextBoundaries = getCycleBoundaries(nextCycleStart, dayStartTime);
            currentEnd = nextBoundaries.start;
        }
        const durationMs = currentEnd.getTime() - currentStart.getTime();
        const durationMinutes = Math.max(0, Math.floor(durationMs / 60000));
        splits.push({ cycleDate, startTime: currentStart, endTime: currentEnd, durationMinutes });
        currentStart = new Date(currentEnd);
    }
    return splits;
}

async function fix() {
    const now = new Date();
    console.log("=== FIX 1: Kill ALL ghost sessions ===");

    const ghostSessions = await prisma.session.findMany({
        where: { end_time: null },
        include: { user: true }
    });

    console.log(`Found ${ghostSessions.length} active session(s) with end_time = null`);

    if (ghostSessions.length <= 1) {
        console.log("Only 0 or 1 active session exists. No ghost cleanup needed.");
        if (ghostSessions.length === 1) {
            console.log(`Active session: id=${ghostSessions[0].id}, start=${ghostSessions[0].start_time.toISOString()}, user=${ghostSessions[0].user_id}`);
        }
    } else {
        // Sort by start_time desc — keep the most recent one as the "real" active session
        ghostSessions.sort((a, b) => b.start_time.getTime() - a.start_time.getTime());
        const survivor = ghostSessions[0];
        console.log(`Keeping most recent: id=${survivor.id}, start=${survivor.start_time.toISOString()}`);

        for (let i = 1; i < ghostSessions.length; i++) {
            const ghost = ghostSessions[i];
            const dayStartTime = ghost.user?.day_start_time || "06:00";
            console.log(`\nProcessing ghost: id=${ghost.id}, start=${ghost.start_time.toISOString()}`);

            const splits = splitSessionByCycles(ghost.start_time, now, dayStartTime);
            console.log(`  Generated ${splits.length} splits`);

            await prisma.session.delete({ where: { id: ghost.id } });

            for (const split of splits) {
                await prisma.session.create({
                    data: {
                        user_id: ghost.user_id,
                        category_id: ghost.category_id,
                        category_type: ghost.category_type,
                        title: ghost.title,
                        start_time: split.startTime,
                        end_time: split.endTime,
                        duration_minutes: split.durationMinutes,
                        date: split.cycleDate
                    }
                });
                console.log(`  -> Saved split: cycle=${split.cycleDate.toISOString().split('T')[0]}, duration=${split.durationMinutes}m`);
            }
        }
    }

    // Final verification
    console.log("\n=== VERIFICATION ===");
    const remainingActive = await prisma.$queryRawUnsafe(`SELECT id, user_id, start_time, date FROM "Session" WHERE end_time IS NULL`);
    console.log(`Active sessions remaining: ${remainingActive.length}`);
    console.log(JSON.stringify(remainingActive, null, 2));

    const oversized = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "Session" WHERE duration_minutes > 1440`);
    console.log(`Sessions with duration > 1440: ${Number(oversized[0].count)}`);

    // Show daily totals for recent dates
    const userId = '7e352010-eb43-4567-be68-3e0bc4be20b5';
    const sessions = await prisma.session.findMany({
        where: { user_id: userId },
        orderBy: { start_time: 'desc' }
    });
    const dailyTotals = {};
    sessions.forEach(s => {
        const d = s.date.toISOString().split('T')[0];
        if (!dailyTotals[d]) dailyTotals[d] = 0;
        dailyTotals[d] += (s.duration_minutes || 0);
    });
    console.log("\n=== DAILY TOTALS ===");
    Object.entries(dailyTotals).sort((a,b) => b[0].localeCompare(a[0])).forEach(([date, total]) => {
        const flag = total > 1440 ? ' ⚠️ OVER 1440!' : '';
        console.log(`${date}: ${total} KT${flag}`);
    });

    await prisma.$disconnect();
}

fix();
