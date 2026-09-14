'use client';

import { useState, useTransition } from 'react';
import { BookOpen, Timer, CheckCircle2, MessageSquare, Target, Save, ArrowRight, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import { formatDuration } from '@/lib/date';
import { submitJournalEntry } from '@/app/actions/journal';
import type { JournalInput } from '@/app/actions/journal';

type DailySummary = {
  date: string;
  totalFocusMins: number;
  tasksCompleted: number;
  tasksTotal: number;
  interviews: number;
  revisionsCompleted: number;
  revisionsPending: number;
  totalXP: number;
};

export default function JournalWizard({ today, summary, existingJournal }: { today: string; summary: DailySummary; existingJournal: any }) {
  const [step, setStep] = useState<number>(1);
  const [isPending, startTransition] = useTransition();

  // Form State
  const [wentWell, setWentWell]               = useState(existingJournal?.wentWell || '');
  const [wentBadly, setWentBadly]             = useState(existingJournal?.wentBadly || '');
  const [learned, setLearned]                 = useState(existingJournal?.learned || '');
  const [improveTomorrow, setImproveTomorrow] = useState(existingJournal?.improveTomorrow || '');
  
  const initialPriorities = existingJournal ? JSON.parse(existingJournal.tomorrowPriorities) : ['', '', ''];
  const [priorities, setPriorities]           = useState<string[]>(
    [initialPriorities[0]||'', initialPriorities[1]||'', initialPriorities[2]||'']
  );

  function handlePriorityChange(index: number, val: string) {
    const copy = [...priorities];
    copy[index] = val;
    setPriorities(copy);
  }

  function submitFlow() {
    startTransition(async () => {
      const payload: JournalInput = {
        entryDate: today,
        wentWell,
        wentBadly,
        learned,
        improveTomorrow,
        tomorrowPriorities: priorities,
        tomorrowExtras: [] 
      };
      const res = await submitJournalEntry(payload);
      if (res?.success) {
        setStep(4); // Success screen
      } else {
        alert('Failed to save journal.');
      }
    });
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      
      {/* Progress Bar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Evening Wrap-up</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1,2,3,4].map(s => (
            <div key={s} style={{ 
              height: 4, width: 30, borderRadius: 2,
              background: s <= step ? 'var(--accent)' : 'var(--panel-border)' 
            }} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 16, color: 'var(--text-secondary)' }}>Today's Output</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            
            <Panel padding="md" style={{ textAlign: 'center', borderTop: '2px solid var(--accent)' }}>
              <Sparkles size={24} color="var(--accent)" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>{summary.totalXP}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>XP Earned Today</div>
            </Panel>

            <Panel padding="md" style={{ textAlign: 'center', borderTop: '2px solid var(--info)' }}>
              <Timer size={24} color="var(--info)" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--info)' }}>{formatDuration(summary.totalFocusMins)}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Deep Focus</div>
            </Panel>

            <Panel padding="md" style={{ textAlign: 'center', borderTop: '2px solid var(--success)' }}>
              <CheckCircle2 size={24} color="var(--success)" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
                {summary.tasksCompleted} <span style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>/ {summary.tasksTotal}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Tasks Completed</div>
            </Panel>

            <Panel padding="md" style={{ textAlign: 'center', borderTop: '2px solid #ff9800' }}>
              <BookOpen size={24} color="#ff9800" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ff9800' }}>
                {summary.revisionsCompleted} <span style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>(+{summary.interviews})</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Revs & Mock Apps</div>
            </Panel>

          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={() => setStep(2)} style={{ gap: 8 }}>
              Continue to Reflection <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="fade-in">
          <h2 style={{ fontSize: '1.2rem', marginBottom: 24, color: 'var(--text-primary)' }}>Subjective Reflection</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--success)' }}>What went well today?</label>
              <textarea 
                className="input-base" 
                rows={3} 
                value={wentWell} onChange={e => setWentWell(e.target.value)}
                placeholder="I crushed the focus sessions this morning..."
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--due)' }}>What went badly?</label>
              <textarea 
                className="input-base" 
                rows={3} 
                value={wentBadly} onChange={e => setWentBadly(e.target.value)}
                placeholder="I got distracted for 2 hours reading twitter..."
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--info)' }}>What did I learn?</label>
              <textarea 
                className="input-base" 
                rows={3} 
                value={learned} onChange={e => setLearned(e.target.value)}
                placeholder="A new array method in JS..."
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="ghost" onClick={() => setStep(1)} style={{ gap: 8 }}>
              <ArrowLeft size={16} /> Back
            </Button>
            <Button variant="primary" onClick={() => setStep(3)} style={{ gap: 8 }}>
              Plan Tomorrow <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="fade-in">
          <h2 style={{ fontSize: '1.2rem', marginBottom: 8, color: 'var(--text-primary)' }}>Setting up Tomorrow</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24 }}>What are your non-negotiables for tomorrow? These will automatically sync to your Planner tracking list.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--accent)' }}>What should I improve on?</label>
              <input 
                type="text" 
                className="input-base" 
                value={improveTomorrow} onChange={e => setImproveTomorrow(e.target.value)}
                placeholder="Block Twitter using an extension."
                style={{ width: '100%' }}
              />
            </div>

            <Panel padding="md" style={{ background: 'var(--bg-primary)' }}>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 16, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                <Target size={16} color="var(--due)" /> Top 3 Priorities
              </label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3].map((num, i) => (
                  <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '1.1rem', fontWeight: 700, width: 20 }}>{num}.</span>
                    <input 
                      type="text" 
                      className="input-base" 
                      value={priorities[i]} 
                      onChange={e => handlePriorityChange(i, e.target.value)}
                      placeholder={`Priority ${num}`}
                      style={{ flex: 1 }}
                    />
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                These will be forcefully routed to your planner marked as High Priority, natively bypassing duplicates.
              </p>
            </Panel>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="ghost" onClick={() => setStep(2)} disabled={isPending} style={{ gap: 8 }}>
              <ArrowLeft size={16} /> Back
            </Button>
            <Button variant="primary" onClick={submitFlow} disabled={isPending} style={{ gap: 8 }}>
              {isPending ? <Loader2 size={16} className="spin" /> : <Save size={16} />} 
              Submit & Conclude Day
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <Panel padding="lg" style={{ textAlign: 'center', marginTop: 40 }} className="fade-in">
          <div style={{ 
            width: 80, height: 80, borderRadius: '50%', background: 'var(--success)22', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 24px',
            border: '2px solid var(--success)'
          }}>
            <CheckCircle2 size={40} color="var(--success)" />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
            Day Concluded!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: 24 }}>
            Incredible work today. Your journal safely verified, and tomorrow's planner correctly instantiated.
          </p>
          <div style={{ display: 'inline-block', background: 'var(--accent)22', padding: '8px 24px', borderRadius: 20, color: 'var(--accent)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 32 }}>
            +10 XP Awarded
          </div>
          <div>
            <Button variant="ghost" onClick={() => window.location.href = '/'}>
              Return to Dashboard
            </Button>
          </div>
        </Panel>
      )}

    </div>
  );
}
