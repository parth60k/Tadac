import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getDailyQuestions, submitInterviewAttempt } from '@/app/actions/interview';

describe('Interview Functional Regression', () => {
  beforeEach(async () => {
    // Truncate cleanly to ensure the database starts empty, precisely mirroring unseeded Neon production.
    try {
      const tableNames = await prisma.$queryRaw<Array<{ tablename: string }>>`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
      const tables = tableNames
        .map(({ tablename }) => tablename)
        .filter(name => name !== '_prisma_migrations')
        .map(name => `"public"."${name}"`)
        .join(', ');
      
      if (tables) {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
      }
    } catch {}
  });

  it('dynamically seeds questions on demand and handles attempts safely', async () => {
    // 1. Assert DB structural emptiness
    let questionsCount = await prisma.interviewQuestion.count();
    expect(questionsCount).toBe(0);

    // 2. Fetch daily questions (this should trigger the bootstrap)
    const dailyResult = await getDailyQuestions();
    
    expect(dailyResult.success).toBe(true);
    if (!dailyResult.success) throw new Error('Failed to get daily questions');
    
    // There should be questions populated now (15 from seed, 5 chosen for the day)
    expect(dailyResult.data.questions.length).toBeGreaterThan(0);
    expect(dailyResult.data.questions.length).toBe(5);

    questionsCount = await prisma.interviewQuestion.count();
    expect(questionsCount).toBe(15);

    // 3. Select a question and submit an attempt
    const targetQuestion = dailyResult.data.questions[0];
    const attemptResult = await submitInterviewAttempt(targetQuestion.id, 'Wrong Answer');
    
    expect(attemptResult.success).toBe(true);
    if (!attemptResult.success) throw new Error('Attempt submission failed');

    // Verification of attempt record inside DB
    const attempt = await prisma.interviewAttempt.findUnique({
      where: { id: attemptResult.data.id }
    });
    expect(attempt).toBeDefined();
    expect(attempt?.userAnswer).toBe('Wrong Answer');
    expect(attempt?.correct).toBe(false);
  });
});
