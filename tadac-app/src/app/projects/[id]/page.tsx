import type { Metadata } from 'next';
import { getProjectDetails } from '@/app/actions/projects';
import ProjectDetailClient from './ProjectDetailClient';

export const metadata: Metadata = {
  title: 'Project Details',
  description: 'Deep dive into standard project tracking and stage completion.',
};

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const data = await getProjectDetails(params.id);
  
  if (!data.success || !data.data) {
    return (
      <div className="page-wrapper">
        <p style={{ color: 'var(--due)' }}>Failed to load project details.</p>
      </div>
    );
  }

  return <ProjectDetailClient project={data.data} />;
}
