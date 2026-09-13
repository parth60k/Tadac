'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { Errors, withErrorHandling, assertDateString } from '@/lib/errors';
import { todayDate } from '@/lib/date';
import type { Priority, Category } from '@/types/domain';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_USER_ID = 'user_default';

// ─── Get tasks for a specific date ───────────────────────────────────────────

export async function getTasksForDate(date: string) {
  assertDateString(date, 'date');
  return prisma.task.findMany({
    where:   { userId: DEFAULT_USER_ID, scheduledDate: date },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
}

// ─── Get tasks for a date range ───────────────────────────────────────────────

export async function getTasksForDateRange(from: string, to: string) {
  assertDateString(from, 'from');
  assertDateString(to, 'to');
  return prisma.task.findMany({
    where: {
      userId:        DEFAULT_USER_ID,
      scheduledDate: { gte: from, lte: to },
    },
    orderBy: [{ scheduledDate: 'asc' }, { sortOrder: 'asc' }],
  });
}

// ─── Create task ──────────────────────────────────────────────────────────────

export async function createTask(data: {
  title:          string;
  scheduledDate:  string;
  priority?:      Priority;
  category?:      Category;
  description?:   string;
  scheduledTime?: string;
  estimatedMins?: number;
  deadline?:      string;
}) {
  return withErrorHandling(async () => {
    if (!data.title.trim()) throw Errors.validation('Task title is required.');
    assertDateString(data.scheduledDate, 'scheduledDate');
    if (data.deadline) assertDateString(data.deadline, 'deadline');

    // Determine next sortOrder for this date
    const last = await prisma.task.findFirst({
      where:   { userId: DEFAULT_USER_ID, scheduledDate: data.scheduledDate },
      orderBy: { sortOrder: 'desc' },
    });

    const task = await prisma.task.create({
      data: {
        userId:        DEFAULT_USER_ID,
        title:         data.title.trim(),
        description:   data.description   ?? '',
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime ?? null,
        priority:      data.priority      ?? 'medium',
        category:      data.category      ?? 'Other',
        estimatedMins: data.estimatedMins ?? null,
        deadline:      data.deadline      ?? null,
        sortOrder:     (last?.sortOrder ?? -1) + 1,
      },
    });

    revalidatePath('/');
    revalidatePath('/planner');
    return task;
  });
}

// ─── Update task ──────────────────────────────────────────────────────────────

export async function updateTask(id: string, data: {
  title?:         string;
  description?:   string;
  scheduledDate?: string;
  scheduledTime?: string | null;
  priority?:      Priority;
  category?:      Category;
  estimatedMins?: number | null;
  deadline?:      string | null;
}) {
  return withErrorHandling(async () => {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || task.userId !== DEFAULT_USER_ID) throw Errors.notFound('Task');
    if (data.title !== undefined && !data.title.trim()) throw Errors.validation('Task title cannot be empty.');
    if (data.scheduledDate) assertDateString(data.scheduledDate, 'scheduledDate');
    if (data.deadline)      assertDateString(data.deadline, 'deadline');

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(data.title         !== undefined && { title:         data.title.trim() }),
        ...(data.description   !== undefined && { description:   data.description }),
        ...(data.scheduledDate !== undefined && { scheduledDate: data.scheduledDate }),
        ...(data.scheduledTime !== undefined && { scheduledTime: data.scheduledTime }),
        ...(data.priority      !== undefined && { priority:      data.priority }),
        ...(data.category      !== undefined && { category:      data.category }),
        ...(data.estimatedMins !== undefined && { estimatedMins: data.estimatedMins }),
        ...(data.deadline      !== undefined && { deadline:      data.deadline }),
      },
    });

    revalidatePath('/');
    revalidatePath('/planner');
    return updated;
  });
}

// ─── Complete / uncomplete task ───────────────────────────────────────────────

export async function toggleTaskComplete(id: string) {
  return withErrorHandling(async () => {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || task.userId !== DEFAULT_USER_ID) throw Errors.notFound('Task');

    const nowCompleted = !task.completed;

    const updated = await prisma.task.update({
      where: { id },
      data: {
        completed:   nowCompleted,
        completedAt: nowCompleted ? new Date() : null,
      },
    });

    // Award XP once when completing (idempotent via XpEvent unique constraint)
    if (nowCompleted && !task.xpAwarded) {
      try {
        await prisma.xpEvent.create({
          data: {
            userId:   DEFAULT_USER_ID,
            amount:   10,
            reason:   'task',
            sourceId: id,
          },
        });
        await prisma.task.update({ where: { id }, data: { xpAwarded: true } });
      } catch {
        // duplicate XP event — safe to ignore
      }
    }

    revalidatePath('/');
    revalidatePath('/planner');
    return updated;
  });
}

// ─── Delete task ──────────────────────────────────────────────────────────────

export async function deleteTask(id: string) {
  return withErrorHandling(async () => {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || task.userId !== DEFAULT_USER_ID) throw Errors.notFound('Task');
    await prisma.task.delete({ where: { id } });
    revalidatePath('/');
    revalidatePath('/planner');
    return { deleted: true };
  });
}

// ─── Reorder tasks for a date ─────────────────────────────────────────────────

export async function reorderTasks(orderedIds: string[]) {
  return withErrorHandling(async () => {
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.task.updateMany({
          where: { id, userId: DEFAULT_USER_ID },
          data:  { sortOrder: index },
        })
      )
    );
    revalidatePath('/planner');
    return { reordered: true };
  });
}

// ─── Dashboard summary data ───────────────────────────────────────────────────

export async function getDashboardData() {
  const timezone = 'Asia/Kolkata';
  const today    = todayDate(timezone);

  const [
    todayTasks,
    focusSessions,
    dueRevisions,
    todayAttempts,
    xpTotal,
  ] = await Promise.all([
    // Today's tasks
    prisma.task.findMany({
      where:   { userId: DEFAULT_USER_ID, scheduledDate: today },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      take:    10,
    }),

    // Today's completed focus sessions
    prisma.focusSession.findMany({
      where: {
        userId:    DEFAULT_USER_ID,
        status:    'completed',
        startedAt: {
          gte: new Date(`${today}T00:00:00+05:30`),
          lte: new Date(`${today}T23:59:59+05:30`),
        },
      },
    }),

    // Revision checkpoints due today or overdue
    prisma.revisionCheckpoint.count({
      where: {
        revisionItem: { userId: DEFAULT_USER_ID },
        status:  'PENDING',
        dueDate: { lte: today },
      },
    }),

    // Interview attempts today
    prisma.interviewAttempt.count({
      where: { userId: DEFAULT_USER_ID, attemptDate: today },
    }),

    // Total XP
    prisma.xpEvent.aggregate({
      where: { userId: DEFAULT_USER_ID },
      _sum:  { amount: true },
    }),
  ]);

  const totalFocusMins = focusSessions.reduce((sum: number, s: { actualMins: number }) => sum + s.actualMins, 0);
  const totalXP        = xpTotal._sum.amount ?? 0;

  return {
    today,
    todayTasks,
    totalFocusMins,
    dueRevisions,
    interviewDone: todayAttempts,
    interviewTotal: 5,
    totalXP,
  };
}
