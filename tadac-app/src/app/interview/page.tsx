import type { Metadata } from 'next';
import { getDailyQuestions, getWeakAreas } from '@/app/actions/interview';
import InterviewClient from './InterviewClient';
import WeakAreasPanel from './WeakAreasPanel';
import ExternalPractice from './ExternalPractice';

export const metadata: Metadata = {
  title: 'Daily Practice',
  description: '5 Daily Interview Questions to keep you sharp.',
};

export default async function InterviewPage() {
  const data = await getDailyQuestions();
  const weakAreasRes = await getWeakAreas();
  const weakAreas = weakAreasRes?.success ? weakAreasRes.data : [];
  
  if (!data.success) {
    return (
      <div className="page-wrapper">
        <p style={{ color: 'var(--due)' }}>Failed to load daily questions.</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Quiz Area */}
      <InterviewClient initialData={data.data} />
      
      {/* Analytics & Ext. Resources below */}
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <WeakAreasPanel areas={weakAreas} />
        <ExternalPractice />
      </div>
    </div>
  );
}
