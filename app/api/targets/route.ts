import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/verifyAuth';

// Create a new target
export async function POST(req: Request) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { category_id, target_minutes, period_type } = await req.json();

        if (!target_minutes || !period_type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const target = await prisma.target.create({
            data: {
                user_id: userId,
                category_id: category_id || null, // null = global KT target
                target_minutes,
                period_type,
            },
        });

        return NextResponse.json(target);
    } catch (error) {
        console.error('Target API Error:', error);
        return NextResponse.json({ error: 'Failed to create target' }, { status: 500 });
    }
}

// Get all targets for user
export async function GET(req: Request) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const targets = await prisma.target.findMany({
            where: { user_id: userId },
            include: { category: true },
        });

        return NextResponse.json(targets);
    } catch (error) {
        console.error('Target API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch targets' }, { status: 500 });
    }
}
