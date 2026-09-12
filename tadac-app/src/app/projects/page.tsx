import type { Metadata } from 'next';
import Panel from '@/components/ui/Panel';
import { FolderKanban } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Work through curated software build projects stage by stage.',
};

export default function ProjectsPage() {
  return (
    <div className="page-wrapper">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>
        Projects
      </h1>
      <Panel padding="lg" style={{ textAlign: 'center' }}>
        <FolderKanban size={48} color="var(--success)" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Project Library — coming Day 10
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: 8 }}>
          Curated builds (URL Shortener, Booking System…) with stage-by-stage progress.
        </p>
      </Panel>
    </div>
  );
}
