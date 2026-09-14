import type { Metadata } from 'next';
import FocusPageClient from './FocusPageClient';
import { getTodayFocusSummary, getTodayTasksForFocus } from '@/app/actions/focus';

export const metadata: Metadata = {
  title: 'Focus',
  description: 'Run focused Pomodoro sessions and track your deep work time.',
};

export default async function FocusPage() {
  const [summary, tasks] = await Promise.all([
    getTodayFocusSummary(),
    getTodayTasksForFocus(),
  ]);

  return <FocusPageClient summary={summary} tasks={tasks} />;
}
