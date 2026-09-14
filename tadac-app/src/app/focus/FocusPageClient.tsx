'use client';

import { Timer, BarChart2 } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import { FocusProvider } from '@/lib/focus-context';
import FocusTimer from '@/components/focus/FocusTimer';
import FocusControls from '@/components/focus/FocusControls';
import PresetSelector from '@/components/focus/PresetSelector';
import CategoryTaskPicker from '@/components/focus/CategoryTaskPicker';
import SessionCompleteCard from '@/components/focus/SessionCompleteCard';
import { useFocus } from '@/lib/focus-context';
import { formatDuration } from '@/lib/date';

// ─── Types mirroring server return ────────────────────────────────────────────

interface FocusSummary {
  totalMins:    number;
  sessionCount: number;
}

interface Task {
  id:       string;
  title:    string;
  category: string;
}

// ─── Inner layout (needs useFocus) ────────────────────────────────────────────

function FocusLayout({
  summary,
  tasks,
}: {
  summary: FocusSummary;
  tasks:   Task[];
}) {
  const { state } = useFocus();
  const { phase } = state;

  const isActive   = phase === 'running' || phase === 'paused' || phase === 'break';
  const isComplete = phase === 'completed';
  const isIdle     = phase === 'idle';

  const goalMins     = 3 * 60;
  const progressPct  = Math.min(100, (summary.totalMins / goalMins) * 100);

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Timer size={22} color="var(--accent)" strokeWidth={1.8} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Focus
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* ── Timer panel ───────────────────────────────── */}
        <Panel
          padding="lg"
          style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            gap:            28,
            position:       'relative',
            minHeight:      480,
            justifyContent: 'center',
          }}
          id="focus-timer-panel"
        >
          {/* Session complete overlay */}
          {isComplete && <SessionCompleteCard />}

          {/* Timer ring */}
          <FocusTimer />

          {/* Context label during break */}
          {phase === 'break' && (
            <p style={{
              fontSize:   '0.8rem',
              color:      'var(--text-tertiary)',
              textAlign:  'center',
              fontWeight: 500,
            }}>
              Take a breather — next focus session starts automatically.
            </p>
          )}

          {/* Controls */}
          <FocusControls />

          {/* Cycle count during active session */}
          {isActive && (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
              Cycle {state.cyclesCompleted + 1}
              {state.preset !== 'custom' && ` of ${state.config.cycles}`}
            </p>
          )}
        </Panel>

        {/* ── Right column ──────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Today's stats */}
          <Panel padding="md" id="focus-stats-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <BarChart2 size={15} color="var(--info)" strokeWidth={2} />
              <p className="section-title" style={{ margin: 0 }}>Today</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {formatDuration(summary.totalMins)}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 2 }}>focused</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {summary.sessionCount}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 2 }}>sessions</p>
              </div>
            </div>

            {/* Progress toward 3h goal */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Goal</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                  {formatDuration(goalMins)}
                </span>
              </div>
              <div className="xp-bar-track">
                <div
                  className="xp-bar-fill"
                  style={{
                    width:      `${progressPct}%`,
                    background: 'linear-gradient(90deg, var(--info), #4a8eff)',
                  }}
                />
              </div>
            </div>
          </Panel>

          {/* Preset selector — idle only */}
          {isIdle && (
            <Panel padding="md" id="focus-presets-panel">
              <p className="section-title" style={{ marginBottom: 12 }}>Preset</p>
              <PresetSelector />
            </Panel>
          )}

          {/* Category + task picker — idle only */}
          {isIdle && (
            <Panel padding="md" id="focus-config-panel">
              <CategoryTaskPicker tasks={tasks} />
            </Panel>
          )}

          {/* Active session info */}
          {isActive && (
            <Panel padding="md" id="focus-session-info-panel">
              <p className="section-title" style={{ marginBottom: 12 }}>Session</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Row label="Preset" value={state.preset} />
                <Row label="Category" value={state.category} />
                {state.linkedTaskId && tasks.find(t => t.id === state.linkedTaskId) && (
                  <Row
                    label="Task"
                    value={tasks.find(t => t.id === state.linkedTaskId)!.title}
                  />
                )}
                <Row
                  label="Focus mins"
                  value={`${Math.round(state.elapsedFocusSecs / 60)}m elapsed`}
                />
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>{label}</span>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ─── Wrap with FocusProvider ──────────────────────────────────────────────────

export default function FocusPageClient({
  summary,
  tasks,
}: {
  summary: FocusSummary;
  tasks:   Task[];
}) {
  return (
    <FocusProvider xpPerSession={30}>
      <FocusLayout summary={summary} tasks={tasks} />
    </FocusProvider>
  );
}
