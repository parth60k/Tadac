import type { Metadata } from 'next';
import Panel from '@/components/ui/Panel';
import { BarChart2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Progress',
  description: 'Track your weekly focus time, revision completion, interview accuracy, and task stats.',
};

export default function ProgressPage() {
  return (
    <div className="page-wrapper">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>
        Progress
      </h1>
      <Panel padding="lg" style={{ textAlign: 'center' }}>
        <BarChart2 size={48} color="var(--info)" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Progress & Analytics — coming Day 12
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: 8 }}>
          Focus charts, category breakdowns, revision and interview accuracy over time.
        </p>
      </Panel>
    </div>
  );
}
