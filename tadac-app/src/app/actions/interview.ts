'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, Errors, assertDateString } from '@/lib/errors';
import { todayDate } from '@/lib/date';
import type { Prisma } from '@prisma/client';

const DEFAULT_USER_ID = 'user_default';
const TIMEZONE        = 'Asia/Kolkata';
const DAILY_QUOTA     = 5;

// Simple PRNG (Park-Miller) based on a string seed (userId + date)
function seedRandom(seedStr: string) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) % 2147483647;
  }
  return function() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// Deterministic shuffle using custom seed
function shuffleArray<T>(array: T[], seedStr: string): T[] {
  const rand = seedRandom(seedStr);
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function getDailyQuestions() {
  return withErrorHandling(async () => {
    const today = todayDate(TIMEZONE);
    
    // 1. Get questions ALREADY attempted today
    const todaysAttempts = await prisma.interviewAttempt.findMany({
      where: { userId: DEFAULT_USER_ID, attemptDate: today },
      include: { question: true }
    });
    
    // If we've already generated/answered our quota of 5, just return those.
    const answeredCount = todaysAttempts.length;
    if (answeredCount >= DAILY_QUOTA) {
      return {
        questions: todaysAttempts.map(a => a.question),
        attempts:  todaysAttempts,
        today,
        quotaMet: true
      };
    }

    const remainingQuota = DAILY_QUOTA - answeredCount;
    const answeredQuestionIdsToday = new Set(todaysAttempts.map(a => a.questionId));

    // 2. Identify priority queue (previously incorrect, never subsequently correct, not attempted today)
    // First, find all correct attempts across all time to exclude them from the failure list
    const correctAttempts = await prisma.interviewAttempt.findMany({
      where: { userId: DEFAULT_USER_ID, correct: true },
      select: { questionId: true }
    });
    const globallyCorrectIds = new Set(correctAttempts.map(a => a.questionId));

    // Next, find all attempts to see what's been gotten wrong
    const incorrectAttempts = await prisma.interviewAttempt.findMany({
      where: { 
        userId: DEFAULT_USER_ID, 
        correct: false,
        questionId: { notIn: Array.from(globallyCorrectIds) }
      },
      select: { questionId: true }
    });
    
    let failedIdsPool = Array.from(new Set(incorrectAttempts.map(a => a.questionId)))
      .filter(id => !answeredQuestionIdsToday.has(id));

    // Deterministically shuffle the failed pool so it isn't completely rigid
    failedIdsPool = shuffleArray(failedIdsPool, `${DEFAULT_USER_ID}-${today}-failed`);

    const selectedIds: string[] = [];
    
    // Take from priority queue first
    for (const fid of failedIdsPool) {
      if (selectedIds.length < remainingQuota) selectedIds.push(fid);
    }

    // 3. Fallback to never-attempted questions if quota still not met
    if (selectedIds.length < remainingQuota) {
      // Find all IDs we've ever attempted (correct or incorrect, or today)
      const allAttempts = await prisma.interviewAttempt.findMany({
        where: { userId: DEFAULT_USER_ID },
        select: { questionId: true }
      });
      const allAttemptedIds = new Set(allAttempts.map(a => a.questionId));

      const freshQuestions = await prisma.interviewQuestion.findMany({
        where: { active: true },
        select: { id: true }
      });
      
      let freshIdsPool = freshQuestions
        .map(q => q.id)
        .filter(id => !allAttemptedIds.has(id));

      // Deterministically pick fresh questions using today's seed
      freshIdsPool = shuffleArray(freshIdsPool, `${DEFAULT_USER_ID}-${today}-fresh`);

      for (const fid of freshIdsPool) {
        if (selectedIds.length < remainingQuota) selectedIds.push(fid);
      }
    }
    
    // 4. Fetch the actual question objects for the selected IDs
    const todaysSelectedQuestions = await prisma.interviewQuestion.findMany({
      where: { id: { in: selectedIds } }
    });

    // Make sure they are returned deterministically sorted (e.g. by our selected array order)
    todaysSelectedQuestions.sort((a, b) => selectedIds.indexOf(a.id) - selectedIds.indexOf(b.id));

    // Complete list for today's UI
    const finalQueue = [
      ...todaysAttempts.map(a => a.question), // the ones already done today
      ...todaysSelectedQuestions
    ];

    return {
      questions: finalQueue,
      attempts: todaysAttempts,
      today,
      quotaMet: finalQueue.length === answeredCount
    };
  });
}

export async function submitInterviewAttempt(questionId: string, userAnswer: string) {
  return withErrorHandling(async () => {
    const today = todayDate(TIMEZONE);
    
    const question = await prisma.interviewQuestion.findUnique({
      where: { id: questionId }
    });
    if (!question) throw Errors.notFound('Question');
    if (!userAnswer.trim()) throw Errors.validation('Answer cannot be empty');

    // 1. Idempotency Check: Did the user already answer this today?
    const existingAttempt = await prisma.interviewAttempt.findUnique({
      where: {
        userId_questionId_attemptDate: {
          userId: DEFAULT_USER_ID,
          questionId,
          attemptDate: today
        }
      }
    });

    if (existingAttempt) {
      return existingAttempt; // Indempotent return
    }

    // 2. Evaluate answer correctness
    // In PRD, options are stored as JSON strings. e.g. ["A", "B", "C"]
    // Answer is usually exact match. We'll do a simple case-insensitive trim match.
    // If it's MCQ and they send 'A', we can verify against question.answer ('A').
    const isCorrect = String(userAnswer).trim().toLowerCase() === String(question.answer).trim().toLowerCase();

    // 3. Save the attempt atomically & grant XP
    const attempt = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.interviewAttempt.create({
        data: {
          userId: DEFAULT_USER_ID,
          questionId,
          attemptDate: today,
          userAnswer: String(userAnswer).trim(),
          correct: isCorrect,
          xpAwarded: true
        }
      });
      
      // Award exactly 10XP for ATTEMPTING (correctness doesn't gate XP as per user instruction)
      try {
        await tx.xpEvent.create({
          data: {
            userId: DEFAULT_USER_ID,
            amount: 10,
            reason: 'interview',
            sourceId: created.id
          }
        });
      } catch (err) {
        // Unique tracking catch in case of extreme race conditions, safe to ignore
      }

      return created;
    });

    revalidatePath('/interview');
    revalidatePath('/');
    return attempt;
  });
}
