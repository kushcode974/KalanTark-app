import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/verifyAuth';
import { getCycleBoundaries } from '@/lib/utils/cycle';
import { splitSessionByCycles } from '@/lib/timeEngine';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const limit = rateLimit(`live:${userId}`, 30, 60 * 1000);
    if (!limit.success) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { day_start_time: true, timezone: true }
        });

        const dayStartTime = user?.day_start_time || "06:00";
        const timezone = user?.timezone || undefined;
        const cycle = getCycleBoundaries(new Date(), dayStartTime);

        // 1. Find ALL active sessions — guard against illegal multi-active state
        const activeSessions = await prisma.session.findMany({
            where: { user_id: userId, end_time: null },
            include: { category: true },
            orderBy: { start_time: 'desc' }
        });

        // If multiple active sessions exist — illegal state, fix immediately
        if (activeSessions.length > 1) {
            const now = new Date();
            // Keep the most recent one, close all older ones
            for (let i = 1; i < activeSessions.length; i++) {
                const ghost = activeSessions[i];
                try {
                    const splits = splitSessionByCycles(ghost.start_time, now, dayStartTime, timezone);
                    await prisma.session.delete({ where: { id: ghost.id } });
                    for (const split of splits) {
                        if (split.durationMinutes > 1440) {
                            throw new Error(`Refusing to save session with duration ${split.durationMinutes} > 1440. Use splitSessionByCycles first.`);
                        }
                        await prisma.session.create({
                            data: {
                                user_id: userId,
                                category_id: ghost.category_id,
                                category_type: ghost.category_type,
                                title: ghost.title,
                                start_time: split.startTime,
                                end_time: split.endTime,
                                duration_minutes: split.durationMinutes,
                                date: split.cycleDate
                            }
                        });
                    }
                } catch (err) {
                    // If split fails, just delete the ghost to maintain single-active invariant
                    console.error(`Failed to split ghost session ${ghost.id}, deleting:`, err);
                    await prisma.session.delete({ where: { id: ghost.id } });
                }
            }
            console.log(`[GUARD] Cleaned up ${activeSessions.length - 1} ghost active sessions`);
        }

        // Now safely use the most recent active session
        let activeSession = activeSessions[0] || null;

        // Part 2: Live Split Logic
        if (activeSession) {
            const now = new Date();
            const boundaries = getCycleBoundaries(now, dayStartTime);

            // If start_time is before the current cycle's strict start boundary, it crossed over!
            if (activeSession.start_time.getTime() < boundaries.start.getTime()) {
                const splits = splitSessionByCycles(activeSession.start_time, now, dayStartTime, timezone);

                if (splits.length > 0) {
                    // a, b, c, d. Delete the original active session
                    await prisma.session.delete({
                        where: { id: activeSession.id }
                    });

                    // e. Save ALL completed splits as closed sessions
                    // The last split is the 'current' one. All splits BEFORE the last one are fully completed.
                    for (let i = 0; i < splits.length - 1; i++) {
                        const split = splits[i];
                        await prisma.session.create({
                            data: {
                                user_id: userId,
                                category_id: activeSession.category_id,
                                category_type: activeSession.category_type,
                                title: activeSession.title,
                                start_time: split.startTime,
                                end_time: split.endTime,
                                duration_minutes: split.durationMinutes,
                                date: split.cycleDate
                            }
                        });
                    }

                    // f. Create a NEW active session (end_time = null) for the CURRENT cycle
                    const lastSplit = splits[splits.length - 1];
                    await prisma.session.create({
                        data: {
                            user_id: userId,
                            category_id: activeSession.category_id,
                            category_type: activeSession.category_type,
                            title: activeSession.title,
                            start_time: lastSplit.startTime, // Starts precisely at todayCycleStart
                            date: lastSplit.cycleDate
                        }
                    });

                    // g. Re-fetch the newly minted active session so the UI sees it instantly
                    const refreshed = await prisma.session.findFirst({
                        where: { user_id: userId, end_time: null },
                        include: { category: true }
                    });
                    activeSession = refreshed as any;
                }
            }
        }

        // 2. Calculate allocated time exactly within this cycle constraints
        const completedSessions = await prisma.session.findMany({
            where: {
                user_id: userId,
                end_time: { not: null },
                start_time: { gte: cycle.start, lte: cycle.end }
            }
        });

        const completedMinutes = completedSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
        let activeMinutes = 0;

        if (activeSession) {
            // Include dynamically ticking minutes strictly clamped to the current cycle
            const startFloor = new Date(Math.max(activeSession.start_time.getTime(), cycle.start.getTime()));
            activeMinutes = Math.max(0, Math.floor((new Date().getTime() - startFloor.getTime()) / 60000));
        }

        // Final safety check: individual day can never exceed 1440
        const totalAllocated = Math.min(completedMinutes + activeMinutes, 1440);

        const unallocatedMinutes = 0; // The Engine is Pure Switch. No unallocated time.

        // Compute lifetime total KT
        const lifetimeResult = await prisma.session.aggregate({
            where: { user_id: userId },
            _sum: { duration_minutes: true }
        });
        const totalLifetimeKT = lifetimeResult._sum.duration_minutes ?? 0;

        return NextResponse.json({
            activeSession,
            allocated_kt: completedMinutes, // ONLY completed sessions
            active_duration: activeMinutes, // Active duration at moment of fetch
            total_cycle_kt: totalAllocated,
            unallocated_kt: unallocatedMinutes,
            total_capacity: 1440,
            total_lifetime_kt: totalLifetimeKT,
            cycle
        });
    } catch (error) {
        console.error('Live engine error:', error);
        return NextResponse.json({ error: 'Failed to fetch live state' }, { status: 500 });
    }
}
