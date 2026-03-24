import { User } from '@prisma/client';

/**
 * Calculates the current CycleStart and CycleEnd for a user based on their `day_start_time`.
 * `day_start_time` is expected to be in "HH:MM" 24-hour format.
 *
 * Example: `day_start_time` = "06:00"
 * - If current time is 05:00 AM on March 3rd, CycleStart is 06:00 AM March 2nd. End is 05:59:59 AM March 3rd.
 * - If current time is 08:00 AM on March 3rd, CycleStart is 06:00 AM March 3rd. End is 05:59:59 AM March 4th.
 *
 * @param date - The Date object to calculate the cycle for (defaults to currently now).
 * @param dayStartTime - The "HH:MM" string. Defaults to "06:00".
 * @returns An object with `start` and `end` Dates representing the Cycle boundaries.
 */
export function getCycleBoundaries(date: Date = new Date(), dayStartTime: string = "06:00") {
    // dayStartTime is the user's local IST preference (e.g. "07:00")
    const localStartHour = parseInt(dayStartTime.split(':')[0], 10) || 6;
    const localStartMinute = parseInt(dayStartTime.split(':')[1], 10) || 0;

    const IST_OFFSET_HOURS = 5;
    const IST_OFFSET_MINUTES = 30;

    // Shift to actual UTC Server Boundary
    let utcStartHour = localStartHour - IST_OFFSET_HOURS;
    let utcStartMinute = localStartMinute - IST_OFFSET_MINUTES;

    if (utcStartMinute < 0) {
        utcStartMinute += 60;
        utcStartHour -= 1;
    }
    if (utcStartHour < 0) {
        utcStartHour += 24;
    }

    const cycleStart = new Date(date);
    cycleStart.setUTCHours(utcStartHour, utcStartMinute, 0, 0);

    // If the evaluated date's ms timestamp resides BEFORE this strict UTC boundary for today,
    // then it physically belongs to yesterday's cycle.
    if (date.getTime() < cycleStart.getTime()) {
        cycleStart.setUTCDate(cycleStart.getUTCDate() - 1);
    }

    // End is 1ms before the NEXT cycle starts
    const cycleEnd = new Date(cycleStart);
    cycleEnd.setUTCDate(cycleEnd.getUTCDate() + 1);
    cycleEnd.setTime(cycleEnd.getTime() - 1);

    return {
        start: cycleStart,
        end: cycleEnd
    };
}

/**
 * Returns the exact calendar Date representing the day this cycle belongs to.
 * All time components will be zeroed out (00:00:00.000).
 *
 * Example (dayStartTime 21:00):
 * - March 4th 10:00 PM -> Returns March 4th 00:00
 * - March 5th 05:00 AM -> Returns March 4th 00:00 (because it's technically still part of the cycle that started on March 4th)
 * - March 5th 09:30 PM -> Returns March 5th 00:00
 */
export function getCycleDate(date: Date, dayStartTime: string): Date {
    const cycleBoundaries = getCycleBoundaries(date, dayStartTime);

    // We must label the cycle using the Date the cycle opened IN IST TIME to ensure
    // the label exactly matches what the user expects.
    // E.g., UTC Start could be March 5th 00:30Z (which aligns to IST March 5th 06:00)
    // We add back the 5h 30m just so the UTC string says 06:00, pinning it safely over midnight into the target calendar day.
    const timezoneShiftedForLabel = new Date(cycleBoundaries.start.getTime() + (5.5 * 60 * 60 * 1000));

    // The date representing the entire cycle is that IST-aligned label, mathematically zeroed out to 00:00:00.000Z in the DB
    const cycleDate = new Date(timezoneShiftedForLabel);
    cycleDate.setUTCHours(0, 0, 0, 0);

    return cycleDate;
}
