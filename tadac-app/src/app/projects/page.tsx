import type { Metadata } from 'next';
import { getProjectsList } from '@/app/actions/projects';
import ProjectsClient from './ProjectsClient';

export const metadata: Metadata = {
  title: 'Project Library',
  description: 'Curated projects to build domain expertise and earn major XP.',
};

export default async function ProjectsPage() {
  const data = await getProjectsList();
  
  if (!data.success || !data.data) {
    return (
      <div className="page-wrapper">
        <p style={{ color: 'var(--due)' }}>Failed to fetch project library.</p>
      </div>
    );
  }

  return <ProjectsClient initialProjects={data.data} />;
}
