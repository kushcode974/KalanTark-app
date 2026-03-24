import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/verifyAuth';
import { getCycleBoundaries, getCycleDate } from '@/lib/utils/cycle';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { day_start_time: true, streak: true }
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const dayStartTime = user.day_start_time || "06:00";
        const cycle = getCycleBoundaries(new Date(), dayStartTime);

        let streakData = user.streak;

        // Part 1: Auto-initialization and Part 2: Backfill Evaluation
        if (!streakData) {
            const yesterdayStart = getCycleBoundaries(new Date(cycle.start.getTime() - 1), dayStartTime).start;

            // 1. Auto-create missing record
            streakData = await prisma.streak.create({
                data: {
                    user_id: userId,
                    current_streak: 0,
                    longest_streak: 0,
                    is_enabled: true,
                    target_kt: 0,
                    last_evaluated_cycle: yesterdayStart,
                }
            });

            // 2. Backfill evaluation (starting from Day -2 so normal engine can cleanly evaluate Day -1 Yesterday)
            const dayBeforeYesterday = getCycleBoundaries(new Date(yesterdayStart.getTime() - 1), dayStartTime).start;
            let backfillStreak = 0;
            let currentSearchCycle = dayBeforeYesterday;

            while (true) {
                const searchBounds = getCycleBoundaries(new Date(currentSearchCycle.getTime() + 1000), dayStartTime);

                const cycleSessions = await prisma.session.findMany({
                    where: {
                        user_id: userId,
                        start_time: { gte: searchBounds.start, lte: searchBounds.end }
                    },
                    include: { category: true }
                });

                const totalKT = cycleSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
                const hasPrimary = cycleSessions.some(s => s.category?.category_type === 'primary');

                if (totalKT >= 120 && hasPrimary) {
                    backfillStreak++;
                    currentSearchCycle = getCycleBoundaries(new Date(searchBounds.start.getTime() - 1), dayStartTime).start;
                } else {
                    break;
                }
            }

            if (backfillStreak > 0) {
                streakData = await prisma.streak.update({
                    where: { user_id: userId },
                    data: {
                        current_streak: backfillStreak,
                        longest_streak: backfillStreak
                    }
                });
            }
        }

        // Lazy evaluate streak logic identically to dashboard stats
        if (streakData && streakData.is_enabled) {
            const lastEval = streakData.last_evaluated_cycle ? new Date(streakData.last_evaluated_cycle) : null;

            if (!lastEval) {
                streakData = await prisma.streak.update({
                    where: { user_id: userId },
                    data: { last_evaluated_cycle: cycle.start }
                });
            } else {
                const getIstCycleDateStr = (utcStart: Date) => {
                    const shiftMs = 5.5 * 60 * 60 * 1000;
                    const istObj = new Date(utcStart.getTime() + shiftMs);
                    const y = istObj.getUTCFullYear();
                    const m = String(istObj.getUTCMonth() + 1).padStart(2, '0');
                    const d = String(istObj.getUTCDate()).padStart(2, '0');
                    return `${y}-${m}-${d}`;
                };

                const currentCycleStr = getIstCycleDateStr(cycle.start);
                const lastEvalStr = getIstCycleDateStr(lastEval);

                if (currentCycleStr !== lastEvalStr) {
                    const prevCycleStart = getCycleBoundaries(new Date(cycle.start.getTime() - 1), dayStartTime).start;
                    const prevCycleStr = getIstCycleDateStr(prevCycleStart);

                    let failed = false;

                    if (lastEvalStr === prevCycleStr) {
                        // Exactly one cycle missed (yesterday). Evaluate it.
                        const prevCycle = getCycleBoundaries(new Date(cycle.start.getTime() - 1), dayStartTime);
                        const prevContext = await prisma.session.findMany({
                            where: {
                                user_id: userId,
                                start_time: { gte: prevCycle.start, lte: prevCycle.end }
                            },
                            include: { category: true }
                        });

                        const totalKT = prevContext.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
                        const hasPrimary = prevContext.some(s => s.category?.category_type === 'primary');

                        if (totalKT < 120 || !hasPrimary) {
                            failed = true;
                        }
                    } else {
                        // More than one full cycle missed -> automatic reset
                        failed = true;
                    }

                    const newStreak = failed ? 0 : streakData.current_streak + 1;
                    const newLongest = Math.max(streakData.longest_streak, newStreak);

                    streakData = await prisma.streak.update({
                        where: { user_id: userId },
                        data: {
                            current_streak: newStreak,
                            longest_streak: newLongest,
                            last_evaluated_cycle: cycle.start,
                            ...(failed ? {} : { last_completed_date: new Date() })
                        }
                    });
                }
            }
        }

        const currentStreakDays = streakData?.current_streak || 0;
        let primaryKtThisStreak = 0;
        let primaryKtToday = 0;
        let totalKtThisStreak = 0;

        // Create a universal cycle-aware duration calculator
        const now = new Date();
        const cycleAwareDuration = (s: any) => {
            if (s.end_time) return s.duration_minutes || 0;
            // Floor an active session's start time to the beginning of the CURRENT cycle it belongs to.
            // For 'Today' queries, this safely ignores leaked yesterday-time.
            const startFloor = new Date(Math.max(s.start_time.getTime(), cycle.start.getTime()));
            const diffMs = Math.max(0, now.getTime() - startFloor.getTime());
            return Math.floor(diffMs / 60000);
        };

        // For whole streak queries vs today queries
        const fullStreakDuration = (s: any, overallStreakStartMs: number) => {
            if (s.end_time) return s.duration_minutes || 0;
            const startFloor = new Date(Math.max(s.start_time.getTime(), overallStreakStartMs));
            const diffMs = Math.max(0, now.getTime() - startFloor.getTime());
            return Math.floor(diffMs / 60000);
        };

        // Count whatever KT is tracked TODAY including live pacing
        const todaySessions = await prisma.session.findMany({
            where: {
                user_id: userId,
                start_time: { gte: cycle.start, lte: cycle.end }
            },
            include: { category: true }
        });

        const rawPrimaryKtToday = todaySessions
            .filter(s => s.category?.category_type === 'primary')
            .reduce((acc, s) => acc + cycleAwareDuration(s), 0);
            
        primaryKtToday = Math.min(rawPrimaryKtToday, 1440);

        if (currentStreakDays > 0) {
            // Traverse backward for exactly `currentStreakDays` cycles to find the dawn of the streak
            let streakStartTime = new Date(cycle.start.getTime());
            for (let i = 0; i < currentStreakDays; i++) {
                streakStartTime = getCycleBoundaries(new Date(streakStartTime.getTime() - 1), dayStartTime).start;
            }

            const activeSessions = await prisma.session.findMany({
                where: {
                    user_id: userId,
                    start_time: { gte: streakStartTime }
                },
                include: { category: true }
            });

            primaryKtThisStreak = activeSessions
                .filter(s => s.category?.category_type === 'primary')
                .reduce((acc, s) => acc + fullStreakDuration(s, streakStartTime.getTime()), 0);

            totalKtThisStreak = activeSessions
                .reduce((acc, s) => acc + fullStreakDuration(s, streakStartTime.getTime()), 0);
        } else {
            primaryKtThisStreak = primaryKtToday;
            const rawTotalToday = todaySessions
                .reduce((acc, s) => acc + cycleAwareDuration(s), 0);
            totalKtThisStreak = Math.min(rawTotalToday, 1440);
        }

        return NextResponse.json({
            sovereign_days: currentStreakDays,
            total_kt_this_streak: totalKtThisStreak,
            primary_kt_this_streak: primaryKtThisStreak,
            primary_kt_today: primaryKtToday
        });

    } catch (error) {
        console.error('Streak API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch streak data' }, { status: 500 });
    }
}
