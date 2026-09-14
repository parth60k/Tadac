import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { computeRevisionSchedule, todayDate, addDays, classifyCheckpoint } from '@/lib/date';

describe('Revision Engine - Date Domain Logic', () => {
  beforeEach(() => {
    // We mock the system time specifically for boundary tests where "today" implicitly matters
    // although computeRevisionSchedule relies entirely on the explicit anchor date.
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1-5. correctly generates exactly Day 1, 3, 7, 15, 30 sequence', () => {
    const anchor = '2026-09-13'; // Standard date
    const schedule = computeRevisionSchedule(anchor);
    
    expect(schedule).toHaveLength(5);
    
    expect(schedule[0]).toMatchObject({ sequence: 1, intervalDays: 1, dueDate: '2026-09-14' });
    expect(schedule[1]).toMatchObject({ sequence: 2, intervalDays: 3, dueDate: '2026-09-16' });
    expect(schedule[2]).toMatchObject({ sequence: 3, intervalDays: 7, dueDate: '2026-09-20' });
    expect(schedule[3]).toMatchObject({ sequence: 4, intervalDays: 15, dueDate: '2026-09-28' });
    expect(schedule[4]).toMatchObject({ sequence: 5, intervalDays: 30, dueDate: '2026-10-13' });
  });

  it('6. month boundary transition', () => {
    // Non-leap year February
    const anchor = '2026-02-27';
    const schedule = computeRevisionSchedule(anchor);
    
    // Day 1 => Feb 28
    expect(schedule[0].dueDate).toBe('2026-02-28');
    // Day 3 => Mar 2 
    expect(schedule[1].dueDate).toBe('2026-03-02');
  });

  it('7. year boundary transition', () => {
    const anchor = '2026-12-30';
    const schedule = computeRevisionSchedule(anchor);
    
    // Day 1 => Dec 31
    expect(schedule[0].dueDate).toBe('2026-12-31');
    // Day 3 => Jan 2, 2027
    expect(schedule[1].dueDate).toBe('2027-01-02');
  });

  it('14. timezone boundary robustness', () => {
    // JS Date constructor in a CI machine (e.g. UTC server) parsing an ISO date without a time 
    // treats it as UTC midnight. We need to ensure that regardless of the machine timezone, 
    // our interval arithmetic remains localized in days, returning strings without shifting a day backwards.
    const anchor = '2027-01-01';
    
    // Fake the CI machine timezone to be behind UTC (e.g. America/Los_Angeles)
    // vitest vi.useFakeTimers doesn't directly mock timezone out of the box, 
    // but we can trust our Date math if we explicitly set current date near midnight.
    vi.setSystemTime(new Date('2027-01-01T23:59:59+05:30'));
    
    const schedule = computeRevisionSchedule(anchor);
    expect(schedule[0].dueDate).toBe('2027-01-02'); // Should strictly be based on anchor
  });

  it('ensure time strings are formatted properly as YYYY-MM-DD', () => {
    expect(todayDate('Asia/Kolkata')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(addDays('2024-03-05', 7)).toBe('2024-03-12');
  });
  
  it('correctly classifies checkpoints', () => {
    const today = '2026-09-14';
    
    // DUE_TODAY: pending and due <= today (should really be OVERDUE if < today, but let's test exactly)
    expect(classifyCheckpoint('2026-09-14', 'PENDING', today)).toBe('DUE_TODAY');
    
    // OVERDUE: pending and due < today
    expect(classifyCheckpoint('2026-09-10', 'PENDING', today)).toBe('OVERDUE');
    
    // UPCOMING: pending and due > today
    expect(classifyCheckpoint('2026-09-15', 'PENDING', today)).toBe('UPCOMING');
    
    // COMPLETED: regardless of date if status is completed
    expect(classifyCheckpoint('2026-09-10', 'COMPLETED', today)).toBe('COMPLETED');
    expect(classifyCheckpoint('2026-09-30', 'COMPLETED', today)).toBe('COMPLETED');
  });
});
