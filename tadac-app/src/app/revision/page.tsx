import type { Metadata } from 'next';
import Panel from '@/components/ui/Panel';
import { BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Revision',
  description: 'Spaced repetition revision system with deterministic Day 1/3/7/15/30 checkpoints.',
};

export default function RevisionPage() {
  return (
    <div className="page-wrapper">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>
        Revision
      </h1>
      <Panel padding="lg" style={{ textAlign: 'center' }}>
        <BookOpen size={48} color="var(--accent)" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Revision Engine — coming Days 6–7
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: 8 }}>
          Deterministic Day 1 → 3 → 7 → 15 → 30 spaced repetition checkpoints.
        </p>
      </Panel>
    </div>
  );
}
