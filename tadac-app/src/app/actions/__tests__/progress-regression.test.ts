import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getProgressSnapshot } from '../progress';
import { ensureDefaultUser } from '@/lib/user';
import { todayDate, toLocalYYYYMMDD } from '@/lib/date';

describe('Progress Date Formatting', () => {
  it('deterministically formats Date to YYYY-MM-DD discarding node ICU localization differences', () => {
    const d = new Date('2026-05-12T15:30:00Z');
    const formattedIST = toLocalYYYYMMDD(d, 'Asia/Kolkata');
    expect(formattedIST).toBe('2026-05-12');
    
    const dLate = new Date('2026-05-12T23:30:00Z');
    const formattedISTLate = toLocalYYYYMMDD(dLate, 'Asia/Kolkata');
    expect(formattedISTLate).toBe('2026-05-13');

    const partsLength = formattedIST.split('-');
    expect(partsLength.length).toBe(3);
    
    const singleDigitDate = new Date('2026-01-05T12:00:00Z'); // Jan 5
    expect(toLocalYYYYMMDD(singleDigitDate, 'UTC')).toBe('2026-01-05');
  });

  it('validates lexical YYYY-MM-DD comparison', () => {
    expect('2026-05-12' >= '2026-05-06').toBe(true);
    expect('2026-05-01' <= '2026-05-06').toBe(true);
    expect('5/12/2026' <= '2026-05-12').toBe(false);
  });
});

describe('Progress Engine: Caching & Bounding', () => {
  beforeEach(async () => {
    await prisma.xpEvent.deleteMany();
    await prisma.revisionCheckpoint.deleteMany();
    await prisma.revisionItem.deleteMany();
    await prisma.interviewAttempt.deleteMany();
    await prisma.journalEntry.deleteMany();
    await prisma.task.deleteMany();
    await prisma.focusSession.deleteMany();
    await ensureDefaultUser();
  });

  afterEach(async () => {
    await prisma.xpEvent.deleteMany();
    await prisma.revisionCheckpoint.deleteMany();
    await prisma.revisionItem.deleteMany();
    await prisma.interviewAttempt.deleteMany();
    await prisma.journalEntry.deleteMany();
    await prisma.task.deleteMany();
    await prisma.focusSession.deleteMany();
  });

  it('computes isolated chart aggregations strictly for current timezone offsets', async () => {
    const tz = 'Asia/Kolkata';
    const localNow = todayDate(tz);

    await prisma.focusSession.create({
      data: {
        id: 'progress_test_f1',
        userId: 'user_default',
        status: 'completed',
        plannedMins: 45,
        actualMins: 45,
        xpAwarded: true,
        createdAt: new Date(),
        endedAt: new Date()
      }
    });

    const snap = await getProgressSnapshot(tz) as { success: boolean; data?: any };
    expect(snap.success).toBe(true);

    const chart = snap.data.chartData;
    expect(chart.length).toBe(7); // Last 7 days

    const todayData = chart.find((c: any) => c.dateStr === localNow);
    expect(todayData).toBeDefined();
    expect(todayData.value).toBe(45);
  });

  it('aggregates multiple entity boundaries simultaneously into total active days', async () => {
    const tz = 'Asia/Kolkata';
    const localNow = todayDate(tz);
    
    await prisma.task.create({
      data: {
        id: 'progress_test_t1',
        userId: 'user_default',
        title: 'Task Alpha',
        scheduledDate: localNow, 
        completed: true,
        completedAt: new Date()
      }
    });

    await prisma.interviewQuestion.create({
      data: {
        id: 'q_prog1',
        topic: 'Test',
        question: 'Progress?',
        answer: 'Yes'
      }
    });

    await prisma.interviewAttempt.create({
      data: {
        id: 'progress_test_i1',
        userId: 'user_default',
        questionId: 'q_prog1',
        attemptDate: localNow,
        userAnswer: 'Yes',
        correct: true
      }
    });

    const snap = await getProgressSnapshot(tz) as { success: boolean; data?: any };
    expect(snap.success).toBe(true);
    expect(snap.data.totals.totalTasks).toBe(1);
    expect(snap.data.totals.totalInterviews).toBe(1);
    expect(snap.data.streaks.totalActive).toBeGreaterThanOrEqual(1);
  });

  it('proves activity is inserted, returns non-zero data, assigns to correct day, aggregates types, and respescts boundaries', async () => {
    const tz = 'Asia/Kolkata';
    const localNow = todayDate(tz);

    // 1. Insert Focus Session (Activity 1)
    await prisma.focusSession.create({
      data: {
        id: 'prog_multi_f1',
        userId: 'user_default',
        status: 'completed',
        plannedMins: 20,
        actualMins: 20,
        xpAwarded: true,
        createdAt: new Date(),
        endedAt: new Date()
      }
    });

    // 2. Insert Task Completion (Activity 2)
    await prisma.task.create({
      data: {
        id: 'prog_multi_t1',
        userId: 'user_default',
        title: 'Boundary Task',
        scheduledDate: localNow,
        completed: true,
        completedAt: new Date(),
        sortOrder: 0
      }
    });

    // 3. Request Snapshot
    const snap = await getProgressSnapshot(tz) as { success: boolean; data?: any };
    expect(snap.success).toBe(true);
    const data = snap.data;

    // 4. Verify non-zero data & correct day
    const chart = data.chartData;
    const todayData = chart.find((c: any) => c.dateStr === localNow);
    
    expect(todayData).toBeDefined();
    expect(todayData.value).toBeGreaterThanOrEqual(20); // Focus mins correctly attributed to today

    // 5. Multiple types aggregate
    expect(data.totals.totalSessions).toBeGreaterThanOrEqual(1);
    expect(data.totals.totalTasks).toBeGreaterThanOrEqual(1);
    
    // Streaks should reflect this active day
    expect(data.streaks.totalActive).toBeGreaterThanOrEqual(1);
    expect(data.streaks.currentStreak).toBeGreaterThanOrEqual(1);
  });
});
