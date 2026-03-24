import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/verifyAuth';
import { categorySchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const validation = categorySchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }
        
        const { name, emoji, color, category_type } = validation.data;

        if (!name || !emoji || !color || !category_type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const category = await prisma.category.create({
            data: {
                user_id: userId,
                name,
                emoji,
                color,
                category_type
            }
        });

        return NextResponse.json({ category }, { status: 201 });
    } catch (error) {
        console.error('Category Creation Error:', error);
        return NextResponse.json({ error: 'Failed to create KT Section' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const categories = await prisma.category.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'asc' }
        });

        return NextResponse.json({ categories });
    } catch (error) {
        console.error('Categories GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch KT Sections' }, { status: 500 });
    }
}
