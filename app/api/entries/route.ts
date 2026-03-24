import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/verifyAuth';
import { getCycleBoundaries, getCycleDate } from '@/lib/utils/cycle';

export async function GET(req: Request) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { day_start_time: true }
        });

        const dayStartTime = user?.day_start_time || "06:00";
        const cycle = getCycleBoundaries(new Date(), dayStartTime);

        const entries = await prisma.session.findMany({
            where: {
                user_id: userId,
                category_type: { not: null },
                start_time: {
                    gte: cycle.start,
                    lte: cycle.end
                }
            },
            orderBy: {
                start_time: 'desc'
            }
        });

        return NextResponse.json({ entries });
    } catch (error) {
        console.error('Entries GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { title, kt_value, category } = await req.json();

        // Need user to determine day_start_time
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { day_start_time: true }
        });
        const dayStartTime = user?.day_start_time || "06:00";

        if (!title || !kt_value || !category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const now = new Date();

        const duration_val = Number(kt_value);
        if (duration_val > 1440) {
            throw new Error(`Session duration ${duration_val} exceeds maximum cycle length of 1440 minutes. Use splitSessionByCycles before saving.`);
        }

        const session = await prisma.session.create({
            data: {
                user_id: userId,
                title,
                duration_minutes: duration_val,
                category_type: category, // "primary", "essential", "scattered"
                start_time: now,
                end_time: now,
                date: getCycleDate(now, dayStartTime)
            }
        });

        return NextResponse.json({ session }, { status: 201 });
    } catch (error) {
        console.error('KT Entry Error:', error);
        return NextResponse.json({ error: 'Failed to create KT entry' }, { status: 500 });
    }
}
