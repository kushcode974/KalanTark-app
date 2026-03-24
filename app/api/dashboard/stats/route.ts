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

        // Calculate distribution for the current cycle
        const sessions = await prisma.session.findMany({
            where: {
                user_id: userId,
                start_time: {
                    gte: cycle.start,
                    lte: cycle.end
                }
            },
            include: { category: true }
        });

        const distribution: Record<string, number> = {};
        let totalCycleKT = 0;

        sessions.forEach(s => {
            const duration = s.duration_minutes || 0;
            const key = s.category_id || 'unknown'; // Strictly group by KT Section ID
            distribution[key] = (distribution[key] || 0) + duration;
            totalCycleKT += duration;
        });

        totalCycleKT = Math.min(totalCycleKT, 1440);

        // Evaluate Streak Lazily
        let streakData = user.streak;

        if (streakData && streakData.is_enabled) {
            const now = new Date();
            const lastEval = streakData.last_evaluated_cycle ? new Date(streakData.last_evaluated_cycle) : null;

            // If we have never evaluated, set today's cycle as the baseline
            if (!lastEval) {
                streakData = await prisma.streak.update({
                    where: { user_id: userId },
                    data: { last_evaluated_cycle: cycle.start }
                });
            } else if (lastEval.getTime() < cycle.start.getTime()) {
                // One or more cycles have passed! Time to evaluate.
                const oneCycleMs = 24 * 60 * 60 * 1000;

                // Get the accurate cycle date of "now", normalized to 00:00.
                const currentCycleDate = getCycleDate(new Date(), dayStartTime);
                const lastEvalDate = getCycleDate(lastEval, dayStartTime);

                // Difference in full days (since both are clamped to 00:00:00.000)
                const missedCycles = Math.round((currentCycleDate.getTime() - lastEvalDate.getTime()) / oneCycleMs);

                let failed = false;

                // If more than 1 cycle missed, streak is instantly broken
                if (missedCycles > 1) {
                    failed = true;
                } else {
                    // Exactly 1 cycle ago. Let's check how much KT was farmed in that cycle.
                    const prevCycleStart = new Date(cycle.start.getTime() - oneCycleMs);
                    const prevCycleEnd = new Date(cycle.end.getTime() - oneCycleMs);

                    const prevContext = await prisma.session.findMany({
                        where: {
                            user_id: userId,
                            start_time: { gte: prevCycleStart, lte: prevCycleEnd },
                            ...(streakData.category_id ? { category_id: streakData.category_id } : {})
                        }
                    });

                    const prevKT = prevContext.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
                    if (prevKT < streakData.target_kt) {
                        failed = true;
                    }
                }

                // Apply Updates
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

        if (!streakData) {
            streakData = {
                is_enabled: false,
                target_kt: 0,
                current_streak: 0,
                longest_streak: 0,
                category_id: null
            } as any;
        }

        return NextResponse.json({
            cycle: {
                start: cycle.start.toISOString(),
                end: cycle.end.toISOString(),
                day_start_time: dayStartTime
            },
            distribution,
            totalCycleKT,
            streak: streakData
        });

    } catch (error) {
        console.error('Stats API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
    }
}
