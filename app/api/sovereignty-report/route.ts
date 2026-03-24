import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/verifyAuth';
import { getCycleBoundaries } from '@/lib/utils/cycle';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { day_start_time: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const dayStartTime = user.day_start_time || "06:00";

        // 1. Calculate boundaries
        const todayDateObj = new Date();
        const todayCycle = getCycleBoundaries(todayDateObj, dayStartTime);

        // Weekly: The 7 most recent cycles (including today)
        // 6 cycles ago + today = 7 total cycles
        let weekStartCycle = new Date(todayCycle.start.getTime());
        for (let i = 0; i < 6; i++) {
            weekStartCycle = getCycleBoundaries(new Date(weekStartCycle.getTime() - 1000), dayStartTime).start;
        }

        const weekStart = weekStartCycle;
        const weekEnd = todayCycle.end;

        // Monthly: First to last day of current *calendar month* in IST
        // We use the exact IST cycle date for 'today' as the anchor month
        // +5.5 hours to move UTC boundary perfectly into IST calendar bounds
        const istDate = new Date(todayCycle.start.getTime() + (5.5 * 60 * 60 * 1000));

        // Find 1st of the month in IST
        const firstOfMonthIST = new Date(Date.UTC(istDate.getUTCFullYear(), istDate.getUTCMonth(), 1));
        // Find 00:00:00 Z for cycle alignment later
        let monthStartSearch = new Date(firstOfMonthIST);

        // Walk backwards/forwards to find the EXACT getCycleBoundaries that matches the 1st
        // Simple generic boundary mapping for month:
        // We just fetch 31 days backwards from today and filter them later via logic.
        let monthStartBound = new Date(todayCycle.start.getTime());
        for (let i = 0; i < 31; i++) {
            monthStartBound = getCycleBoundaries(new Date(monthStartBound.getTime() - 1000), dayStartTime).start;
        }


        // 2. Fetch all raw data efficiently
        const sessions = await prisma.session.findMany({
            where: {
                user_id: userId,
                start_time: { gte: monthStartBound, lte: todayCycle.end }
            },
            include: { category: true }
        });

        const cycleNotes = await prisma.cycleNote.findMany({
            where: { user_id: userId }
        });

        const notesMap = new Map(cycleNotes.map((note: any) => [note.cycle_date, note.note]));

        // Helper to process a range array into report stats
        const processRange = (sessionsForRange: typeof sessions) => {

            // Map by day
            const dailyStats = new Map<string, {
                total_kt: number;
                primary_kt: number;
                scattered_kt: number;
                has_primary: boolean;
            }>();

            sessionsForRange.forEach(s => {
                // Must ensure string formatting matches "yyyy-MM-dd" correctly 
                // We use cycle start time to anchor it to cycle label
                const cycleBounds = getCycleBoundaries(s.start_time, dayStartTime);

                // Convert UTC cycle start to IST string label (yyyy-MM-dd)
                const shiftMs = (5.5 * 60 * 60 * 1000);
                const istObj = new Date(cycleBounds.start.getTime() + shiftMs);
                const y = istObj.getUTCFullYear();
                const m = String(istObj.getUTCMonth() + 1).padStart(2, '0');
                const d = String(istObj.getUTCDate()).padStart(2, '0');
                const cycleDateStr = `${y}-${m}-${d}`;

                if (!dailyStats.has(cycleDateStr)) {
                    dailyStats.set(cycleDateStr, { total_kt: 0, primary_kt: 0, scattered_kt: 0, has_primary: false });
                }

                const dStat = dailyStats.get(cycleDateStr)!;
                const kt = s.duration_minutes || 0;

                // Add active tick if active session
                let actualKt = kt;
                if (!s.end_time) {
                    const startFloor = new Date(Math.max(s.start_time.getTime(), cycleBounds.start.getTime()));
                    actualKt = Math.floor(Math.max(0, new Date().getTime() - startFloor.getTime()) / 60000);
                }

                dStat.total_kt += actualKt;
                if (s.category?.category_type === 'primary') {
                    dStat.primary_kt += actualKt;
                    dStat.has_primary = true;
                } else if (s.category?.category_type === 'scattered') {
                    dStat.scattered_kt += actualKt;
                }
            });

            // Calculate aggregated metrics
            let totalPrimary = 0;
            let totalConstructed = 0;
            let sovereignCount = 0;
            let bestDay = { date: '', score: -1, tag: '' };
            let worstDay = { date: '', score: 101, tag: '' };
            let averageAccumulator = 0;
            let totalValidDays = 0;

            dailyStats.forEach((stats, dateStr) => {
                // Safety Cap per day per specification
                stats.total_kt = Math.min(stats.total_kt, 1440);
                stats.primary_kt = Math.min(stats.primary_kt, 1440);
                stats.scattered_kt = Math.min(stats.scattered_kt, 1440);

                totalPrimary += stats.primary_kt;
                totalConstructed += stats.total_kt;

                if (stats.has_primary && stats.total_kt >= 120) {
                    sovereignCount++;
                }

                const consciousBase = stats.primary_kt + stats.scattered_kt;
                const score = consciousBase > 0 ? (stats.primary_kt / consciousBase) * 100 : 0;

                // ONLY calculate days where they logged KT to not drag down average
                if (stats.total_kt > 0) {
                    totalValidDays++;
                    averageAccumulator += score;

                    if (consciousBase > 0) { // Only judge best/worst on conscious intent days
                        if (score > bestDay.score) {
                            const foundTag = notesMap.get(dateStr);
                            bestDay = { date: dateStr, score, tag: foundTag ? String(foundTag) : '' };
                        }
                        if (score < worstDay.score && score > 0) {
                            const foundTag = notesMap.get(dateStr);
                            worstDay = { date: dateStr, score, tag: foundTag ? String(foundTag) : '' };
                        }
                    }
                }
            });

            const avgScore = totalValidDays > 0 ? (averageAccumulator / totalValidDays) : 0;

            return {
                averageScore: avgScore,
                totalPrimary,
                totalRecorded: totalConstructed,
                sovereignDays: sovereignCount,
                bestDay: bestDay.date ? {
                    date: bestDay.date,
                    score: bestDay.score,
                    tag: bestDay.tag || ''
                } : null,
                worstDay: worstDay.date && worstDay.score < 101 ? {
                    date: worstDay.date,
                    score: worstDay.score,
                    tag: worstDay.tag || ''
                } : null,
                daysAnalyzed: totalValidDays
            };
        };

        // Filter arrays for timeframe
        const weeklySessions = sessions.filter(s => s.start_time.getTime() >= weekStart.getTime() && s.start_time.getTime() <= weekEnd.getTime());

        // Month filter (strictly matching the IST calendar month YYYY-MM)
        const currentYear = istDate.getUTCFullYear();
        const currentMonth = istDate.getUTCMonth();

        const monthlySessions = sessions.filter(s => {
            const cycleBounds = getCycleBoundaries(s.start_time, dayStartTime);
            const shiftMs = (5.5 * 60 * 60 * 1000);
            const sIst = new Date(cycleBounds.start.getTime() + shiftMs);
            return sIst.getUTCFullYear() === currentYear && sIst.getUTCMonth() === currentMonth;
        });

        // Generate reports
        const weeklyReport = processRange(weeklySessions);
        const monthlyReport = processRange(monthlySessions);

        return NextResponse.json({
            weekly: weeklyReport,
            monthly: monthlyReport
        });

    } catch (error) {
        console.error('Sovereignty Report API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch report data' }, { status: 500 });
    }
}
