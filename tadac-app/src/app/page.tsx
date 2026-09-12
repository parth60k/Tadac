import type { Metadata } from 'next';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import XPBar from '@/components/ui/XPBar';
import Badge from '@/components/ui/Badge';
import { Timer, BookOpen, MessageSquare, ArrowRight, CheckCircle2, Circle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Your daily productivity snapshot — tasks, revision, focus, and interview progress.',
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function HomePage() {
  const greeting = getGreeting();
  const date = formatDate();

  // Placeholder data — will come from DB in Day 3+
  const mockTasks = [
    { id: '1', title: 'Complete backend assignment', done: true,  category: 'Development' },
    { id: '2', title: 'Solve 3 DSA problems',        done: false, category: 'DSA' },
    { id: '3', title: 'Review PostgreSQL joins',      done: false, category: 'College' },
  ];

  const dueRevisions    = 3;
  const upcomingRevisions = 2;
  const interviewDone   = 3;
  const interviewTotal  = 5;
  const focusDone       = '02h 42m';
  const focusGoal       = '03h';
  const level           = 12;
  const currentXP       = 1840;
  const maxXP           = 2000;

  return (
    <div className="page-wrapper">
      {/* ── Greeting & Date ─────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {greeting}, Parth.
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: '0.9rem' }}>{date}</p>
      </div>

      {/* ── Top row: XP + Focus ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Panel padding="md" id="xp-panel">
          <p className="section-title" style={{ marginBottom: 12 }}>Level & XP</p>
          <XPBar level={level} currentXP={currentXP} maxXP={maxXP} />
        </Panel>

        <Panel padding="md" id="focus-progress-panel">
          <p className="section-title" style={{ marginBottom: 8 }}>Focus Today</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '1rem', color: 'var(--accent)' }}>
              {focusDone}
            </span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>/ {focusGoal}</span>
          </div>
          <div className="xp-bar-track" style={{ marginTop: 10 }}>
            <div
              className="xp-bar-fill"
              style={{ width: '89%', background: 'linear-gradient(90deg,var(--info),#4a8eff)' }}
            />
          </div>
        </Panel>
      </div>

      {/* ── Main grid ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Today's Tasks */}
        <Panel padding="md" id="tasks-today-panel">
          <p className="section-title" style={{ marginBottom: 12 }}>Today</p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mockTasks.map(task => (
              <li key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {task.done
                  ? <CheckCircle2 size={18} color="var(--success)" strokeWidth={2} />
                  : <Circle       size={18} color="var(--text-tertiary)" strokeWidth={2} />
                }
                <span
                  style={{
                    flex: 1,
                    fontSize: '0.9rem',
                    color: task.done ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    textDecoration: task.done ? 'line-through' : 'none',
                  }}
                >
                  {task.title}
                </span>
                <Badge category={task.category as 'Development' | 'DSA' | 'College'} />
              </li>
            ))}
          </ul>
        </Panel>

        {/* Revision */}
        <Panel padding="md" id="revision-summary-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <BookOpen size={16} color="var(--accent)" strokeWidth={2} />
            <p className="section-title" style={{ margin: 0 }}>Revision</p>
          </div>
          {dueRevisions > 0 && (
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--due)', marginBottom: 4 }}>
              {dueRevisions} due today
            </p>
          )}
          {upcomingRevisions > 0 && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {upcomingRevisions} upcoming
            </p>
          )}
          <a
            href="/revision"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}
          >
            View all <ArrowRight size={14} />
          </a>
        </Panel>

        {/* Interview */}
        <Panel padding="md" id="interview-summary-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <MessageSquare size={16} color="var(--info)" strokeWidth={2} />
            <p className="section-title" style={{ margin: 0 }}>Interview</p>
          </div>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {interviewDone} / {interviewTotal} completed
          </p>
          <div className="xp-bar-track" style={{ marginTop: 10 }}>
            <div
              className="xp-bar-fill"
              style={{ width: `${(interviewDone / interviewTotal) * 100}%`, background: 'linear-gradient(90deg,#bb86fc,#9c4dcc)' }}
            />
          </div>
          <a
            href="/interview"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, color: 'var(--info)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}
          >
            Continue <ArrowRight size={14} />
          </a>
        </Panel>

        {/* Quote */}
        <Panel padding="md" id="quote-panel">
          <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            &ldquo;Do the next useful thing.&rdquo;
          </p>
          <p style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>— Custom</p>
        </Panel>
      </div>

      {/* ── Start Focus CTA ─────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
        <a href="/focus" style={{ textDecoration: 'none' }}>
          <Button
            variant="primary"
            size="lg"
            id="start-focus-btn"
            style={{ gap: 10, paddingLeft: 32, paddingRight: 32, fontSize: '1rem' }}
          >
            <Timer size={20} strokeWidth={2} />
            Start Focus
          </Button>
        </a>
      </div>
    </div>
  );
}
