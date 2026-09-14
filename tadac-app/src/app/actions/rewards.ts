'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, Errors } from '@/lib/errors';

const DEFAULT_USER_ID = 'user_default';

/**
 * Fetch all user-defined rewards, sorted by redeemed status then creation.
 */
export async function getRewards() {
  return withErrorHandling(async () => {
    return await prisma.reward.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: [
        { redeemed: 'asc' },
        { createdAt: 'desc' }
      ]
    });
  });
}

/**
 * Creates a new user-defined motivational reward.
 */
export async function createReward(name: string, requirement: string, description: string = '') {
  return withErrorHandling(async () => {
    if (!name.trim()) throw Errors.validation('Reward name is required');
    if (!requirement.trim()) throw Errors.validation('Requirement is required');

    const reward = await prisma.reward.create({
      data: {
        userId: DEFAULT_USER_ID,
        name: name.trim(),
        requirement: requirement.trim(),
        description: description.trim()
      }
    });

    revalidatePath('/rewards');
    return reward;
  });
}

/**
 * Marks a reward as redeemed.
 */
export async function redeemReward(id: string) {
  return withErrorHandling(async () => {
    const existing = await prisma.reward.findUnique({ where: { id } });
    if (!existing || existing.userId !== DEFAULT_USER_ID) {
      throw Errors.notFound('Reward');
    }

    if (existing.redeemed) {
      throw Errors.validation('Reward is already redeemed');
    }

    const updated = await prisma.reward.update({
      where: { id },
      data: {
        redeemed: true,
        redeemedAt: new Date()
      }
    });

    revalidatePath('/rewards');
    return updated;
  });
}

export async function deleteReward(id: string) {
  return withErrorHandling(async () => {
    await prisma.reward.delete({
      where: { id }
    });
    revalidatePath('/rewards');
    return { success: true };
  });
}
