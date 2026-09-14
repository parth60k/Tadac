'use client';

/**
 * Revision detail panel — shows full item info + mark as revised.
 * Design spec §14:
 *   After completion show: "✓ Revision completed / Next: Sep 28 · Revision #4"
 *   The next date must be from the STORED schedule — not recalculated.
 */

import { useState, useTransition } from 'react';
import { X, CheckCircle2, BookOpen, Tag, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import { markCheckpointRevised, deleteRevisionItem } from '@/app/actions/revision';
import { formatDateShort, classifyCheckpoint } from '@/lib/date';
import type { CheckpointView } from '@/types/domain';

interface Checkpoint {
  id:           string;
  sequence:     number;
  intervalDays: number;
  dueDate:      string;
  status:       string;
  completedAt?: string | Date | null;
}

interface RevisionItem {
  id:          string;
  topic:       string;
  notes:       string;
  source:      string;
  category:    string;
  tags:        string;
  learnedAt:   string;
  checkpoints: Checkpoint[];
}

interface Props {
  item:     RevisionItem;
  activeCheckpointId: string;   // which checkpoint to act on
  today:    string;
  onClose:  () => void;
  onDeleted: () => void;
}

const VIEW_LABEL: Record<CheckpointView, string> = {
  DUE_TODAY: 'Due today',
  OVERDUE:   'Overdue',
  UPCOMING:  'Upcoming',
  COMPLETED: 'Completed',
};

const VIEW_COLOR: Record<CheckpointView, string> = {
  DUE_TODAY: 'var(--accent)',
  OVERDUE:   'var(--due)',
  UPCOMING:  'var(--info)',
  COMPLETED: 'var(--success)',
};

export default function RevisionDetail({ item, activeCheckpointId, today, onClose, onDeleted }: Props) {
  const [isPending, startTransition] = useTransition();
  const [completed, setCompleted]    = useState(false);
  const [error, setError]            = useState('');

  const activeCP = item.checkpoints.find(cp => cp.id === activeCheckpointId)
    ?? item.checkpoints[0];

  const cpView = classifyCheckpoint(
    activeCP.dueDate,
    activeCP.status as 'PENDING' | 'COMPLETED',
    today
  );

  const isAlreadyDone = activeCP.status === 'COMPLETED' || completed;

  // Find the next PENDING checkpoint after this one
  const nextCP = item.checkpoints.find(
    cp => cp.sequence > activeCP.sequence && cp.status === 'PENDING'
  );

  const tags = item.tags ? item.tags.split(',').filter(Boolean) : [];

  function handleMark() {
    startTransition(async () => {
      const result = await markCheckpointRevised(activeCP.id);
      if (!result.success) { setError(result.message); }
      else                 { setCompleted(true); }
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${item.topic}" and all its revisions?`)) return;
    startTransition(async () => {
      const result = await deleteRevisionItem(item.id);
      if (!result.success) { setError(result.message); }
      else                 { onDeleted(); }
    });
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <Panel padding="lg" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }} id="revision-detail-panel">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {item.topic}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', color: VIEW_COLOR[cpView], fontWeight: 700 }}>
                {VIEW_LABEL[cpView]}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                Revision #{activeCP.sequence} · Day {activeCP.intervalDays}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                Due {formatDateShort(activeCP.dueDate)}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleDelete} disabled={isPending} aria-label="Delete revision item"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 4 }}>
              <Trash2 size={17} />
            </button>
            <button onClick={onClose} aria-label="Close"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 4 }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Completion state ────────────────────── */}
        {isAlreadyDone ? (
          <div style={{
            padding: '16px 20px', borderRadius: 'var(--radius-md)',
            background: 'rgba(111,207,151,0.1)', border: '1px solid var(--success)',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <CheckCircle2 size={20} color="var(--success)" strokeWidth={2} />
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--success)' }}>
                Revision #{activeCP.sequence} completed!
              </p>
            </div>
            {nextCP ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Next: <strong>{formatDateShort(nextCP.dueDate)}</strong> · Revision #{nextCP.sequence}
              </p>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                🎉 All 5 revisions completed for this topic!
              </p>
            )}
          </div>
        ) : null}

        {/* ── Meta row ──────────────────────────── */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
            📅 Learned {formatDateShort(item.learnedAt)}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
            {item.category}
          </span>
          {tags.map(t => (
            <span key={t} style={{
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: '0.7rem', color: 'var(--text-tertiary)',
              padding: '1px 7px', borderRadius: 10, border: '1px solid var(--panel-border)',
            }}>
              <Tag size={9} /> {t}
            </span>
          ))}
        </div>

        {/* ── Notes ─────────────────────────────── */}
        {item.notes && (
          <div style={{ marginBottom: 18 }}>
            <p className="section-title" style={{ marginBottom: 8 }}>Notes</p>
            <div style={{
              padding: '12px 16px', borderRadius: 'var(--radius-md)',
              background: 'var(--panel-bg)', border: '1px solid var(--panel-border)',
              fontSize: '0.875rem', color: 'var(--text-primary)',
              lineHeight: 1.7, whiteSpace: 'pre-wrap',
            }}>
              {item.notes}
            </div>
          </div>
        )}

        {/* ── Source ────────────────────────────── */}
        {item.source && (
          <div style={{ marginBottom: 18 }}>
            <p className="section-title" style={{ marginBottom: 8 }}>Source</p>
            {item.source.startsWith('http') ? (
              <a href={item.source} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--info)', textDecoration: 'none' }}>
                <ExternalLink size={13} /> {item.source}
              </a>
            ) : (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.source}</p>
            )}
          </div>
        )}

        {/* ── Full schedule checklist ────────────── */}
        <div style={{ marginBottom: 20 }}>
          <p className="section-title" style={{ marginBottom: 8 }}>Schedule</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {item.checkpoints.map(cp => {
              const v = classifyCheckpoint(cp.dueDate, cp.status as 'PENDING' | 'COMPLETED', today);
              const isActive = cp.id === activeCP.id;
              return (
                <div key={cp.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${isActive ? VIEW_COLOR[v] : 'var(--panel-border)'}`,
                  background: isActive ? `${VIEW_COLOR[v]}11` : 'transparent',
                }}>
                  {v === 'COMPLETED'
                    ? <CheckCircle2 size={15} color="var(--success)" strokeWidth={2} />
                    : <div style={{ width: 15, height: 15, borderRadius: '50%', border: `2px solid ${VIEW_COLOR[v]}`, flexShrink: 0 }} />
                  }
                  <span style={{ fontSize: '0.8rem', color: VIEW_COLOR[v], fontWeight: isActive ? 700 : 400, flex: 1 }}>
                    Revision #{cp.sequence} – Day {cp.intervalDays}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                    {formatDateShort(cp.dueDate)}
                  </span>
                  {v !== 'COMPLETED' && (
                    <span style={{ fontSize: '0.68rem', color: VIEW_COLOR[v], fontWeight: 600 }}>
                      {VIEW_LABEL[v]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Error ─────────────────────────────── */}
        {error && (
          <p style={{ fontSize: '0.8rem', color: 'var(--due)', padding: '8px 12px',
            background: 'var(--due-soft)', borderRadius: 8, marginBottom: 12 }}>{error}</p>
        )}

        {/* ── Action ────────────────────────────── */}
        {!isAlreadyDone && (
          <Button
            variant="primary"
            onClick={handleMark}
            disabled={isPending}
            id="rev-mark-done-btn"
            style={{ width: '100%', gap: 8 }}
          >
            {isPending
              ? <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving…</>
              : <><BookOpen size={15} /> Mark as revised</>
            }
          </Button>
        )}
      </Panel>
    </div>
  );
}
