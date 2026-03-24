import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/verifyAuth';

export async function GET(request: Request, context: { params: Promise<{ date: string }> | { date: string } }) {
    try {
        const userId = getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Await the params to handle different Next.js routing versions
        const rawParams = context.params;
        const params = rawParams instanceof Promise ? await rawParams : rawParams;
        const date = params.date;

        const note = await prisma.cycleNote.findUnique({
            where: {
                user_id_cycle_date: {
                    user_id: userId,
                    cycle_date: date,
                }
            }
        });

        return NextResponse.json({ note: note?.note || null });
    } catch (err: any) {
        console.error('Error fetching cycle note:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request, context: { params: Promise<{ date: string }> | { date: string } }) {
    try {
        const userId = getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rawParams = context.params;
        const params = rawParams instanceof Promise ? await rawParams : rawParams;
        const date = params.date;

        const body = await request.json();

        // Enforce validations
        let rawNote = '';
        if (typeof body.note === 'string') {
            rawNote = body.note;
        }

        const trimmedNote = rawNote.trim();
        const finalNote = trimmedNote.slice(0, 120);

        const upsertedNote = await prisma.cycleNote.upsert({
            where: {
                user_id_cycle_date: {
                    user_id: userId,
                    cycle_date: date,
                }
            },
            update: {
                note: finalNote,
            },
            create: {
                user_id: userId,
                cycle_date: date,
                note: finalNote,
            }
        });

        return NextResponse.json({ note: upsertedNote.note });

    } catch (err: any) {
        console.error('Error upserting cycle note:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
