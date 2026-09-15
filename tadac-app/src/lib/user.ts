import { prisma } from './prisma';

export const DEFAULT_USER_ID = 'user_default';

/**
 * Ensures that the default user exists in the database.
 * This is crucial for production environments (like Vercel+Neon) where 
 * Prisma does not run seeding automatically, preventing Foreign Key 
 * constraint errors when creating new records (Focus, Revision, etc.).
 * 
 * Uses upsert so it is fully idempotent.
 */
export async function ensureDefaultUser() {
  await prisma.user.upsert({
    where: { id: DEFAULT_USER_ID },
    update: {},
    create: {
      id: DEFAULT_USER_ID,
      name: 'Parth',
      settings: {
        create: {
          theme: 'auto',
          timezone: 'Asia/Kolkata',
        },
      },
    },
  });
}
