'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, BookOpen, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import RevisionCard from '@/components/revision/RevisionCard';
import RevisionDetail from '@/components/revision/RevisionDetail';
import RevisionForm from '@/components/revision/RevisionForm';
import { classifyCheckpoint } from '@/lib/date';
import type { CheckpointView } from '@/types/domain';

// ─── Types (mirroring Prisma return shape) ────────────────────────────────────

interface Checkpoint {
  id:           string;
  sequence:     number;
  intervalDays: number;
  dueDate:      string;
  status:       string;
  completedAt?: Date | string | null;
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

interface PageData {
  items: RevisionItem[];
  today: string;
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title, count, color }: {
  icon: React.ReactNode; title: string; count: number; color: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      {icon}
      <p className="section-title" style={{ margin: 0, color }}>
        {title}
      </p>
      <span style={{
        marginLeft: 4, fontSize: '0.65rem', fontWeight: 700,
        background: `${color}22`, color,
        padding: '1px 7px', borderRadius: 10,
      }}>
        {count}
      </span>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Panel padding="lg" style={{ textAlign: 'center', marginTop: 24 }}>
      <BookOpen size={36} color="var(--text-tertiary)" strokeWidth={1.5} style={{ margin: '0 auto 14px' }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 6 }}>
        No revision items yet.
      </p>
      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', marginBottom: 18 }}>
        Add a topic you&apos;ve learned today to start the Day 1/3/7/15/30 schedule.
      </p>
      <Button variant="primary" onClick={onAdd} id="rev-empty-add-btn">
        Add first revision
      </Button>
    </Panel>
  );
}

// ─── Main client ──────────────────────────────────────────────────────────────

export default function RevisionPageClient({ data }: { data: PageData }) {
  const router = useRouter();
  const { items, today } = data;

  const [showForm, setShowForm]     = useState(false);
  const [selected, setSelected]     = useState<{ item: RevisionItem; checkpointId: string } | null>(null);

  // Classify all checkpoints and build lists
  type WithView = Checkpoint & { view: CheckpointView };
  type ItemWithActive = { item: RevisionItem; cp: WithView };

  const due:      ItemWithActive[] = [];
  const overdue:  ItemWithActive[] = [];
  const upcoming: ItemWithActive[] = [];
  const completed: ItemWithActive[] = [];

  items.forEach(item => {
    item.checkpoints.forEach(cp => {
      const view = classifyCheckpoint(cp.dueDate, cp.status as 'PENDING' | 'COMPLETED', today);
      const entry: ItemWithActive = { item, cp: { ...cp, view } };
      if (view === 'DUE_TODAY')  due.push(entry);
      else if (view === 'OVERDUE')    overdue.push(entry);
      else if (view === 'UPCOMING')   upcoming.push(entry);
      else if (view === 'COMPLETED')  completed.push(entry);
    });
  });

  // Sort: due today & overdue by dueDate asc, upcoming by dueDate asc
  const sortByDate = (a: ItemWithActive, b: ItemWithActive) =>
    a.cp.dueDate.localeCompare(b.cp.dueDate);

  due.sort(sortByDate);
  overdue.sort(sortByDate);
  upcoming.sort(sortByDate);

  function openDetail(item: RevisionItem, checkpointId: string) {
    setSelected({ item, checkpointId });
  }

  function reloadPage() {
    // Server component will revalidate via server action — just close the panel
    setSelected(null);
    setShowForm(false);
    // Trigger a soft refresh with Next.js router
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Revision</h1>
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)} id="rev-add-btn" style={{ gap: 6 }}>
            <Plus size={16} /> Add topic
          </Button>
        </div>
        <EmptyState onAdd={() => setShowForm(true)} />
        {showForm && <RevisionForm onClose={reloadPage} />}
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Revision</h1>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)} id="rev-add-btn" style={{ gap: 6 }}>
          <Plus size={16} /> Add topic
        </Button>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Due today', value: due.length,      color: 'var(--accent)' },
          { label: 'Overdue',   value: overdue.length,  color: 'var(--due)' },
          { label: 'Upcoming',  value: upcoming.length, color: 'var(--info)' },
          { label: 'Topics',    value: items.length,    color: 'var(--text-secondary)' },
        ].map(stat => (
          <Panel key={stat.label} padding="sm" style={{ minWidth: 90, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.9rem', color: stat.color }}>{stat.value}</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 4 }}>{stat.label}</p>
          </Panel>
        ))}
      </div>

      {/* ── Due Today ─────────────────────────────────── */}
      {due.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <SectionHeader
            icon={<BookOpen size={14} color="var(--accent)" strokeWidth={2.5} />}
            title="Due Today" count={due.length} color="var(--accent)"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {due.map(({ item, cp }) => (
              <RevisionCard key={cp.id} item={item} checkpoint={cp} view="DUE_TODAY"
                onClick={() => openDetail(item, cp.id)} />
            ))}
          </div>
        </section>
      )}

      {/* ── Overdue ───────────────────────────────────── */}
      {overdue.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <SectionHeader
            icon={<AlertTriangle size={14} color="var(--due)" strokeWidth={2.5} />}
            title="Overdue" count={overdue.length} color="var(--due)"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {overdue.map(({ item, cp }) => (
              <RevisionCard key={cp.id} item={item} checkpoint={cp} view="OVERDUE"
                onClick={() => openDetail(item, cp.id)} />
            ))}
          </div>
        </section>
      )}

      {/* ── Upcoming ──────────────────────────────────── */}
      {upcoming.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <SectionHeader
            icon={<Clock size={14} color="var(--info)" strokeWidth={2} />}
            title="Upcoming (next 30 days)" count={upcoming.length} color="var(--info)"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcoming.slice(0, 10).map(({ item, cp }) => (
              <RevisionCard key={cp.id} item={item} checkpoint={cp} view="UPCOMING"
                onClick={() => openDetail(item, cp.id)} />
            ))}
          </div>
        </section>
      )}

      {/* ── Completed ─────────────────────────────────── */}
      {completed.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <SectionHeader
            icon={<CheckCircle2 size={14} color="var(--success)" strokeWidth={2} />}
            title="Completed" count={completed.length} color="var(--success)"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {completed.slice(0, 20).map(({ item, cp }) => (
              <RevisionCard key={cp.id} item={item} checkpoint={cp} view="COMPLETED"
                onClick={() => openDetail(item, cp.id)} />
            ))}
          </div>
        </section>
      )}

      {/* No active items */}
      {due.length === 0 && overdue.length === 0 && (
        <Panel padding="lg" style={{ textAlign: 'center', marginBottom: 24 }}>
          <CheckCircle2 size={32} color="var(--success)" strokeWidth={1.5} style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 6 }}>You&apos;re all caught up!</p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>
            No revisions due today. Next due: {upcoming.length > 0 ? upcoming[0].cp.dueDate : 'none scheduled.'}
          </p>
        </Panel>
      )}

      {/* Modals */}
      {showForm && <RevisionForm onClose={reloadPage} />}
      {selected && (
        <RevisionDetail
          item={selected.item}
          activeCheckpointId={selected.checkpointId}
          today={today}
          onClose={() => setSelected(null)}
          onDeleted={reloadPage}
        />
      )}
    </div>
  );
}
