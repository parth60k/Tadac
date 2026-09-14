import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createReward, getRewards, redeemReward, deleteReward } from '../rewards';

describe('Gamification Rewards Engine', () => {
  const DEFAULT_USER_ID = 'user_default';
  
  beforeEach(async () => {
    // Ensure default user exists
    await prisma.user.upsert({
      where: { id: DEFAULT_USER_ID },
      create: { id: DEFAULT_USER_ID, name: 'Test User' },
      update: {}
    });

    // Clear rewards
    await prisma.reward.deleteMany({ where: { userId: DEFAULT_USER_ID } });
  });

  it('provisions new physical incentives dynamically', async () => {
    const creationRes: any = await createReward('Iced Latte', '3h focus time', 'Treat myself');
    expect(creationRes.success).toBe(true);
    expect(creationRes.data.redeemed).toBe(false);

    const rewards: any = await getRewards();
    expect(rewards.data).toHaveLength(1);
    expect(rewards.data[0].name).toBe('Iced Latte');
  });

  it('marks physical rewards uniquely redeemed preventing overlapping claim attempts', async () => {
    const reward: any = await createReward('Pizza', 'Finish full mock interview');
    expect(reward.success).toBe(true);

    const rId = reward.data.id;

    // First attempt to redeem
    const r1: any = await redeemReward(rId);
    expect(r1.success).toBe(true);
    expect(r1.data.redeemed).toBe(true);
    expect(r1.data.redeemedAt).toBeDefined();

    // Second overlapping attempt
    const r2: any = await redeemReward(rId);
    expect(r2.success).toBe(false); // Should organically abort due to existing claim constraint
  });

  it('deletes specific rewards seamlessly', async () => {
    const reward: any = await createReward('Pizza', 'Finish full mock interview');
    
    await deleteReward(reward.data.id);
    
    const db: any = await getRewards();
    expect(db.data).toHaveLength(0);
  });
});
