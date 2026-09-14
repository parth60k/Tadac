import { execSync } from 'child_process';
import { beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

beforeAll(() => {
  // Push the schema to the Postgres test database natively
  console.log("Setting up Postgres test database at tadac_test...");
  execSync('npx prisma db push --accept-data-loss', { 
    stdio: 'ignore', 
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  // Truncate tables natively to avoid physical file destruction issues
  try {
    const tableNames = await prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tableNames
      .map(({ tablename }: { tablename: string }) => tablename)
      .filter((name: string) => name !== '_prisma_migrations')
      .map((name: string) => `"public"."${name}"`)
      .join(', ');

    if (tables !== '') {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    }
  } catch (e) {
    console.log("Could not truncate Postgres tables gracefully natively:", e);
  }
});
