'use client';

/**
 * Create-revision form — shown in a slide-up panel.
 * On save shows the generated schedule before closing.
 */

import { useState, useTransition } from 'react';
import { X, Loader2, CalendarCheck } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { CATEGORIES, type Category } from '@/types/domain';
import { computeRevisionSchedule, todayDate, formatDateShort } from '@/lib/date';
import { createRevisionItem } from '@/app/actions/revision';

interface Props { onClose: () => void }

export default function RevisionForm({ onClose }: Props) {
  const [step, setStep]             = useState<'form' | 'preview'>('form');
  const [isPending, startTransition] = useTransition();
  const [error, setError]           = useState('');

  const today = todayDate('Asia/Kolkata');

  // Form fields
  const [topic,     setTopic]     = useState('');
  const [learnedAt, setLearnedAt] = useState(today);
  const [notes,     setNotes]     = useState('');
  const [source,    setSource]    = useState('');
  const [category,  setCategory]  = useState<Category>('Other');
  const [tagsInput, setTagsInput] = useState('');

  // Preview schedule state
  const [schedule, setSchedule]   = useState<Array<{ sequence: number; intervalDays: number; dueDate: string }>>([]);

  function handlePreview() {
    setError('');
    if (!topic.trim())    { setError('Topic is required.'); return; }
    setSchedule(computeRevisionSchedule(learnedAt));
    setStep('preview');
  }

  function handleSave() {
    startTransition(async () => {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const result = await createRevisionItem({ topic, learnedAt, notes, source, category, tags });
      if (!result.success) { setError(result.message); setStep('form'); }
      else                 { onClose(); }
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
      <Panel padding="lg" style={{ width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }} id="revision-form-panel">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {step === 'form' ? 'Add Revision Item' : 'Confirm Schedule'}
          </h2>
          <button onClick={onClose} aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* ── Step 1: Form ─────────────────────────── */}
        {step === 'form' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input id="rev-topic" label="Topic *" placeholder="e.g. PostgreSQL JOINs"
              value={topic} onChange={e => setTopic(e.target.value)} autoFocus required />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input id="rev-learned" label="Date learned *" type="date"
                value={learnedAt} onChange={e => setLearnedAt(e.target.value)} required />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                  Category
                </label>
                <select id="rev-category" value={category}
                  onChange={e => setCategory(e.target.value as Category)} className="input-field">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <Textarea id="rev-notes" label="Notes (optional)"
              placeholder="Key concepts, formulas, mnemonics…"
              value={notes} onChange={e => setNotes(e.target.value)} style={{ minHeight: 80 }} />

            <Input id="rev-source" label="Source / Reference (optional)"
              placeholder="Book, course, article URL…"
              value={source} onChange={e => setSource(e.target.value)} />

            <Input id="rev-tags" label="Tags (comma-separated)"
              placeholder="sql, joins, dbms"
              value={tagsInput} onChange={e => setTagsInput(e.target.value)} />

            {error && (
              <p style={{ fontSize: '0.8rem', color: 'var(--due)', padding: '8px 12px',
                background: 'var(--due-soft)', borderRadius: 8 }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="button" variant="primary" onClick={handlePreview} id="rev-preview-btn">
                Preview schedule →
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Schedule preview ────────────── */}
        {step === 'preview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{topic}</strong> will be scheduled for 5 revisions
              anchored to <strong>{formatDateShort(learnedAt)}</strong> (Day 0):
            </p>

            {/* Schedule list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {schedule.map(cp => (
                <div key={cp.sequence} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 'var(--radius-md)',
                  background: 'var(--panel-bg)', border: '1px solid var(--panel-border)',
                }}>
                  <CalendarCheck size={15} color="var(--accent)" strokeWidth={2} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      Revision #{cp.sequence}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginLeft: 8 }}>
                      Day {cp.intervalDays}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-pixel)', fontSize: '0.62rem',
                    color: cp.dueDate <= today ? 'var(--due)' : 'var(--accent)',
                  }}>
                    {formatDateShort(cp.dueDate)}
                  </span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              Completing a revision never shifts the remaining ones — all dates are anchored to Day 0.
            </p>

            {error && (
              <p style={{ fontSize: '0.8rem', color: 'var(--due)', padding: '8px 12px',
                background: 'var(--due-soft)', borderRadius: 8 }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setStep('form')} disabled={isPending}>← Edit</Button>
              <Button variant="primary" onClick={handleSave} disabled={isPending} id="rev-save-btn">
                {isPending ? <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving…</> : 'Save & schedule'}
              </Button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
