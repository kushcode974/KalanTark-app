import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { registerSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const limit = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
        if (!limit.success) {
            return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 });
        }

        const body = await req.json();
        const validation = registerSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }
        const { name, email, password } = validation.data;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password_hash: hashedPassword,
            },
        });

        const token = signToken({ userId: user.id });

        return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email }, token });
    } catch (error) {
        console.error('Registration Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
