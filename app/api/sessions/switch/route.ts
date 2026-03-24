import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/verifyAuth';
import { splitSessionByCycles } from '@/lib/timeEngine';
import { getCycleDate } from '@/lib/utils/cycle';
import { sessionSchema } from '@/lib/validations';

export async function POST(req: Request) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const validation = sessionSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }
        const { category_id } = validation.data;

        // Retrieve user day_start_time
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { day_start_time: true }
        });
        const dayStartTime = user?.day_start_time || "06:00";

        // 1. Find ALL active sessions — guard against illegal multi-active state
        const activeSessions = await prisma.session.findMany({
            where: { user_id: userId, end_time: null },
            include: { category: true },
            orderBy: { start_time: 'desc' }
        });

        // If multiple active sessions exist — illegal state, fix immediately
        if (activeSessions.length > 1) {
            const now = new Date();
            // Keep the most recent one (index 0), close all older ones
            for (let i = 1; i < activeSessions.length; i++) {
                const ghost = activeSessions[i];
                try {
                    const splits = splitSessionByCycles(ghost.start_time, now, dayStartTime, undefined); // timezone handled at switch level later if needed
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
                    console.error(`Failed to split ghost session ${ghost.id}, deleting:`, err);
                    await prisma.session.delete({ where: { id: ghost.id } });
                }
            }
        }

        let activeSession = activeSessions[0] || null;

        const now = new Date();

        if (activeSession) {
            // Already active on the same section? Do nothing.
            if (activeSession.category_id === category_id) {
                return NextResponse.json({ session: activeSession });
            }

            // Close the previous session using correct boundary splits
            const userFull = await prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
            const splits = splitSessionByCycles(activeSession.start_time, now, dayStartTime, userFull?.timezone || undefined);

            if (splits.length > 0) {
                // Update original active session with the first split
                const firstSplit = splits[0];
                if (firstSplit.durationMinutes > 1440) {
                    throw new Error(`Refusing to save session with duration ${firstSplit.durationMinutes} > 1440. Use splitSessionByCycles first.`);
                }
                await prisma.session.update({
                    where: { id: activeSession.id },
                    data: {
                        end_time: firstSplit.endTime,
                        duration_minutes: firstSplit.durationMinutes
                    }
                });

                // Create any additional boundary-crossed splits as firmly closed historical sessions
                for (let i = 1; i < splits.length; i++) {
                    const split = splits[i];
                    if (split.durationMinutes > 1440) {
                        throw new Error(`Refusing to save session with duration ${split.durationMinutes} > 1440. Use splitSessionByCycles first.`);
                    }
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
            }
        }

        let newSession = null;
        if (category_id) {
            // Fetch category to get category_type
            const category = await prisma.category.findUnique({
                where: { id: category_id }
            });

            newSession = await prisma.session.create({
                data: {
                    user_id: userId,
                    category_id,
                    category_type: category?.category_type || 'primary',
                    start_time: now,
                    date: getCycleDate(now, dayStartTime), // Normalizes night-time sessions
                }
            });
        }

        return NextResponse.json({ session: newSession });
    } catch (error) {
        console.error('Switch engine error:', error);
        return NextResponse.json({ error: 'Failed to switch section' }, { status: 500 });
    }
}
