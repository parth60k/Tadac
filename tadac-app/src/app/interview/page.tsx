import type { Metadata } from 'next';
import { getDailyQuestions } from '@/app/actions/interview';
import InterviewClient from './InterviewClient';

export const metadata: Metadata = {
  title: 'Daily Practice',
  description: '5 Daily Interview Questions to keep you sharp.',
};

export default async function InterviewPage() {
  const data = await getDailyQuestions();
  
  if (!data.success) {
    return (
      <div className="page-wrapper">
        <p style={{ color: 'var(--due)' }}>Failed to load daily questions.</p>
      </div>
    );
  }

  return <InterviewClient initialData={data.data} />;
}
