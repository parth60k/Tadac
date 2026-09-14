import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  createRevisionItem,
  markCheckpointRevised,
  updateRevisionLearnedDate,
  deleteRevisionItem,
  getRevisionCounts,
  getRevisionItem
} from '../revision';
import { todayDate } from '@/lib/date';

describe('Revision Engine - Actions & DB Integration', () => {
  const DEFAULT_USER_ID = 'user_default';
  
  beforeEach(async () => {
    // Ensure isolated user exists
    await prisma.user.upsert({
      where: { id: DEFAULT_USER_ID },
      create: { id: DEFAULT_USER_ID, name: 'Test User' },
      update: {}
    });
    // Clear any previous revision items for safety
    await prisma.revisionItem.deleteMany({ where: { userId: DEFAULT_USER_ID } });
    await prisma.xpEvent.deleteMany({ where: { userId: DEFAULT_USER_ID, reason: 'revision' } });
    
    // We mock the system time so todayDate() logic aligns with our static test values
    vi.useFakeTimers();
  });

  afterEach(async () => {
    vi.useRealTimers();
  });

  it('11. idempotent create: repeated calls DO NOT create duplicates', async () => {
    const topic = "Idempotency Test";
    const date = "2026-09-01";
    
    const r1: any = await createRevisionItem({ topic, learnedAt: date });
    expect(r1.success).toBe(true);
    
    const r2: any = await createRevisionItem({ topic, learnedAt: date });
    expect(r2.success).toBe(true);

    // Should be exactly same item ID mapped to UPSERT no-op
    expect(r2.data.item.id).toBe(r1.data.item.id);

    const count = await prisma.revisionItem.count({ where: { topic } });
    expect(count).toBe(1);
    
    const cpCount = await prisma.revisionCheckpoint.count({ where: { revisionItemId: r1.data.item.id }});
    expect(cpCount).toBe(5);
  });

  it('8, 9, 10. completing and overdue checkpoint handling + idempotent XP', async () => {
    // Current logical today is 2026-09-15
    vi.setSystemTime(new Date('2026-09-15T12:00:00+05:30'));
    
    const r1: any = await createRevisionItem({
      topic: "Overdue Test",
      learnedAt: "2026-09-01"
    });
    expect(r1.success).toBe(true);
    const { item } = r1.data;

    const countsBefore = await getRevisionCounts();
    // 3 are pending and <= today (09-02, 09-04, 09-08) => Due/Overdue count == 3
    expect(countsBefore.dueCount).toBe(3);

    // Get the day 1 checkpoint
    const day1Cp = item.checkpoints.find((c: any) => c.sequence === 1);
    expect(day1Cp).toBeDefined();
    expect(day1Cp.dueDate).toBe('2026-09-02');
    
    // Complete it!
    const markRes: any = await markCheckpointRevised(day1Cp.id);
    expect(markRes.success).toBe(true);

    const countsAfter = await getRevisionCounts();
    // Now only 2 are pending due/overdue
    expect(countsAfter.dueCount).toBe(2);

    // Verify XP generated
    const xpRecords = await prisma.xpEvent.findMany({ 
      where: { sourceId: day1Cp.id, reason: 'revision' }
    });
    expect(xpRecords).toHaveLength(1);
    expect(xpRecords[0].amount).toBe(15);
    
    // 10. Repeated completion attempt
    const markRes2: any = await markCheckpointRevised(day1Cp.id);
    expect(markRes2.success).toBe(true);
    
    // XPS should NOT double
    const xpRecordsAfter = await prisma.xpEvent.findMany({ 
      where: { sourceId: day1Cp.id, reason: 'revision' }
    });
    expect(xpRecordsAfter).toHaveLength(1);
  });

  it('12, 16. edited learning date strictly recalculates via Day 0 anchor', async () => {
    const r1: any = await createRevisionItem({
      topic: "Edit Test",
      learnedAt: "2026-09-10"
    });
    expect(r1.success).toBe(true);
    const { item } = r1.data;

    // Day 1 => 09-11
    let day1Cp: any = await prisma.revisionCheckpoint.findFirst({ where: { revisionItemId: item.id, sequence: 1 }});
    expect(day1Cp?.dueDate).toBe('2026-09-11');

    // Update learnedAt to "2026-09-20"
    await updateRevisionLearnedDate(item.id, '2026-09-20');

    // Get the item again to see checkpoints
    const updated: any = await getRevisionItem(item.id);
    day1Cp = updated.item.checkpoints.find((c: any) => c.sequence === 1);
    
    // Day 1 => 09-21
    expect(day1Cp?.dueDate).toBe('2026-09-21');
    
    // Day 15 => 10-05
    const day4Cp = updated.item.checkpoints.find((c: any) => c.sequence === 4);
    expect(day4Cp?.dueDate).toBe('2026-10-05');
  });

  it('13, 15. deleted item zeroes out counts accurately (cascading)', async () => {
    vi.setSystemTime(new Date('2026-09-15T12:00:00+05:30'));
    
    const r1: any = await createRevisionItem({
      topic: "Delete Test",
      learnedAt: "2026-09-14"
    });
    expect(r1.success).toBe(true);

    // Day 1 is 09-15 (Due Today)
    const countsBefore = await getRevisionCounts();
    expect(countsBefore.dueCount).toBe(1);

    // Delete it
    await deleteRevisionItem(r1.data.item.id);

    const countsAfter = await getRevisionCounts();
    expect(countsAfter.dueCount).toBe(0); // Item and checkpoints gone
    
    // Double verify db cascading
    const checkpointsStillExisting = await prisma.revisionCheckpoint.count({ where: { revisionItemId: r1.data.item.id }});
    expect(checkpointsStillExisting).toBe(0);
  });
});

