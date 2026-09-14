import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getProgressSnapshot } from '../progress';

describe('Progress & Streaks Analytics Engine', () => {
  const DEFAULT_USER_ID = 'user_default';
  
  beforeEach(async () => {
    // Ensure default user exists
    await prisma.user.upsert({
      where: { id: DEFAULT_USER_ID },
      create: { id: DEFAULT_USER_ID, name: 'Test User' },
      update: {}
    });

    // Clear tracking artifacts
    await prisma.focusSession.deleteMany({ where: { userId: DEFAULT_USER_ID } });
    await prisma.task.deleteMany({ where: { userId: DEFAULT_USER_ID } });
    await prisma.interviewAttempt.deleteMany({ where: { userId: DEFAULT_USER_ID } });
    await prisma.journalEntry.deleteMany({ where: { userId: DEFAULT_USER_ID } });
  });

  it('calculates streaks with tolerance for non-active dates retaining longest consecutive sequence', async () => {
    // Scaffold diverse historical activity
    // Days act as:
    // ... Ago: [ -6,  -5, -4,    -2, -1, 0 (Today)]
    // Activity:[ Yes, Yes, Yes,  Yes, Yes, Yes ] => Longest will be 3, Current is 3

    // Let's create journals spanning random times to mimic activity
    const activityMapStr = [
      '2026-09-02', '2026-09-03', '2026-09-04', // 3 Consecutive
      '2026-09-06', '2026-09-07',               // 2 Consecutive
      '2026-09-09'                              // 1 Isolated (Assume today)
    ];

    for (const dt of activityMapStr) {
      await prisma.journalEntry.create({
        data: {
          userId: DEFAULT_USER_ID,
          entryDate: dt,
          wentWell: 'Test'
        }
      });
    }

    // Pass the isolated today date manually via vitest time manipulation context theoretically,
    // but the getProgressSnapshot statically derives "Today" from system clock.
    // Instead of forcing getProgressSnapshot to accept `todayStr` argument, we'll
    // rely on Prisma insertion dates spanning today physically in actual system time.

    // Let's seed activity dynamically backwards from today using actual native Dates!
    await prisma.journalEntry.deleteMany({ where: { userId: DEFAULT_USER_ID } });

    const todayDate = new Date(); // Actual system time right now

    // Helper builder for n days ago string natively
    const daysAgoString = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
    };

    const targetMap = [
      daysAgoString(6), daysAgoString(5), daysAgoString(4), // Longest Streak = 3
      daysAgoString(2), daysAgoString(1), daysAgoString(0)  // Current Streak = 3 (Today included)
    ];

    for (const dt of targetMap) {
      await prisma.journalEntry.create({
        data: { userId: DEFAULT_USER_ID, entryDate: dt, wentWell: 'Test Target' }
      });
    }

    const snap: any = await getProgressSnapshot('Asia/Kolkata');
    expect(snap.success).toBe(true);

    const { currentStreak, longestStreak, totalActive } = snap.data.streaks;
    expect(totalActive).toBe(6);
    expect(currentStreak).toBe(3); 
    expect(longestStreak).toBe(3);
  });

  it('snaps current streak to 0 gracefully without punishing longest historical log if inactivity clears yesterday', async () => {
    // Helper builder for n days ago string natively
    const daysAgoString = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
    };

    // 4 days of immense tracking in the distant past (Longest Streak = 4)
    // 0 tracking yesterday or today (Current = 0)
    const targetMap = [
      daysAgoString(10), daysAgoString(9), daysAgoString(8), daysAgoString(7)
    ];

    for (const dt of targetMap) {
      await prisma.journalEntry.create({
        data: { userId: DEFAULT_USER_ID, entryDate: dt, wentWell: 'Test Target Legacy' }
      });
    }

    const snap: any = await getProgressSnapshot('Asia/Kolkata');
    
    const { currentStreak, longestStreak, totalActive } = snap.data.streaks;
    expect(totalActive).toBe(4);
    expect(longestStreak).toBe(4);
    expect(currentStreak).toBe(0); // Safely mapped to string 0 due to yesterday and today being totally empty!
  });
});
