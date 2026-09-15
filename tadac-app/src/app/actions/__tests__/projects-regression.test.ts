import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getProjectsList, getProjectDetails, updateStageProgress } from '@/app/actions/projects';

describe('Projects Functional Regression', () => {
  beforeEach(async () => {
    // Truncate cleanly to ensure the database starts empty, precisely mirroring unseeded Neon production.
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

  it('dynamically seeds projects on demand and handles progress tracking', async () => {
    // 1. Assert DB structural emptiness
    let projectsCount = await prisma.project.count();
    expect(projectsCount).toBe(0);

    // 2. Fetch projects (this should trigger the bootstrap)
    const listResult = await getProjectsList();
    
    expect(listResult.success).toBe(true);
    if (!listResult.success) throw new Error('Failed to get projects list');
    
    expect(listResult.data.length).toBe(2);

    projectsCount = await prisma.project.count();
    expect(projectsCount).toBe(2);

    // 3. Fetch detailed project
    const targetProject = listResult.data[0];
    const detailsResult = await getProjectDetails(targetProject.id);
    expect(detailsResult.success).toBe(true);
    if (!detailsResult.success) throw new Error('Failed to get project details');
    
    const projectStageId = detailsResult.data.stages[0].id;
    
    // 4. Update stage progress
    const progressResult = await updateStageProgress(targetProject.id, projectStageId, 'IN_PROGRESS');
    expect(progressResult.success).toBe(true);
    
    if (!progressResult.success) throw new Error('Progress update failed');
    
    const progress = await prisma.projectStageProgress.findUnique({
      where: { id: progressResult.data.id }
    });
    
    expect(progress).toBeDefined();
    expect(progress?.status).toBe('IN_PROGRESS');
  });
});
