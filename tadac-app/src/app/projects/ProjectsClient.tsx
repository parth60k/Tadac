'use client';

import { FolderGit2, ArrowRight, BookOpen, Clock, Activity } from 'lucide-react';
import Link from 'next/link';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';

export default function ProjectsClient({ initialProjects }: { initialProjects: any[] }) {
  
  // Isolate active vs all projects
  const activeProjects = initialProjects.filter(p => p.userProgress && p.userProgress.length > 0);

  function calculateProgress(project: any) {
    const totalStages = project.stages.length;
    if (totalStages === 0) return 0;
    const completedStages = project.userProgress.filter((up: any) => up.status === 'COMPLETED').length;
    return Math.round((completedStages / totalStages) * 100);
  }

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Project Library</h1>
      </div>

      {activeProjects.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Activity size={18} color="var(--accent)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>My Projects</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {activeProjects.map(project => {
              const progressPct = calculateProgress(project);
              return (
                <Link key={project.id} href={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
                  <Panel padding="md" style={{ cursor: 'pointer', transition: 'border-color 0.2s' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 10 }}>{project.name}</h3>
                    <div className="xp-bar-track" style={{ height: 6, marginBottom: 6 }}>
                      <div className="xp-bar-fill" style={{ width: `${progressPct}%`, background: 'var(--accent)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{progressPct}% Completed</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>Resume <ArrowRight size={10} style={{ display: 'inline' }} /></span>
                    </div>
                  </Panel>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <FolderGit2 size={18} color="var(--info)" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Explore Templates</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {initialProjects.map(project => {
            const difficulties: Record<string, string> = {
              beginner: 'var(--success)',
              intermediate: 'var(--info)',
              advanced: 'var(--due)'
            };
            const diffColor = difficulties[project.difficulty] || 'var(--text-secondary)';

            return (
              <Panel key={project.id} padding="lg" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700 }}>{project.name}</h3>
                  <span style={{ 
                    fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                    textTransform: 'uppercase', color: diffColor, border: `1px solid ${diffColor}`
                  }}>
                    {project.difficulty}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4, marginBottom: 16, flex: 1 }}>
                  {project.description}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {project.categories.split(',').map((cat: string) => (
                    <span key={cat} style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: 4 }}>
                      {cat.trim()}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                    <Clock size={12} /> {project.durationEst}
                  </div>
                  <Link href={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
                    <Button variant="ghost" size="sm" style={{ padding: '0 8px', color: 'var(--accent)' }}>View Project</Button>
                  </Link>
                </div>
              </Panel>
            );
          })}
        </div>
      </section>
    </div>
  );
}
