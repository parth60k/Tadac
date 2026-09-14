'use server';

import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/errors';
import { todayDate, addDays } from '@/lib/date';

const DEFAULT_USER_ID = 'user_default';

/**
 * Calculates current streak, longest streak, and total active days
 * from a unified set of date strings.
 */
function computeStreaks(activeDatesStr: string[], todayStr: string) {
  // Deduplicate and sort chronologically
  const uniqueDates = Array.from(new Set(activeDatesStr)).sort();
  const totalActive = uniqueDates.length;

  let currentStreak = 0;
  let longestStreak = 0;

  if (totalActive === 0) {
    return { currentStreak, longestStreak, totalActive };
  }

  // Iterate to find longest streak
  let tempStreak = 1;
  let runningMax = 1;
  
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = uniqueDates[i - 1];
    const curr = uniqueDates[i];
    
    // Check if curr is exactly prev + 1 day
    if (curr === addDays(prev, 1)) {
      tempStreak++;
    } else {
      if (tempStreak > runningMax) runningMax = tempStreak;
      tempStreak = 1;
    }
  }
  if (tempStreak > runningMax) runningMax = tempStreak;
  longestStreak = runningMax;

  // Calculate current streak specifically scanning backwards from today (or yesterday)
  const yesterdayStr = addDays(todayStr, -1);
  const activeSet = new Set(uniqueDates);

  if (activeSet.has(todayStr)) {
    // Current streak includes today
    currentStreak = 1;
    let checkDate = yesterdayStr;
    while (activeSet.has(checkDate)) {
      currentStreak++;
      checkDate = addDays(checkDate, -1);
    }
  } else if (activeSet.has(yesterdayStr)) {
    // Current streak includes yesterday but user hasn't acted yet today
    currentStreak = 1;
    let checkDate = addDays(yesterdayStr, -1);
    while (activeSet.has(checkDate)) {
      currentStreak++;
      checkDate = addDays(checkDate, -1);
    }
  } else {
    // Streak broken (missed yesterday and today)
    currentStreak = 0;
  }

  return { currentStreak, longestStreak, totalActive };
}

export async function getProgressSnapshot(timezone: string) {
  return withErrorHandling(async () => {
    const todayStr = todayDate(timezone);

    // Fetch unified active dates
    // 1. Focus Sessions (derive local date string from start time)
    const focusSessions = await prisma.focusSession.findMany({
      where: { userId: DEFAULT_USER_ID, status: 'completed' },
      select: { createdAt: true, actualMins: true }
    });
    // Formatter using node Intl
    const activeDates: string[] = [];
    const focusWeekBins: Record<string, number> = {}; 

    // We only care about the last 7 days for the chart
    const sevenDaysAgoStr = addDays(todayStr, -6); // 7 days inclusive

    focusSessions.forEach(f => {
      const localDateStr = f.createdAt.toLocaleDateString('en-CA', { timeZone: timezone });
      activeDates.push(localDateStr);
      
      if (localDateStr >= sevenDaysAgoStr && localDateStr <= todayStr) {
        focusWeekBins[localDateStr] = (focusWeekBins[localDateStr] || 0) + f.actualMins;
      }
    });

    // 2. Tasks Completed
    const completedTasks = await prisma.task.findMany({
      where: { userId: DEFAULT_USER_ID, completed: true },
      select: { scheduledDate: true }
    });
    completedTasks.forEach(t => activeDates.push(t.scheduledDate));

    // 3. Interview Attempts
    const interviews = await prisma.interviewAttempt.findMany({
      where: { userId: DEFAULT_USER_ID },
      select: { attemptDate: true }
    });
    interviews.forEach(i => activeDates.push(i.attemptDate));

    // 4. Journals
    const journals = await prisma.journalEntry.findMany({
      where: { userId: DEFAULT_USER_ID },
      select: { entryDate: true }
    });
    journals.forEach(j => activeDates.push(j.entryDate));

    // 5. Revision Checkpoints
    // (Checkpoints don't store exact completed timestamp precisely enough as a YYYY-MM-DD string,
    // they store `dueDate` but `completedAt` is DateTime. We'll use completedAt).
    const revisions = await prisma.revisionCheckpoint.findMany({
      where: { status: 'COMPLETED', completedAt: { not: null } },
      select: { completedAt: true }
    });
    revisions.forEach(r => {
       const localDateStr = r.completedAt!.toLocaleDateString('en-CA', { timeZone: timezone });
       activeDates.push(localDateStr);
    });

    const streaks = computeStreaks(activeDates, todayStr);

    // Calculate chart data specifically keeping zeroes for empty days
    const chartData = [];
    let currentIter = sevenDaysAgoStr;
    const daysArr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // We do exactly 7 dots (from 6 days ago up to today)
    for (let i = 0; i < 7; i++) {
        const val = focusWeekBins[currentIter] || 0;
        // Find day of week for label
        const dt = new Date(`${currentIter}T12:00:00Z`); // Roughly safely in middle to get day index
        const dayLabel = daysArr[dt.getUTCDay()];
        
        chartData.push({ dateStr: currentIter, label: dayLabel, value: val });
        currentIter = addDays(currentIter, 1);
    }

    // High level totals
    const totalSessions = focusSessions.length;
    const totalRevs = revisions.length;
    const totalInterviews = interviews.length;
    const totalTasks = completedTasks.length;

    return {
      streaks,
      chartData,
      totals: {
        totalSessions,
        totalRevs,
        totalInterviews,
        totalTasks
      }
    };
  });
}
