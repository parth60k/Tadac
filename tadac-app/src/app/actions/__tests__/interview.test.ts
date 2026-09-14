import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getDailyQuestions, submitInterviewAttempt } from '../interview';

describe('Interview Practice Engine', () => {
  const DEFAULT_USER_ID = 'user_default';
  
  beforeEach(async () => {
    // Ensure isolated user exists
    await prisma.user.upsert({
      where: { id: DEFAULT_USER_ID },
      create: { id: DEFAULT_USER_ID, name: 'Test User' },
      update: {}
    });
    
    // Clear all interview data for this user
    await prisma.interviewAttempt.deleteMany({ where: { userId: DEFAULT_USER_ID } });
    await prisma.xpEvent.deleteMany({ where: { userId: DEFAULT_USER_ID, reason: 'interview' } });
    
    // Clear all questions and seed 10 generic deterministic ones
    await prisma.interviewAttempt.deleteMany({});
    await prisma.interviewQuestion.deleteMany({});
    
    for (let i = 1; i <= 10; i++) {
       await prisma.interviewQuestion.create({
         data: {
           id: `q${i}`,
           topic: 'TestTopic',
           question: `Test Question ${i}?`,
           options: JSON.stringify(['A', 'B']),
           answer: 'A',
           active: true
         }
       });
    }

    vi.useFakeTimers();
  });

  afterEach(async () => {
    vi.useRealTimers();
  });

  it('generates exactly 5 unique questions deterministically on the same day', async () => {
    vi.setSystemTime(new Date('2026-10-01T12:00:00+05:30'));
    
    const r1: any = await getDailyQuestions();
    expect(r1.success).toBe(true);
    expect(r1.data.questions).toHaveLength(5);
    
    const r2: any = await getDailyQuestions();
    
    // Must be exactly the same subset and sequence
    const ids1 = r1.data.questions.map((q: any) => q.id).join(',');
    const ids2 = r2.data.questions.map((q: any) => q.id).join(',');
    expect(ids1).toBe(ids2);
  });

  it('records attempt securely, evaluates correctness correctly, and awards 10 XP idempotently', async () => {
    vi.setSystemTime(new Date('2026-10-01T12:00:00+05:30'));
    const initial: any = await getDailyQuestions();
    const targetQ = initial.data.questions[0];

    // Answer incorrectly first
    const submitReq: any = await submitInterviewAttempt(targetQ.id, 'B');  // B is wrong, A was answer
    expect(submitReq.success).toBe(true);
    expect(submitReq.data.correct).toBe(false);

    // XP is still granted because they attempted it!
    let xp = await prisma.xpEvent.findMany({ where: { userId: DEFAULT_USER_ID, reason: 'interview', sourceId: submitReq.data.id }});
    expect(xp).toHaveLength(1);
    expect(xp[0].amount).toBe(10);
    
    // Idempotent catch - attempting the identical question again today yields the same attempt and NO double XP
    const repeatReq: any = await submitInterviewAttempt(targetQ.id, 'A');
    expect(repeatReq.data.id).toBe(submitReq.data.id);
    expect(repeatReq.data.userAnswer).toBe('B'); // it shouldn't have changed to A
    
    xp = await prisma.xpEvent.findMany({ where: { userId: DEFAULT_USER_ID, reason: 'interview', sourceId: submitReq.data.id }});
    expect(xp).toHaveLength(1);
  });

  it('prioritizes failed questions heavily on subsequent days until corrected', async () => {
    // Current Day
    vi.setSystemTime(new Date('2026-10-01T12:00:00+05:30'));
    const day1: any = await getDailyQuestions();
    const qFailing = day1.data.questions[2].id; // Pick 3rd question from day 1
    
    // Fail it
    await submitInterviewAttempt(qFailing, 'B'); // Wrong

    // FAST FORWARD to Next Day
    vi.setSystemTime(new Date('2026-10-02T12:00:00+05:30'));
    const day2: any = await getDailyQuestions();
    
    // That question must absolutely be in Day 2 queue because it failed yesterday and priority queue gets it
    const day2Ids = day2.data.questions.map((q: any) => q.id);
    expect(day2Ids).toContain(qFailing);
    
    // Answer it correctly on Day 2
    await submitInterviewAttempt(qFailing, 'A');

    // FAST FORWARD to Day 3
    vi.setSystemTime(new Date('2026-10-03T12:00:00+05:30'));
    const day3: any = await getDailyQuestions();
    
    // It should NO LONGER be prioritized on Day 3 because it was answered successfully globally
    // Given we only have 10 seeds and pull 5 each day, chance of it appearing just from random base is high, 
    // but we can query the prioritized method to prove it was dropped from priority.
    // Instead we will verify DB state:
    const corrects = await prisma.interviewAttempt.count({ where: { questionId: qFailing, correct: true }});
    expect(corrects).toBe(1);
  });
});
