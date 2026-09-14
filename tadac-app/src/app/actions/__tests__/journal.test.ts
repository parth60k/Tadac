import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { submitJournalEntry, getDailySummary } from '../journal';
import { addDays } from '@/lib/date';

describe('Journal Engine & Nightly Flow', () => {
  const DEFAULT_USER_ID = 'user_default';
  
  beforeEach(async () => {
    // Ensure default user exists
    await prisma.user.upsert({
      where: { id: DEFAULT_USER_ID },
      create: { id: DEFAULT_USER_ID, name: 'Test User' },
      update: {}
    });

    // Clean tracking artifacts
    await prisma.journalEntry.deleteMany({ where: { userId: DEFAULT_USER_ID } });
    await prisma.xpEvent.deleteMany({ where: { userId: DEFAULT_USER_ID, reason: 'journal' } });
    await prisma.task.deleteMany({ where: { userId: DEFAULT_USER_ID } });

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('scaffolds strictly missing tasks without producing duplicate db rows for tomorrow', async () => {
    const todayStr = '2026-10-01';
    const tomorrowStr = addDays(todayStr, 1);

    // 1. Manually create a task for tomorrow mimicking a pre-existing state
    await prisma.task.create({
      data: {
        id: 'existing-t1',
        userId: DEFAULT_USER_ID,
        title: 'Learn Database Indexing', // The task already exists
        scheduledDate: tomorrowStr,
        priority: 'high',
        category: 'Personal',
        completed: false,
        sortOrder: 0
      }
    });

    // 2. Submit Journal with Priority 1 duplicating the existing string, and Priority 2 being unique
    const res: any = await submitJournalEntry({
      entryDate: todayStr,
      wentWell: 'Good day',
      wentBadly: 'Nothing',
      learned: 'A lot',
      improveTomorrow: 'Focus deeper',
      tomorrowPriorities: ['Learn Database Indexing ', 'Finish UI Layout'], 
      tomorrowExtras: []
    });

    expect(res.success).toBe(true);

    // Verify
    const tommTasks = await prisma.task.findMany({ where: { scheduledDate: tomorrowStr } });
    
    // There should ONLY be 2 tasks! The original, and the new non-duplicate.
    expect(tommTasks).toHaveLength(2);
    
    const titles = tommTasks.map((t: any) => t.title);
    expect(titles).toContain('Learn Database Indexing');
    expect(titles).toContain('Finish UI Layout');
  });

  it('awards strictly 10 XP idempotently, preventing infinite loop farming', async () => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Submit journal flow the first time
    const iter1: any = await submitJournalEntry({
      entryDate: todayStr,
      wentWell: '', wentBadly: '', learned: '', improveTomorrow: '',
      tomorrowPriorities: [], tomorrowExtras: []
    });

    expect(iter1.data.xpAwarded).toBe(true);

    // Verify precisely 10 XP was logged
    let xpEvents = await prisma.xpEvent.findMany({ where: { sourceId: iter1.data.id } });
    expect(xpEvents).toHaveLength(1);
    expect(xpEvents[0].amount).toBe(10);

    // USER attempts to submit it a second time on the same date via back button
    const iter2: any = await submitJournalEntry({
      entryDate: todayStr,
      wentWell: 'Wait, I forgot something...', wentBadly: '', learned: '', improveTomorrow: '',
      tomorrowPriorities: [], tomorrowExtras: []
    });

    expect(iter2.data.wentWell).toBe('Wait, I forgot something...');

    // Did they cheat the system and farm an extra 10XP? No!
    xpEvents = await prisma.xpEvent.findMany({ where: { sourceId: iter1.data.id } });
    expect(xpEvents).toHaveLength(1); // STILL 1
    
    const dailyTotal: any = await getDailySummary(todayStr); // should be 10 total
    expect(dailyTotal.data.totalXP).toBe(10);
  });
});
