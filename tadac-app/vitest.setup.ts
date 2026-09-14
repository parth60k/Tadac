import { execSync } from 'child_process';
import { beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

beforeAll(() => {
  // Push the schema to the test database
  console.log("Setting up test database at ./test.db...");
  execSync('npx prisma db push --accept-data-loss', { 
    stdio: 'ignore', 
    env: { ...process.env, DATABASE_URL: 'file:./test.db' }
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  // Optional: Clean up test.db
  try {
    if (fs.existsSync('./prisma/test.db')) {
      fs.unlinkSync('./prisma/test.db');
    }
    if (fs.existsSync(path.join(process.cwd(), 'test.db'))) {
      fs.unlinkSync(path.join(process.cwd(), 'test.db'));
    }
  } catch (e) {
    console.log("Could not unlink test.db (file locked), skipping teardown");
  }
});
