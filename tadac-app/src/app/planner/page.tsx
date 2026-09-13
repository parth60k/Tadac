import type { Metadata } from 'next';
import PlannerClient from './PlannerClient';

export const metadata: Metadata = {
  title: 'Planner',
  description: 'Plan your day, manage tasks, and schedule your week.',
};

export default function PlannerPage() {
  return <PlannerClient />;
}
