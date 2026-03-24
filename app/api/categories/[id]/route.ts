import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/verifyAuth';

export const dynamic = 'force-dynamic';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const resolvedParams = await Promise.resolve(params);
        const categoryId = resolvedParams.id;

        if (!categoryId) {
            return NextResponse.json({ error: 'Missing Category ID' }, { status: 400 });
        }

        // 1. Close any active session for this category
        const activeSession = await prisma.session.findFirst({
            where: { user_id: userId, category_id: categoryId, end_time: null }
        });

        if (activeSession) {
            const now = new Date();
            const duration = Math.max(0, Math.floor((now.getTime() - activeSession.start_time.getTime()) / 60000));
            
            if (duration > 1440) {
              throw new Error('Session exceeds 1440 minutes. splitSessionByCycles must be called before saving.');
            }

            await prisma.session.update({
                where: { id: activeSession.id },
                data: { end_time: now, duration_minutes: duration }
            });
        }

        // 2. Delete the category (Cascade not explicitly needed if dependent relation fails, SQLite might enforce FK. 
        // We might need to delete sessions associated with it, or maybe just delete the category.
        // Wait, SQLite will throw Constraint failure if sessions exist. 
        // It's safer to delete sessions or cascade. Let's delete related sessions first or targets.
        await prisma.session.deleteMany({
            where: { category_id: categoryId }
        });

        await prisma.target.deleteMany({
            where: { category_id: categoryId }
        });

        await prisma.category.delete({
            where: { id: categoryId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete category error:', error);
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const resolvedParams = await Promise.resolve(params);
        const categoryId = resolvedParams.id;

        if (!categoryId) {
            return NextResponse.json({ error: 'Missing Category ID' }, { status: 400 });
        }

        const { name, emoji, category_type } = await req.json();

        const existingCategory = await prisma.category.findFirst({
            where: { id: categoryId, user_id: userId }
        });

        if (!existingCategory) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        let updatedCategoryType = category_type;
        if (existingCategory.is_default && category_type !== existingCategory.category_type) {
            updatedCategoryType = existingCategory.category_type;
        }

        const updatedCategory = await prisma.category.update({
            where: { id: categoryId },
            data: {
                name: name !== undefined ? name : existingCategory.name,
                emoji: emoji !== undefined ? emoji : existingCategory.emoji,
                category_type: updatedCategoryType !== undefined ? updatedCategoryType : existingCategory.category_type
            }
        });

        return NextResponse.json({ category: updatedCategory });
    } catch (error) {
        console.error('Update category error:', error);
        return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }
}
