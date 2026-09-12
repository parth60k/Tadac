import type { Metadata } from 'next';
import Panel from '@/components/ui/Panel';
import { NotebookPen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Journal',
  description: 'Nightly reflection journal — what went well, what to improve, plan tomorrow.',
};

export default function JournalPage() {
  return (
    <div className="page-wrapper">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>
        Journal
      </h1>
      <Panel padding="lg" style={{ textAlign: 'center' }}>
        <NotebookPen size={48} color="var(--text-secondary)" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Journal & Nightly Flow — coming Day 11
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: 8 }}>
          Reflect on your day, write what you learned, and plan tomorrow.
        </p>
      </Panel>
    </div>
  );
}
