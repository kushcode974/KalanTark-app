import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { loginSchema } from '@/lib/validations';

export async function POST(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const limit = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
        if (!limit.success) {
            return NextResponse.json({ error: 'Too many login attempts. Please wait 15 minutes.' }, { status: 429 });
        }

        const body = await req.json();
        const validation = loginSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }
        const { email, password } = validation.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { last_login: new Date() },
        });

        const token = signToken({ userId: user.id });

        return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email }, token });
    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
