'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, Errors } from '@/lib/errors';
import type { Prisma } from '@prisma/client';
import type { StageStatus } from '@/types/domain';

const DEFAULT_USER_ID = 'user_default';
const STAGE_XP_REWARD = 50;

/**
 * Fetches all available curated projects.
 * Also fetches the user's progress for each project (if any)
 * to compute a high-level active completion visual.
 */
export async function getProjectsList() {
  return withErrorHandling(async () => {
    const projects = await prisma.project.findMany({
      where: { active: true },
      include: {
        stages: {
          select: { id: true, sequence: true }
        },
        userProgress: {
          where: { userId: DEFAULT_USER_ID },
          select: { stageId: true, status: true }
        }
      },
      orderBy: { difficulty: 'asc' } // basic order
    });

    return projects;
  });
}

/**
 * Fetches a single project deeply initialized for detailed dashboard viewing.
 */
export async function getProjectDetails(projectId: string) {
  return withErrorHandling(async () => {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        stages: {
          orderBy: { sequence: 'asc' }
        },
        userProgress: {
          where: { userId: DEFAULT_USER_ID }
        }
      }
    });

    if (!project) throw Errors.notFound('Project');

    return project;
  });
}

/**
 * Updates a project stage. Awards exactly 50 XP if transitioned to COMPLETED
 * for the very first time. Idempotency guarantees are in place.
 */
export async function updateStageProgress(projectId: string, stageId: string, status: StageStatus) {
  return withErrorHandling(async () => {
    // 1. Verify existence + project matching
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    const stage = await prisma.projectStage.findUnique({ where: { id: stageId } });

    if (!project) throw Errors.notFound('Project');
    if (!stage || stage.projectId !== projectId) throw Errors.notFound('Project Stage');

    // 2. Perform upsert + conditional XP logic transactionally
    const progressRecord = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Upsert the core state
      const updateData: any = { status };
      if (status === 'IN_PROGRESS') updateData.startedAt = new Date();
      if (status === 'COMPLETED') updateData.completedAt = new Date();

      const progress = await tx.projectStageProgress.upsert({
        where: {
          userId_stageId: {
            userId: DEFAULT_USER_ID,
            stageId
          }
        },
        update: updateData,
        create: {
          userId: DEFAULT_USER_ID,
          projectId,
          stageId,
          status,
          startedAt: status === 'IN_PROGRESS' || status === 'COMPLETED' ? new Date() : null,
          completedAt: status === 'COMPLETED' ? new Date() : null,
        }
      });

      // 3. Exact Idempotent XP granting constraint
      if (status === 'COMPLETED' && !progress.xpAwarded) {
        // Log XP Event securely
        await tx.xpEvent.create({
          data: {
            userId: DEFAULT_USER_ID,
            amount: STAGE_XP_REWARD,
            reason: 'project_stage',
            sourceId: stageId
          }
        });

        // Set flag so we never award XP again if they revert stage state back and forth
        return await tx.projectStageProgress.update({
          where: { id: progress.id },
          data: { xpAwarded: true }
        });
      }

      return progress;
    });

    revalidatePath('/projects');
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/'); // For homepage overall XP updates
    return progressRecord;
  });
}
