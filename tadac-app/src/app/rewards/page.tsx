import type { Metadata } from 'next';
import { getRewards } from '@/app/actions/rewards';
import RewardsClient from './RewardsClient';

export const metadata: Metadata = {
  title: 'Rewards',
  description: 'Manage your physical incentives and gamification rewards.',
};

export default async function RewardsPage() {
  const data = await getRewards();

  if (!data.success || !data.data) {
    return (
      <div className="page-wrapper">
        <p style={{ color: 'var(--due)' }}>Failed to load rewards.</p>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <RewardsClient initialRewards={data.data} />
    </div>
  );
}
