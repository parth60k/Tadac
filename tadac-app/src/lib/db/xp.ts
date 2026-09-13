/**
 * XP persistence layer — awards XP for user actions.
 * Idempotent: uses XpEvent unique constraint (userId + reason + sourceId)
 * to prevent double-awarding regardless of how many times it's called.
 */

import { prisma } from '@/lib/prisma';
import type { XpReason } from '@/types/domain';
import { computeLevel } from '@/types/domain';

// ─── Award XP (idempotent) ────────────────────────────────────────────────────

export async function awardXp(input: {
  userId: string;
  amount: number;
  reason: XpReason;
  sourceId: string;      // The ID of the source record (Task.id, FocusSession.id, etc.)
}): Promise<{ awarded: boolean; totalXp: number; level: number }> {
  // Try to create the XP event; if the unique constraint fires, it's a no-op
  let awarded = false;

  try {
    await prisma.xpEvent.create({
      data: {
        userId:   input.userId,
        amount:   input.amount,
        reason:   input.reason,
        sourceId: input.sourceId,
      },
    });
    awarded = true;
  } catch (_e: unknown) {
    // Unique constraint violation = already awarded, safe to ignore
  }

  const totalXp = await getTotalXp(input.userId);
  const level   = computeLevel(totalXp);

  return { awarded, totalXp, level };
}

// ─── Get total XP for a user ──────────────────────────────────────────────────

export async function getTotalXp(userId: string): Promise<number> {
  const result = await prisma.xpEvent.aggregate({
    where:  { userId },
    _sum:   { amount: true },
  });
  return result._sum.amount ?? 0;
}

// ─── Get XP breakdown by reason ──────────────────────────────────────────────

export async function getXpBreakdown(userId: string) {
  const events = await prisma.xpEvent.groupBy({
    by:     ['reason'],
    where:  { userId },
    _sum:   { amount: true },
    _count: { id: true },
  });

  return events.map(e => ({
    reason: e.reason as XpReason,
    total:  e._sum.amount ?? 0,
    count:  e._count.id,
  }));
}
