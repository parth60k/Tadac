import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { startFocusSession } from '@/app/actions/focus';

describe('User Provisioning (Regression)', () => {
  beforeEach(async () => {
    // Truncate cleanly to ensure the database starts empty,
    // exactly replicating a fresh Vercel Neon postgres deployment with no seeds.
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

  it('provisions the default user dynamically if it does not exist when starting focus', async () => {
    // 1. Verify db is empty
    const usersCount = await prisma.user.count();
    expect(usersCount).toBe(0);

    // 2. Act - Try to perform a mutation that historically would fail with a Foreign Key constraint
    const result = await startFocusSession({
      preset: '25/5',
      sessionType: 'focus',
      category: 'Other',
      plannedMins: 25,
    });

    // 3. Assert
    // The wrapper captures failures, so success should be true!
    expect(result.success).toBe(true);

    const usersAfter = await prisma.user.count();
    expect(usersAfter).toBe(1);

    const createdUser = await prisma.user.findUnique({
      where: { id: 'user_default' },
      include: { settings: true },
    });
    
    expect(createdUser).toBeDefined();
    expect(createdUser?.name).toBe('Parth');
    
    const settingsCount = await prisma.setting.count();
    expect(settingsCount).toBe(1);
    expect(createdUser?.settings?.theme).toBe('auto');
  });
});
