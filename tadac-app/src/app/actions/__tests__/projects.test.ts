import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getProjectsList, getProjectDetails, updateStageProgress } from '../projects';

describe('Project Library Engine', () => {
  const DEFAULT_USER_ID = 'user_default';
  
  beforeEach(async () => {
    // Ensure default user exists
    await prisma.user.upsert({
      where: { id: DEFAULT_USER_ID },
      create: { id: DEFAULT_USER_ID, name: 'Test User' },
      update: {}
    });

    // Clear progress/XP
    await prisma.projectStageProgress.deleteMany({ where: { userId: DEFAULT_USER_ID } });
    await prisma.xpEvent.deleteMany({ where: { userId: DEFAULT_USER_ID, reason: 'project_stage' } });

    // Seed dummy project specifically for isolated testing
    await prisma.project.upsert({
      where: { id: 'test_project_1' },
      update: {},
      create: {
        id: 'test_project_1',
        name: 'Test Setup Project',
        description: 'Testing progression',
        stages: {
          create: [
            { id: 'test_stage_1', sequence: 1, title: 'S1', description: 'desc 1' },
            { id: 'test_stage_2', sequence: 2, title: 'S2', description: 'desc 2' }
          ]
        }
      }
    });
  });

  it('retrieves project library with active statuses', async () => {
    const listRes: any = await getProjectsList();
    expect(listRes.success).toBe(true);
    expect(listRes.data.length).toBeGreaterThan(0);
    
    // Ensure nested stages fetch properly
    const detailRes: any = await getProjectDetails('test_project_1');
    expect(detailRes.success).toBe(true);
    expect(detailRes.data.stages).toHaveLength(2);
    expect(detailRes.data.userProgress).toHaveLength(0); // 0 progress initially
  });

  it('updates stage progress flexibly and strictly isolates 50 XP to the FIRST COMPLETION only', async () => {
    // 1. Mark Stage 2 as in-progress (Testing flexible ordering)
    const prog1: any = await updateStageProgress('test_project_1', 'test_stage_2', 'IN_PROGRESS');
    expect(prog1.success).toBe(true);
    expect(prog1.data.status).toBe('IN_PROGRESS');
    
    // Ensure no XP given for merely starting it
    let xpEvents = await prisma.xpEvent.findMany({ where: { sourceId: 'test_stage_2' } });
    expect(xpEvents).toHaveLength(0);

    // 2. Mark Stage 2 as COMPLETED
    const prog2: any = await updateStageProgress('test_project_1', 'test_stage_2', 'COMPLETED');
    expect(prog2.data.status).toBe('COMPLETED');
    expect(prog2.data.xpAwarded).toBe(true); // Internal tracker confirms awarding

    // Ensure exactly 50 XP hit the ledger
    xpEvents = await prisma.xpEvent.findMany({ where: { sourceId: 'test_stage_2' } });
    expect(xpEvents).toHaveLength(1);
    expect(xpEvents[0].amount).toBe(50);

    // 3. Revert to IN_PROGRESS (e.g. user misclicked and needs to review)
    await updateStageProgress('test_project_1', 'test_stage_2', 'IN_PROGRESS');
    
    // 4. Mark COMPLETION a second time
    const prog3: any = await updateStageProgress('test_project_1', 'test_stage_2', 'COMPLETED');
    
    // ENSURE XP Is still only 1 record (Idempotency)
    xpEvents = await prisma.xpEvent.findMany({ where: { sourceId: 'test_stage_2' } });
    expect(xpEvents).toHaveLength(1); // STILL 1! No double farming!
    expect(prog3.data.xpAwarded).toBe(true); // Status flag sticks
  });
});
