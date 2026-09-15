'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, Errors } from '@/lib/errors';
import { todayDate } from '@/lib/date';
import type { FocusPreset, Category } from '@/types/domain';

import { ensureDefaultUser, DEFAULT_USER_ID } from '@/lib/user';

// ─── Start a new focus session ────────────────────────────────────────────────

export async function startFocusSession(data: {
  preset:      FocusPreset;
  sessionType: 'focus' | 'short_break' | 'long_break';
  category:    Category;
  plannedMins: number;
  taskId?:     string;
}) {
  return withErrorHandling(async () => {
    await ensureDefaultUser();

    // Abandon any lingering 'active' sessions before starting fresh
    await prisma.focusSession.updateMany({
      where:  { userId: DEFAULT_USER_ID, status: 'active' },
      data:   { status: 'stopped', endedAt: new Date() },
    });

    const session = await prisma.focusSession.create({
      data: {
        userId:      DEFAULT_USER_ID,
        preset:      data.preset,
        sessionType: data.sessionType,
        category:    data.category,
        plannedMins: data.plannedMins,
        taskId:      data.taskId ?? null,
        status:      'active',
        startedAt:   new Date(),
      },
    });

    return session;
  });
}

// ─── Complete a focus session (stores actual minutes) ─────────────────────────

export async function completeFocusSession(data: {
  sessionId:  string;
  actualMins: number;
  xpAmount:   number;
}) {
  return withErrorHandling(async () => {
    const session = await prisma.focusSession.findUnique({
      where: { id: data.sessionId },
    });
    if (!session || session.userId !== DEFAULT_USER_ID) {
      throw Errors.notFound('Focus session');
    }

    const updated = await prisma.focusSession.update({
      where: { id: data.sessionId },
      data: {
        status:     'completed',
        actualMins: data.actualMins,
        endedAt:    new Date(),
        xpAwarded:  true,
      },
    });

    // Award XP — idempotent via unique constraint
    try {
      await prisma.xpEvent.create({
        data: {
          userId:   DEFAULT_USER_ID,
          amount:   data.xpAmount,
          reason:   'focus_session',
          sourceId: data.sessionId,
        },
      });
    } catch {
      // Duplicate — already awarded
    }

    revalidatePath('/');
    revalidatePath('/focus');
    revalidatePath('/progress');
    return updated;
  });
}

// ─── Stop a session mid-way (still records partial time) ─────────────────────

export async function stopFocusSession(data: {
  sessionId:  string;
  actualMins: number;
}) {
  return withErrorHandling(async () => {
    const session = await prisma.focusSession.findUnique({
      where: { id: data.sessionId },
    });
    if (!session || session.userId !== DEFAULT_USER_ID) {
      throw Errors.notFound('Focus session');
    }

    const updated = await prisma.focusSession.update({
      where: { id: data.sessionId },
      data: {
        status:     'stopped',
        actualMins: data.actualMins,
        endedAt:    new Date(),
      },
    });

    revalidatePath('/');
    revalidatePath('/focus');
    revalidatePath('/progress');
    return updated;
  });
}

// ─── Get today's focus summary ────────────────────────────────────────────────

export async function getTodayFocusSummary() {
  const timezone = 'Asia/Kolkata';
  const today    = todayDate(timezone);

  const sessions = await prisma.focusSession.findMany({
    where: {
      userId:      DEFAULT_USER_ID,
      sessionType: 'focus',
      status:      'completed',
      startedAt: {
        gte: new Date(`${today}T00:00:00+05:30`),
        lte: new Date(`${today}T23:59:59+05:30`),
      },
    },
    orderBy: { startedAt: 'asc' },
  });

  const totalMins    = sessions.reduce((s: number, r: { actualMins: number }) => s + r.actualMins, 0);
  const sessionCount = sessions.length;

  return { totalMins, sessionCount, sessions };
}

// ─── Get today's tasks (for task linking) ─────────────────────────────────────

export async function getTodayTasksForFocus() {
  const timezone = 'Asia/Kolkata';
  const today    = todayDate(timezone);

  return prisma.task.findMany({
    where: {
      userId:        DEFAULT_USER_ID,
      scheduledDate: today,
      completed:     false,
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, title: true, category: true },
  });
}
