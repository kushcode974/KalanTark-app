import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/verifyAuth';
import { getMilestone, MILESTONES } from '@/lib/utils/milestone';
import { getCycleBoundaries } from '@/lib/utils/cycle';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, streak: true }
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Query Session table directly using category_type column
        const stats = await prisma.session.groupBy({
            by: ['category_type'],
            where: { user_id: userId, end_time: { not: null } },
            _sum: { duration_minutes: true }
        });

        const totalResult = await prisma.session.aggregate({
            where: { user_id: userId, end_time: { not: null } },
            _sum: { duration_minutes: true }
        });

        // Fetch active session to inject live ticking
        const userWithSettings = await prisma.user.findUnique({ where: { id: userId }, select: { day_start_time: true } });
        const dayStartTime = userWithSettings?.day_start_time || "06:00";
        const cycle = getCycleBoundaries(new Date(), dayStartTime);
        
        const activeSession = await prisma.session.findFirst({
            where: { user_id: userId, end_time: null }
        });

        let activeDuration = 0;
        let activeType = null;
        
        if (activeSession) {
            const now = new Date();
            const startFloor = new Date(Math.max(activeSession.start_time.getTime(), cycle.start.getTime()));
            const diffMs = Math.max(0, now.getTime() - startFloor.getTime());
            activeDuration = Math.floor(diffMs / 60000);
            activeType = activeSession.category_type;
        }

        let totalKT = (totalResult._sum.duration_minutes || 0) + activeDuration;

        let primaryKT = 0;
        let essentialKT = 0;
        let scatteredKT = 0;

        stats.forEach(stat => {
            if (stat.category_type === 'primary') primaryKT = stat._sum.duration_minutes || 0;
            if (stat.category_type === 'essential') essentialKT = stat._sum.duration_minutes || 0;
            if (stat.category_type === 'scattered') scatteredKT = stat._sum.duration_minutes || 0;
        });

        // Add live ticking duration to its appropriate category
        if (activeType === 'primary') primaryKT += activeDuration;
        if (activeType === 'essential') essentialKT += activeDuration;
        if (activeType === 'scattered') scatteredKT += activeDuration;

        const currentMilestone = getMilestone(totalKT);

        // Find next milestone
        const milestoneIndex = MILESTONES.findIndex(m => m.name === currentMilestone.name);
        const nextMilestoneDb = milestoneIndex < MILESTONES.length - 1 ? MILESTONES[milestoneIndex + 1] : null;

        return NextResponse.json({
            totalKT,
            primaryKT,
            essentialKT,
            scatteredKT,
            currentMilestone: currentMilestone.name,
            nextMilestone: nextMilestoneDb ? nextMilestoneDb.name : null,
            nextMilestoneThreshold: nextMilestoneDb ? nextMilestoneDb.threshold : null,
            ktUntilNext: nextMilestoneDb ? nextMilestoneDb.threshold - totalKT : 0,
            currentStreak: (user as any).streak?.current_streak || 0,
            longestStreak: (user as any).streak?.longest_streak || 0,
            username: user.name
        });

    } catch (error) {
        console.error('Profile stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch profile stats' }, { status: 500 });
    }
}
