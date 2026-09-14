'use client';

import { useTransition } from 'react';
import { Target, PlusCircle, Loader2 } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import { createRevisionItem } from '@/app/actions/revision';
import { todayDate } from '@/lib/date';
import { useRouter } from 'next/navigation';

interface WeakArea {
  topic: string;
  accuracy: number;
  totalAttempts: number;
}

export default function WeakAreasPanel({ areas }: { areas: WeakArea[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!areas || areas.length === 0) return null;

  function handleAddToRevision(topic: string) {
    if (isPending) return;
    startTransition(async () => {
      const today = todayDate('Asia/Kolkata');
      // Adding it directly as a new revision tracking loop anchored today
      await createRevisionItem({
        topic,
        learnedAt: today,
        notes: 'Added from Interview Weak Areas',
        category: 'Interview',
      });
      alert(`Added "${topic}" to your Revision tracker!`);
      // Optionally route to revision page to show it
      router.refresh();
    });
  }

  return (
    <Panel padding="lg" style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Target size={18} color="var(--due)" />
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Weak Areas Detected
        </h2>
      </div>
      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: 20 }}>
        Based on your interview history, you're struggling with these topics. 
        Add them to your Spaced Repetition (Revision) timeline to master them.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {areas.map(area => (
          <div key={area.topic} style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', background: 'var(--panel-bg)', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--panel-border)'
           }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{area.topic}</span>
                <span style={{ fontSize: '0.8rem', color: area.accuracy < 50 ? 'var(--due)' : 'var(--accent)' }}>
                  {area.accuracy}% correct
                </span>
              </div>
              <div className="xp-bar-track" style={{ height: 6 }}>
                <div 
                  className="xp-bar-fill" 
                  style={{ width: `${area.accuracy}%`, background: area.accuracy < 50 ? 'var(--due)' : 'var(--accent)' }} 
                />
              </div>
            </div>
            
            <div style={{ marginLeft: 24 }}>
              <Button 
                variant="ghost" 
                size="sm" 
                disabled={isPending}
                onClick={() => handleAddToRevision(area.topic)}
                style={{ gap: 6, color: 'var(--accent)' }}
              >
                {isPending ? <Loader2 size={16} className="spin" /> : <PlusCircle size={16} />}
                Add to Revision
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
