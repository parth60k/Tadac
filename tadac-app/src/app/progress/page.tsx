import type { Metadata } from 'next';
import { getProgressSnapshot } from '@/app/actions/progress';
import ProgressClient from './ProgressClient';

export const metadata: Metadata = {
  title: 'Progress Hub',
  description: 'Your cumulative activity, streaks, and focus metrics.',
};

export default async function ProgressPage() {
  const data = await getProgressSnapshot('Asia/Kolkata'); // Ideally retrieved safely from settings.

  if (!data.success || !data.data) {
    return (
      <div className="page-wrapper">
        <p style={{ color: 'var(--due)' }}>Failed to fetch progress metrics.</p>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <ProgressClient data={data.data} />
    </div>
  );
}
