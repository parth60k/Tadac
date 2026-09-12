import type { Metadata } from 'next';
import Panel from '@/components/ui/Panel';
import { Timer } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Focus',
  description: 'Run focused Pomodoro sessions and track your deep work time.',
};

export default function FocusPage() {
  return (
    <div className="page-wrapper">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>
        Focus
      </h1>
      <Panel padding="lg" style={{ textAlign: 'center' }}>
        <Timer size={48} color="var(--accent)" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Focus Timer — coming Day 4
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: 8 }}>
          Pomodoro sessions, presets, and session history.
        </p>
      </Panel>
    </div>
  );
}
