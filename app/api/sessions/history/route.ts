import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/verifyAuth';
import { getCycleDate, getCycleBoundaries } from '@/lib/utils/cycle';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { day_start_time: true }
        });

        const dayStartTime = user?.day_start_time || "06:00";

        const sessions = await prisma.session.findMany({
            where: { user_id: userId, end_time: { not: null } },
            include: { category: true },
            orderBy: { start_time: 'desc' },
            take: 1000,
        });

        // Group into Sovereign Cycles
        const cycles: Record<string, { dateObj: Date; total: number; categories: Record<string, any> }> = {};

        sessions.forEach(session => {
            if (!session.category) return;

            // Retrieve the exact calendar date (00:00:00) this session belongs to
            const cycleDateObj = getCycleDate(session.start_time, dayStartTime);

            // Format as YYYY-MM-DD for grouping key
            const cycleId = cycleDateObj.toISOString().split('T')[0];
            console.log(`[DEBUG] Session: ${session.start_time.toISOString()} -> Cycle ID: ${cycleId}`);

            if (!cycles[cycleId]) {
                cycles[cycleId] = {
                    dateObj: cycleDateObj,
                    total: 0,
                    categories: {}
                };
            }

            const catId = session.category.id;
            if (!cycles[cycleId].categories[catId]) {
                const catData = session.category as any;
                cycles[cycleId].categories[catId] = {
                    name: catData.name,
                    emoji: catData.emoji,
                    color: catData.color,
                    category_type: catData.category_type,
                    total_kt: 0,
                    sessions: []
                };
            }

            const kt = session.duration_minutes || 0;
            cycles[cycleId].categories[catId].total_kt += kt;
            cycles[cycleId].total += kt;

            cycles[cycleId].categories[catId].sessions.push({
                start: session.start_time,
                end: session.end_time,
                kt: kt
            });
        });

        // Convert to array and sort descending by date
        const result = Object.entries(cycles).map(([cycleDate, data]) => {
            // Generate the display range strings dynamically from the official cycle boundaries
            const bounds = getCycleBoundaries(data.dateObj, dayStartTime);

            // Format the range: e.g. "09:00 PM - 08:59 AM"
            const startD = bounds.start;
            const endD = bounds.end;

            // Sort the categories by total_kt desc, and within each category sort sessions chronologically asc
            const sortedCategories = Object.values(data.categories).map((cat: any) => {
                cat.sessions.sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());
                return cat;
            }).sort((a: any, b: any) => b.total_kt - a.total_kt);

            // Display date shifted strictly to IST visually
            const totalKTBounded = Math.min(data.total, 1440);
            
            return {
                cycleDate,
                dateDisplay: data.dateObj.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: 'long', day: 'numeric', year: 'numeric' }),
                rangeDisplay: `${startD.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} - ${endD.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}`,
                totalKT: totalKTBounded,
                categories: sortedCategories
            };
        }).sort((a, b) => b.cycleDate.localeCompare(a.cycleDate));

        return NextResponse.json(result);
    } catch (error) {
        console.error('History API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
