import type { Metadata } from 'next';
import Panel from '@/components/ui/Panel';
import { CalendarDays } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Planner',
  description: 'Plan your day, manage tasks, and schedule your week.',
};

export default function PlannerPage() {
  return (
    <div className="page-wrapper">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>
        Planner
      </h1>
      <Panel padding="lg" style={{ textAlign: 'center' }}>
        <CalendarDays size={48} color="var(--accent)" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Planner — coming Day 3
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: 8 }}>
          Create tasks, manage priorities, and plan tomorrow.
        </p>
      </Panel>
    </div>
  );
}
