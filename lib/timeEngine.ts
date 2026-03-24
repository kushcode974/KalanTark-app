import { prisma } from '@/lib/prisma';
import { getCycleBoundaries, getCycleDate } from './utils/cycle';

/**
 * Ensures that if an active session has crossed the `day_start_time` cycle boundary,
 * it is automatically cut exactly at the boundary.
 * Note: Deprecated in favor of the live polling rewrite matching the splitSessionByCycles architecture,
 * but kept for backward compatibility if needed.
 */
export async function enforceCycleBoundaries(userId: string, dayStartTime: string) {
    const cycle = getCycleBoundaries(new Date(), dayStartTime);

    // Check if there's an active session
    const activeSession = await prisma.session.findFirst({
        where: { user_id: userId, end_time: null }
    });

    if (!activeSession) return;

    // If the session started strictly BEFORE the current active cycle's start time,
    // It means it crossed the line and needs to be split!
    if (activeSession.start_time.getTime() < cycle.start.getTime()) {
        const boundaryTime = new Date(cycle.start); // The exact millisecond the new cycle started

        // 1. Close the previous session exactly at boundaryTime (Seal the cycle immutably)
        const previousDuration = Math.max(0, Math.floor((boundaryTime.getTime() - activeSession.start_time.getTime()) / 60000));

        if (previousDuration > 1440) {
            throw new Error(`Refusing to save session with duration ${previousDuration} > 1440. Use splitSessionByCycles first.`);
        }

        await prisma.session.update({
            where: { id: activeSession.id },
            data: {
                end_time: boundaryTime,
                duration_minutes: previousDuration
            }
        });

        // 2. Start a new session in the current cycle continuing the exact same section
        await prisma.session.create({
            data: {
                user_id: userId,
                category_id: activeSession.category_id,
                start_time: boundaryTime,
                date: getCycleDate(boundaryTime, dayStartTime)
            }
        });

        // Recursive check in case they've been gone for 48 hours
        await enforceCycleBoundaries(userId, dayStartTime);
    }
}

/**
 * Splits a continuous session block into multiple strictly cycle-bound intervals.
 * Resolves the issue where a session left open across days yields > 1440 minutes.
 * 
 * @returns Array of splits { cycleDate, startTime, endTime, durationMinutes }
 */
export function splitSessionByCycles(
    startTime: Date,
    endTime: Date,
    dayStartTime: string,
    timezone?: string
): Array<{ cycleDate: Date, startTime: Date, endTime: Date, durationMinutes: number }> {
    const splits = [];

    // Safety constraint inside the split loop: if we loop somehow infinitely, prevent memory lock
    let currentStart = new Date(startTime);
    let maxIterations = 1000; 

    while (currentStart < endTime && maxIterations-- > 0) {
        // Find the cycle boundary that 'currentStart' belongs to
        // If timezone logic is ever expanded in getCycleBoundaries, pass timezone here
        const boundaries = getCycleBoundaries(currentStart, dayStartTime);
        const cycleDate = getCycleDate(currentStart, dayStartTime);

        let currentEnd: Date;
        if (endTime.getTime() <= boundaries.end.getTime()) {
            currentEnd = new Date(endTime);
        } else {
            // Get the NEXT cycle's start by calling getCycleBoundaries on a time just after current cycle ends
            const nextCycleStart = new Date(boundaries.end.getTime() + 1);
            const nextBoundaries = getCycleBoundaries(nextCycleStart, dayStartTime);
            currentEnd = nextBoundaries.start;
        }

        const durationMs = currentEnd.getTime() - currentStart.getTime();
        const durationMinutes = Math.max(0, Math.floor(durationMs / 60000));

        // Part 1 requirement: throw error if any single split exceeds 1440 minutes
        if (durationMinutes > 1440) {
            throw new Error(`Split calculation generated a duration strictly larger than 1440 mins (${durationMinutes}m). Start: ${currentStart.toISOString()}, End: ${currentEnd.toISOString()}`);
        }

        splits.push({
            cycleDate,
            startTime: currentStart,
            endTime: currentEnd,
            durationMinutes
        });

        currentStart = new Date(currentEnd); // Advance
    }

    if (maxIterations <= 0) {
        throw new Error(`splitSessionByCycles hit infinite loop guard. StarTime=${startTime.toISOString()}, EndTime=${endTime.toISOString()}`);
    }

    return splits;
}
