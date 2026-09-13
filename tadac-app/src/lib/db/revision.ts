/**
 * Revision persistence queries — server-side only.
 * Implements the critical rules from PRD §5.6:
 *   - Schedules are ALWAYS anchored to the original learnedAt
 *   - Checkpoints are stored in DB (not re-derived each time)
 *   - Creation is idempotent (duplicate calls won't create extra records)
 *   - Completion is idempotent (marking done twice is safe)
 */

import { prisma } from '@/lib/prisma';
import { computeRevisionSchedule, todayDate, addDays } from '@/lib/date';
import { Errors, assertDateString } from '@/lib/errors';
import type { Category } from '@/types/domain';

// ─── Create revision item with 5 checkpoints ─────────────────────────────────

export async function createRevisionItem(input: {
  userId: string;
  topic: string;
  learnedAt: string;      // YYYY-MM-DD — Day 0 anchor
  notes?: string;
  source?: string;
  category?: Category;
  tags?: string[];
}) {
  assertDateString(input.learnedAt, 'learnedAt');

  const schedule = computeRevisionSchedule(input.learnedAt);

  // Idempotent: upsert the revision item
  const item = await prisma.revisionItem.upsert({
    where: {
      userId_topic_learnedAt: {
        userId:    input.userId,
        topic:     input.topic,
        learnedAt: input.learnedAt,
      },
    },
    create: {
      userId:    input.userId,
      topic:     input.topic,
      learnedAt: input.learnedAt,
      notes:     input.notes    ?? '',
      source:    input.source   ?? '',
      category:  input.category ?? 'Other',
      tags:      (input.tags ?? []).join(','),
      checkpoints: {
        create: schedule.map(cp => ({
          sequence:     cp.sequence,
          intervalDays: cp.intervalDays,
          dueDate:      cp.dueDate,
          status:       'PENDING',
        })),
      },
    },
    update: {}, // no-op on duplicate — keeps idempotency
    include: { checkpoints: true },
  });

  return item;
}

// ─── Complete a checkpoint (idempotent) ──────────────────────────────────────

export async function completeCheckpoint(input: {
  checkpointId: string;
  userId: string;
  timezone?: string;
}) {
  // Verify ownership
  const cp = await prisma.revisionCheckpoint.findUnique({
    where: { id: input.checkpointId },
    include: { revisionItem: true },
  });

  if (!cp) throw Errors.notFound('Checkpoint');
  if (cp.revisionItem.userId !== input.userId) throw Errors.notFound('Checkpoint');

  // Already completed — idempotent, just return current state
  if (cp.status === 'COMPLETED') return cp;

  const updated = await prisma.revisionCheckpoint.update({
    where: { id: input.checkpointId },
    data: {
      status:      'COMPLETED',
      completedAt: new Date(),
    },
  });

  return updated;
}

// ─── Get today's due + overdue checkpoints for a user ────────────────────────

export async function getDueCheckpoints(userId: string, timezone = 'Asia/Kolkata') {
  const today = todayDate(timezone);

  return prisma.revisionCheckpoint.findMany({
    where: {
      revisionItem: { userId },
      status:       'PENDING',
      dueDate:      { lte: today }, // today and all past dates
    },
    include: { revisionItem: true },
    orderBy: { dueDate: 'asc' },
  });
}

// ─── Get upcoming checkpoints for a user ─────────────────────────────────────

export async function getUpcomingCheckpoints(
  userId: string,
  days = 7,
  timezone = 'Asia/Kolkata'
) {
  const today   = todayDate(timezone);
  const horizon = addDays(today, days);

  return prisma.revisionCheckpoint.findMany({
    where: {
      revisionItem: { userId },
      status:       'PENDING',
      dueDate:      { gt: today, lte: horizon },
    },
    include: { revisionItem: true },
    orderBy: { dueDate: 'asc' },
  });
}

// ─── Update learned date (recalculates all future checkpoints) ───────────────

export async function updateLearnedDate(input: {
  revisionItemId: string;
  userId: string;
  newLearnedAt: string;   // YYYY-MM-DD
}) {
  assertDateString(input.newLearnedAt, 'newLearnedAt');

  const item = await prisma.revisionItem.findUnique({
    where: { id: input.revisionItemId },
    include: { checkpoints: true },
  });

  if (!item) throw Errors.notFound('Revision item');
  if (item.userId !== input.userId) throw Errors.notFound('Revision item');

  const newSchedule = computeRevisionSchedule(input.newLearnedAt);

  // Update each PENDING checkpoint's dueDate; leave COMPLETED ones alone
  await prisma.$transaction([
    prisma.revisionItem.update({
      where: { id: input.revisionItemId },
      data:  { learnedAt: input.newLearnedAt },
    }),
    ...newSchedule.map(cp =>
      prisma.revisionCheckpoint.updateMany({
        where: {
          revisionItemId: input.revisionItemId,
          sequence:       cp.sequence,
          status:         'PENDING',
        },
        data: { dueDate: cp.dueDate },
      })
    ),
  ]);

  return prisma.revisionItem.findUnique({
    where:   { id: input.revisionItemId },
    include: { checkpoints: true },
  });
}
