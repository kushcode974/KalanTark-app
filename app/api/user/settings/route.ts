import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/verifyAuth';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // @ts-ignore - Prisma type issue due to pending_email not generated yet
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true, name: true, email: true, pending_email: true,
                day_start_time: true, timezone: true,
                streak: {
                    select: {
                        is_enabled: true,
                        target_kt: true,
                        category_id: true,
                        current_streak: true,
                        longest_streak: true
                    }
                }
            }
        });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json(user);
    } catch (error) {
        console.error('Settings API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const payload = await req.json();
        const { action, name, email, currentPassword, newPassword } = payload;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        if (action === 'update_name') {
            if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
            // @ts-ignore
            const updated = await prisma.user.update({
                where: { id: userId },
                data: { name },
                select: { id: true, name: true, email: true, pending_email: true }
            });
            return NextResponse.json(updated);
        }

        if (action === 'request_email_change') {
            if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

            // Check if email is already taken
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 });

            // @ts-ignore
            const updated = await prisma.user.update({
                where: { id: userId },
                data: { pending_email: email },
                select: { id: true, name: true, email: true, pending_email: true }
            });

            // In a real app, send verification email here
            // For the prototype, we just set the state to simulate "Awaiting Confirmation"
            return NextResponse.json({ message: 'Verification email sent', user: updated });
        }

        if (action === 'update_password') {
            if (!currentPassword || !newPassword) return NextResponse.json({ error: 'Missing passwords' }, { status: 400 });

            const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isMatch) return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 });

            const newHash = await bcrypt.hash(newPassword, 10);
            await prisma.user.update({
                where: { id: userId },
                data: { password_hash: newHash }
            });

            return NextResponse.json({ message: 'Password updated securely' });
        }

        if (action === 'update_time_cycle') {
            const { day_start_time, timezone } = payload;
            const updated = await prisma.user.update({
                where: { id: userId },
                data: { day_start_time, timezone }
            });
            return NextResponse.json({ message: 'Time cycle updated', user: updated });
        }

        if (action === 'update_streak_settings') {
            const { is_enabled, target_kt, category_id } = payload;
            const updated = await prisma.streak.upsert({
                where: { user_id: userId },
                update: { is_enabled, target_kt, category_id: category_id || null },
                create: { user_id: userId, is_enabled, target_kt, category_id: category_id || null }
            });
            return NextResponse.json({ message: 'Streak settings updated', streak: updated });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Settings API Error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const userId = getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Cascading deletes for user (Categories, Targets, Sessions, Streak)
        await prisma.streak.deleteMany({ where: { user_id: userId } });
        await prisma.session.deleteMany({ where: { user_id: userId } });
        await prisma.target.deleteMany({ where: { user_id: userId } });
        await prisma.category.deleteMany({ where: { user_id: userId } });
        await prisma.user.delete({ where: { id: userId } });

        return NextResponse.json({ message: 'Account permanently eradicated' });
    } catch (error) {
        console.error('Delete Account API Error:', error);
        return NextResponse.json({ error: 'Failed to decimate account' }, { status: 500 });
    }
}
