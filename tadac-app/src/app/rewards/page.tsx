import type { Metadata } from 'next';
import Panel from '@/components/ui/Panel';
import { Gift } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Rewards',
  description: 'Create personal real-life rewards tied to your productivity milestones.',
};

export default function RewardsPage() {
  return (
    <div className="page-wrapper">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>
        Rewards
      </h1>
      <Panel padding="lg" style={{ textAlign: 'center' }}>
        <Gift size={48} color="var(--accent)" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Personal Rewards — coming Day 12
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: 8 }}>
          Define real-life rewards (e.g. &ldquo;Cold coffee after 3h focus&rdquo;) and redeem them.
        </p>
      </Panel>
    </div>
  );
}
