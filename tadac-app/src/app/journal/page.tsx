import type { Metadata } from 'next';
import { todayDate } from '@/lib/date';
import { getDailySummary, getJournalEntry } from '@/app/actions/journal';
import JournalWizard from './JournalWizard';

export const metadata: Metadata = {
  title: 'Evening Wrap-up',
  description: 'Reflect on today and plan for tomorrow seamlessly.',
};

export default async function JournalPage() {
  const today = todayDate('Asia/Kolkata');
  
  // Concurrently fetch summary + existing journal if any
  const summaryRes = getDailySummary(today);
  const journalRes = getJournalEntry(today);

  const [summaryData, journalData] = await Promise.all([summaryRes, journalRes]);

  if (!summaryData.success) {
    return (
      <div className="page-wrapper">
        <p style={{ color: 'var(--due)' }}>Failed to load daily tracking stats.</p>
      </div>
    );
  }

  // Pre-fill journal if it was already filled out today
  const existingJournal = journalData.success ? journalData.data : null;

  return (
    <div className="page-wrapper" style={{ paddingBottom: 60 }}>
      <JournalWizard 
        today={today} 
        summary={summaryData.data} 
        existingJournal={existingJournal} 
      />
    </div>
  );
}
