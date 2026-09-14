'use client';

import { useTransition } from 'react';
import { ArrowLeft, Clock, Target, Box, CheckCircle2, Circle, Loader2, Play } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import { updateStageProgress } from '@/app/actions/projects';
import type { StageStatus } from '@/types/domain';

export default function ProjectDetailClient({ project }: { project: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const totalStages = project.stages.length;
  const completedStages = project.userProgress.filter((p: any) => p.status === 'COMPLETED').length;
  const completionPct = totalStages === 0 ? 0 : Math.round((completedStages / totalStages) * 100);

  function handleStatusChange(stageId: string, currentStatus: StageStatus | 'NOT_STARTED', nextStatus: StageStatus) {
    if (isPending) return;
    startTransition(async () => {
      await updateStageProgress(project.id, stageId, nextStatus);
    });
  }

  return (
    <div className="page-wrapper">
      {/* Header Back Navigation */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-tertiary)', textDecoration: 'none', fontSize: '0.85rem' }}>
          <ArrowLeft size={14} /> Back to Library
        </Link>
      </div>

      {/* Main Project Header Area */}
      <Panel padding="lg" style={{ marginBottom: 32, borderTop: '3px solid var(--accent)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
              {project.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: 24 }}>
              {project.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color="var(--info)" />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Est. Time</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>{project.durationEst}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={16} color="var(--due)" />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Difficulty</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, textTransform: 'capitalize' }}>{project.difficulty}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Box size={16} color="var(--accent)" />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Stages</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>{totalStages} Checkpoints</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ width: 140, textAlign: 'center', padding: 16, background: 'var(--bg-primary)', borderRadius: '50%', aspectRatio: '1/1', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '4px solid var(--panel-border)' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: completionPct === 100 ? 'var(--success)' : 'var(--accent)' }}>{completionPct}%</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: 4 }}>Completed</span>
          </div>
        </div>

        {/* Stack & Learnings */}
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--panel-border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 12 }}>Tech Stack</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {project.stack.split(',').map((s: string) => (
                <span key={s} style={{ background: 'var(--bg-primary)', border: '1px solid var(--panel-border)', padding: '4px 10px', borderRadius: 16, fontSize: '0.8rem', color: 'var(--info)' }}>
                  {s.trim()}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 12 }}>What you'll learn</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {project.whatYouLearn}
            </p>
          </div>
        </div>
      </Panel>

      {/* Structured Roadmap */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Implementation Roadmap</h2>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: 24 }}>Progress flexibly — complete stages in any order you build them.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {project.stages.map((stage: any) => {
            const userState = project.userProgress.find((p: any) => p.stageId === stage.id);
            const status: StageStatus | 'NOT_STARTED' = userState ? userState.status : 'NOT_STARTED';
            const xpAwarded = userState ? userState.xpAwarded : false;

            let bgColor = 'var(--panel-bg)';
            let borderColor = 'var(--panel-border)';
            if (status === 'IN_PROGRESS') {
              borderColor = 'var(--info)';
              bgColor = 'var(--info)11'; // light tint
            } else if (status === 'COMPLETED') {
              borderColor = 'var(--success)';
            }

            return (
              <div key={stage.id} style={{ 
                background: bgColor, border: `1px solid ${borderColor}`, padding: 20, borderRadius: 'var(--radius-md)',
                display: 'flex', gap: 20, alignItems: 'flex-start',
                position: 'relative'
              }}>
                <div style={{ background: status === 'COMPLETED' ? 'var(--success)' : 'var(--bg-primary)', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: status === 'COMPLETED' ? '#000' : 'var(--text-secondary)', flexShrink: 0, border: `1px solid ${borderColor}` }}>
                  {status === 'COMPLETED' ? <CheckCircle2 size={18} /> : stage.sequence}
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>{stage.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4 }}>{stage.description}</p>
                  
                  {/* Action Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
                    {status === 'NOT_STARTED' && (
                      <Button variant="ghost" size="sm" disabled={isPending} onClick={() => handleStatusChange(stage.id, status, 'IN_PROGRESS')} style={{ gap: 6, color: 'var(--info)' }}>
                        {isPending ? <Loader2 size={14} className="spin" /> : <Play size={14} />} Start Working
                      </Button>
                    )}
                    {status === 'IN_PROGRESS' && (
                      <Button variant="ghost" size="sm" disabled={isPending} onClick={() => handleStatusChange(stage.id, status, 'COMPLETED')} style={{ gap: 6, color: 'var(--success)' }}>
                        {isPending ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />} Mark Completed
                      </Button>
                    )}
                    {status === 'COMPLETED' && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle2 size={14} /> Completed {xpAwarded && '+50 XP Awarded'}
                      </span>
                    )}

                    {status !== 'NOT_STARTED' && status !== 'COMPLETED' && (
                      <Button variant="ghost" size="sm" disabled={isPending} onClick={() => handleStatusChange(stage.id, status, 'NOT_STARTED')} style={{ color: 'var(--text-tertiary)' }}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
