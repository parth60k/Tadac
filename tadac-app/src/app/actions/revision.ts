'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { withErrorHandling, Errors, assertDateString } from '@/lib/errors';
import { todayDate, computeRevisionSchedule, addDays } from '@/lib/date';
import type { Category } from '@/types/domain';

import { ensureDefaultUser, DEFAULT_USER_ID } from '@/lib/user';
const TIMEZONE        = 'Asia/Kolkata';

// ─── Create revision item + 5 checkpoints (idempotent) ───────────────────────

export async function createRevisionItem(data: {
  topic:     string;
  learnedAt: string;     // YYYY-MM-DD
  notes?:    string;
  source?:   string;
  category?: Category;
  tags?:     string[];
}) {
  return withErrorHandling(async () => {
    if (!data.topic.trim()) throw Errors.validation('Topic is required.');
    assertDateString(data.learnedAt, 'learnedAt');

    await ensureDefaultUser();

    const schedule = computeRevisionSchedule(data.learnedAt);

    const item = await prisma.revisionItem.upsert({
      where: {
        userId_topic_learnedAt: {
          userId:    DEFAULT_USER_ID,
          topic:     data.topic.trim(),
          learnedAt: data.learnedAt,
        },
      },
      create: {
        userId:    DEFAULT_USER_ID,
        topic:     data.topic.trim(),
        learnedAt: data.learnedAt,
        notes:     data.notes    ?? '',
        source:    data.source   ?? '',
        category:  data.category ?? 'Other',
        tags:      (data.tags ?? []).join(','),
        checkpoints: {
          create: schedule.map(cp => ({
            sequence:     cp.sequence,
            intervalDays: cp.intervalDays,
            dueDate:      cp.dueDate,
            status:       'PENDING',
          })),
        },
      },
      update: {},   // no-op if already exists
      include: { checkpoints: { orderBy: { sequence: 'asc' } } },
    });

    revalidatePath('/revision');
    revalidatePath('/');
    revalidatePath('/progress');
    return { item, schedule };
  });
}

// ─── Mark checkpoint as revised (idempotent) ─────────────────────────────────

export async function markCheckpointRevised(checkpointId: string) {
  return withErrorHandling(async () => {
    const cp = await prisma.revisionCheckpoint.findUnique({
      where:   { id: checkpointId },
      include: { revisionItem: true },
    });

    if (!cp)                                        throw Errors.notFound('Checkpoint');
    if (cp.revisionItem.userId !== DEFAULT_USER_ID) throw Errors.notFound('Checkpoint');

    // Idempotent — already completed
    if (cp.status === 'COMPLETED') return cp;

    const updated = await prisma.revisionCheckpoint.update({
      where: { id: checkpointId },
      data: {
        status:      'COMPLETED',
        completedAt: new Date(),
        xpAwarded:   true,
      },
    });

    // Award XP — unique constraint prevents double-awarding
    try {
      await prisma.xpEvent.create({
        data: {
          userId:   DEFAULT_USER_ID,
          amount:   15,
          reason:   'revision',
          sourceId: checkpointId,
        },
      });
    } catch {
      // Already awarded
    }

    revalidatePath('/revision');
    revalidatePath('/');
    revalidatePath('/progress');
    return updated;
  });
}


// ─── Edit learned date (cascading schedule recalculation) ──────────────────────

export async function updateRevisionLearnedDate(itemId: string, newLearnedAt: string) {
  return withErrorHandling(async () => {
    assertDateString(newLearnedAt, 'newLearnedAt');
    
    // We do this in a transaction to ensure atomic update of the item and its checkpoints
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const item = await tx.revisionItem.findUnique({ 
        where: { id: itemId },
        include: { checkpoints: true }
      });
      
      if (!item || item.userId !== DEFAULT_USER_ID) {
        throw Errors.notFound('Revision item');
      }

      // 1. Update the parent item learnedAt
      const updatedItem = await tx.revisionItem.update({
        where: { id: itemId },
        data: { learnedAt: newLearnedAt }
      });

      // 2. Compute new schedule based on the new anchor
      const newSchedule = computeRevisionSchedule(newLearnedAt);

      // 3. Update existing checkpoints with their new due dates
      for (const cp of newSchedule) {
        // Find existing checkpoint with same sequence
        const existingCp = item.checkpoints.find((c: any) => c.sequence === cp.sequence);
        if (existingCp) {
          await tx.revisionCheckpoint.update({
            where: { id: existingCp.id },
            data: { dueDate: cp.dueDate }
          });
        }
      }

      return updatedItem;
    });

    revalidatePath('/revision');
    revalidatePath('/');
    revalidatePath('/progress');
    return result;
  });
}

// ─── Delete revision item ─────────────────────────────────────────────────────

export async function deleteRevisionItem(itemId: string) {
  return withErrorHandling(async () => {
    const item = await prisma.revisionItem.findUnique({ where: { id: itemId } });
    if (!item || item.userId !== DEFAULT_USER_ID) throw Errors.notFound('Revision item');

    await prisma.revisionItem.delete({ where: { id: itemId } });
    revalidatePath('/revision');
    revalidatePath('/');
    revalidatePath('/progress');
    return { deleted: true };
  });
}

// ─── Get all revision items with checkpoints ──────────────────────────────────

export async function getRevisionItems() {
  const today = todayDate(TIMEZONE);

  const items = await prisma.revisionItem.findMany({
    where:   { userId: DEFAULT_USER_ID },
    include: { checkpoints: { orderBy: { sequence: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });

  return { items, today };
}

// ─── Get a single revision item ───────────────────────────────────────────────

export async function getRevisionItem(itemId: string) {
  const today = todayDate(TIMEZONE);

  const item = await prisma.revisionItem.findUnique({
    where:   { id: itemId },
    include: { checkpoints: { orderBy: { sequence: 'asc' } } },
  });

  if (!item || item.userId !== DEFAULT_USER_ID) throw Errors.notFound('Revision item');
  return { item, today };
}

// ─── Get due + upcoming counts (for dashboard) ────────────────────────────────

export async function getRevisionCounts() {
  const today    = todayDate(TIMEZONE);
  const tomorrow = addDays(today, 1);
  const in7days  = addDays(today, 7);

  const [dueCount, upcomingCount] = await Promise.all([
    prisma.revisionCheckpoint.count({
      where: {
        revisionItem: { userId: DEFAULT_USER_ID },
        status:  'PENDING',
        dueDate: { lte: today },
      },
    }),
    prisma.revisionCheckpoint.count({
      where: {
        revisionItem: { userId: DEFAULT_USER_ID },
        status:  'PENDING',
        dueDate: { gte: tomorrow, lte: in7days },
      },
    }),
  ]);

  return { dueCount, upcomingCount };
}
