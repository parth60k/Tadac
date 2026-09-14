import type { Metadata } from 'next';
import { BookOpen } from 'lucide-react';
import RevisionPageClient from './RevisionPageClient';
import { getRevisionItems } from '@/app/actions/revision';

export const metadata: Metadata = {
  title: 'Revision',
  description: 'Track your spaced-repetition revision schedule — Day 1/3/7/15/30.',
};

export default async function RevisionPage() {
  const data = await getRevisionItems();
  return <RevisionPageClient data={data} />;
}
