'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, assertDateString } from '@/lib/errors';
import { todayDate, addDays } from '@/lib/date';
import type { Prisma } from '@prisma/client';

const DEFAULT_USER_ID = 'user_default';
const TIMEZONE        = 'Asia/Kolkata';
const JOURNAL_XP      = 10;

/**
 * Aggregates analytical performance for the day to act as Step 1 of the nightly ritual.
 */
export async function getDailySummary(dateStr: string) {
  return withErrorHandling(async () => {
    assertDateString(dateStr, 'getDailySummary');

    // Create bounds for the target timezone block logically (assumes uniform standard timezone handling)
    const startDate = new Date(`${dateStr}T00:00:00.000Z`);
    const endDate = new Date(`${dateStr}T23:59:59.999Z`);

    // 1. Focus Session Mins
    const focusSessions = await prisma.focusSession.findMany({
      where: { 
        userId: DEFAULT_USER_ID, 
        status: 'completed', 
        createdAt: { gte: startDate, lte: endDate } 
      }
    });
    const totalFocusMins = focusSessions.reduce((acc: number, s: any) => acc + s.actualMins, 0);

    // 2. Tasks Completed vs Overdue pending
    const tasks = await prisma.task.findMany({
      where: { userId: DEFAULT_USER_ID, scheduledDate: dateStr }
    });
    const tasksCompleted = tasks.filter((t: any) => t.completed).length;
    const tasksTotal = tasks.length;

    // 3. Interview Activity
    const interviews = await prisma.interviewAttempt.count({
      where: { userId: DEFAULT_USER_ID, attemptDate: dateStr }
    });

    // 4. Revision Checkpoints
    const revisions = await prisma.revisionCheckpoint.count({
      where: { dueDate: dateStr, status: 'COMPLETED' }
    });
    const revisionsPending = await prisma.revisionCheckpoint.count({
      where: { dueDate: dateStr, status: 'PENDING' }
    });

    // 5. XP Earned Today
    const xpEvents = await prisma.xpEvent.findMany({
      where: { 
        userId: DEFAULT_USER_ID, 
        earnedAt: { gte: startDate, lte: endDate } 
      }
    });
    const totalXP = xpEvents.reduce((acc: number, x: any) => acc + x.amount, 0);

    return {
      date: dateStr,
      totalFocusMins,
      tasksCompleted,
      tasksTotal,
      interviews,
      revisionsCompleted: revisions,
      revisionsPending,
      totalXP,
    };
  });
}

/**
 * Fetches existing journal entry for a given date.
 */
export async function getJournalEntry(dateStr: string) {
  return withErrorHandling(async () => {
    assertDateString(dateStr, 'getJournalEntry');
    return await prisma.journalEntry.findUnique({
      where: {
        userId_entryDate: {
          userId: DEFAULT_USER_ID,
          entryDate: dateStr
        }
      }
    });
  });
}

export type JournalInput = {
  entryDate: string;
  wentWell: string;
  wentBadly: string;
  learned: string;
  improveTomorrow: string;
  tomorrowPriorities: string[]; // max 3
  tomorrowExtras: string[];
};

/**
 * Submits the Journal Entry. Also manages Idempotent XP granting (10XP)
 * and correctly duplicates tracking tomorrow's new Task lists without overriding.
 */
export async function submitJournalEntry(data: JournalInput) {
  return withErrorHandling(async () => {
    assertDateString(data.entryDate, 'submitJournalEntry');

    // Filter empties
    const validPriorities = data.tomorrowPriorities.filter(t => t.trim().length > 0);
    const validExtras     = data.tomorrowExtras.filter(t => t.trim().length > 0);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Upsert Journal
      const journal = await tx.journalEntry.upsert({
        where: {
          userId_entryDate: { userId: DEFAULT_USER_ID, entryDate: data.entryDate }
        },
        update: {
          wentWell: data.wentWell,
          wentBadly: data.wentBadly,
          learned: data.learned,
          improveTomorrow: data.improveTomorrow,
          tomorrowPriorities: JSON.stringify(validPriorities),
          tomorrowExtras: JSON.stringify(validExtras)
        },
        create: {
          userId: DEFAULT_USER_ID,
          entryDate: data.entryDate,
          wentWell: data.wentWell,
          wentBadly: data.wentBadly,
          learned: data.learned,
          improveTomorrow: data.improveTomorrow,
          tomorrowPriorities: JSON.stringify(validPriorities),
          tomorrowExtras: JSON.stringify(validExtras)
        }
      });

      // 2. Grant Idempotent XP
      if (!journal.xpAwarded) {
        await tx.xpEvent.create({
          data: {
            userId: DEFAULT_USER_ID,
            amount: JOURNAL_XP,
            reason: 'journal',
            sourceId: journal.id
          }
        });

        await tx.journalEntry.update({
          where: { id: journal.id },
          data: { xpAwarded: true }
        });
      }

      // 3. Deduplicated Task Scaffolding for Tomorrow
      const tomorrowDateStr = addDays(data.entryDate, 1);
      
      // Get all of tomorrow's existing tasks to avoid duplication
      const existingTomorrowTasks = await tx.task.findMany({
        where: { userId: DEFAULT_USER_ID, scheduledDate: tomorrowDateStr }
      });
      const existingLowerTitles = new Set(existingTomorrowTasks.map((t: any) => t.title.toLowerCase().trim()));

      // Helper logic
      async function createStrictlyMissingTasks(titles: string[], isPriority: boolean) {
        for (let i = 0; i < titles.length; i++) {
          const rawTitle = titles[i].trim();
          if (!rawTitle) continue;

          // If the EXACT task inherently already exists scheduled for tomorrow, we SKIP IT cleanly.
          if (existingLowerTitles.has(rawTitle.toLowerCase())) {
            continue;
          }
          
          await tx.task.create({
            data: {
              userId: DEFAULT_USER_ID,
              title: rawTitle,
              scheduledDate: tomorrowDateStr,
              priority: isPriority ? 'high' : 'medium',
              category: 'Personal', // Default category
              completed: false,
              sortOrder: existingTomorrowTasks.length + i,
              description: 'Generated from Nightly Flow Journal Planning'
            }
          });
        }
      }

      await createStrictlyMissingTasks(validPriorities, true);
      await createStrictlyMissingTasks(validExtras, false);

      return await tx.journalEntry.findUnique({ where: { id: journal.id } });
    });

    revalidatePath('/journal');
    revalidatePath('/planner');
    revalidatePath('/');
    return result;
  });
}
