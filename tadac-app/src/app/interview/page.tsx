import type { Metadata } from 'next';
import Panel from '@/components/ui/Panel';
import { MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Interview',
  description: 'Daily interview practice questions covering DSA, OOP, DBMS, OS, aptitude, and more.',
};

export default function InterviewPage() {
  return (
    <div className="page-wrapper">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>
        Interview
      </h1>
      <Panel padding="lg" style={{ textAlign: 'center' }}>
        <MessageSquare size={48} color="var(--info)" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Daily Interview Questions — coming Day 8
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: 8 }}>
          5 curated questions per day. MCQ, true/false, and short answer formats.
        </p>
      </Panel>
    </div>
  );
}
