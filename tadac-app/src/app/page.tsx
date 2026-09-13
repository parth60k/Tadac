import type { Metadata } from 'next';
import Link from 'next/link';
import { Timer, BookOpen, MessageSquare, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import XPBar from '@/components/ui/XPBar';
import Badge from '@/components/ui/Badge';
import { getDashboardData } from '@/app/actions/tasks';
import { formatDuration, formatDateFull, getGreeting } from '@/lib/date';
import { xpToNextLevel } from '@/types/domain';
import type { Category } from '@/types/domain';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Your daily productivity snapshot — tasks, revision, focus, and interview progress.',
};

export default async function HomePage() {
  const data = await getDashboardData();
  const { todayTasks, totalFocusMins, dueRevisions, interviewDone, interviewTotal, totalXP } = data;

  const { current: xpCurrent, needed: xpNeeded, level } = xpToNextLevel(totalXP);
  const greeting  = getGreeting();
  const dateLabel = formatDateFull();
  const focusGoalMins = 3 * 60; // 3 hours default goal

  const pendingTasks   = todayTasks.filter((t: { completed: boolean }) => !t.completed);
  const completedTasks = todayTasks.filter((t: { completed: boolean }) => t.completed);
  const showTasks      = [...pendingTasks, ...completedTasks].slice(0, 5);

  return (
    <div className="page-wrapper">
      {/* ── Greeting ─────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {greeting}, Parth.
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: '0.9rem' }}>{dateLabel}</p>
      </div>

      {/* ── XP + Focus row ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Panel padding="md" id="xp-panel">
          <p className="section-title" style={{ marginBottom: 12 }}>Level &amp; XP</p>
          <XPBar level={level} currentXP={xpCurrent} maxXP={xpNeeded} />
        </Panel>

        <Panel padding="md" id="focus-progress-panel">
          <p className="section-title" style={{ marginBottom: 8 }}>Focus Today</p>
          {totalFocusMins > 0 ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.9rem', color: 'var(--accent)' }}>
                  {formatDuration(totalFocusMins)}
                </span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                  / {formatDuration(focusGoalMins)}
                </span>
              </div>
              <div className="xp-bar-track" style={{ marginTop: 10 }}>
                <div
                  className="xp-bar-fill"
                  style={{
                    width: `${Math.min(100, (totalFocusMins / focusGoalMins) * 100)}%`,
                    background: 'linear-gradient(90deg,var(--info),#4a8eff)',
                  }}
                />
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: 8 }}>
              No sessions yet — start your first focus sprint!
            </p>
          )}
        </Panel>
      </div>

      {/* ── Tasks + Revision row ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Today's tasks */}
        {showTasks.length > 0 && (
          <Panel padding="md" id="tasks-today-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p className="section-title" style={{ margin: 0 }}>Today</p>
              <Link href="/planner" style={{ color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                All <ArrowRight size={12} />
              </Link>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {showTasks.map(task => (
                <li key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {task.completed
                    ? <CheckCircle2 size={17} color="var(--success)" strokeWidth={2} />
                    : <Circle       size={17} color="var(--text-tertiary)" strokeWidth={2} />
                  }
                  <span style={{
                    flex: 1, fontSize: '0.875rem',
                    color: task.completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    textDecoration: task.completed ? 'line-through' : 'none',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {task.title}
                  </span>
                  <Badge category={task.category as Category} size="sm" />
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {/* Revision due */}
        {dueRevisions > 0 && (
          <Panel padding="md" id="revision-summary-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <BookOpen size={15} color="var(--accent)" strokeWidth={2} />
              <p className="section-title" style={{ margin: 0 }}>Revision</p>
            </div>
            <p style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--due)' }}>
              {dueRevisions} due today
            </p>
            <Link href="/revision" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
              Review now <ArrowRight size={13} />
            </Link>
          </Panel>
        )}

        {/* Interview */}
        {interviewDone < interviewTotal && (
          <Panel padding="md" id="interview-summary-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <MessageSquare size={15} color="var(--info)" strokeWidth={2} />
              <p className="section-title" style={{ margin: 0 }}>Interview</p>
            </div>
            <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {interviewDone} / {interviewTotal} completed
            </p>
            <div className="xp-bar-track" style={{ marginTop: 10 }}>
              <div className="xp-bar-fill" style={{
                width: `${(interviewDone / interviewTotal) * 100}%`,
                background: 'linear-gradient(90deg,#bb86fc,#9c4dcc)',
              }} />
            </div>
            <Link href="/interview" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, color: 'var(--info)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
              Continue <ArrowRight size={13} />
            </Link>
          </Panel>
        )}

        {/* Quote — always show if space */}
        <Panel padding="md" id="quote-panel">
          <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>
            &ldquo;Do the next useful thing.&rdquo;
          </p>
          <p style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>— Custom</p>
        </Panel>
      </div>

      {/* Empty state */}
      {showTasks.length === 0 && dueRevisions === 0 && interviewDone >= interviewTotal && (
        <Panel padding="lg" style={{ textAlign: 'center', marginBottom: 16 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Your day is clear — add tasks in the Planner to get started.</p>
          <Link href="/planner" style={{ display: 'inline-flex', marginTop: 12 }}>
            <Button variant="ghost" size="sm">Open Planner</Button>
          </Link>
        </Panel>
      )}

      {/* ── Start Focus CTA ──────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
        <Link href="/focus" style={{ textDecoration: 'none' }}>
          <Button variant="primary" size="lg" id="start-focus-btn" style={{ gap: 10, paddingLeft: 32, paddingRight: 32 }}>
            <Timer size={20} strokeWidth={2} />
            Start Focus
          </Button>
        </Link>
      </div>
    </div>
  );
}
