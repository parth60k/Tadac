import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const tasks = await prisma.task.count();
  const focusSessions = await prisma.focusSession.count();
  const xpEvents = await prisma.xpEvent.count();
  const attempts = await prisma.interviewAttempt.count();
  
  console.log(JSON.stringify({
    users,
    tasks,
    focusSessions,
    xpEvents,
    attempts
  }, null, 2));
}

main().finally(() => prisma.$disconnect());
