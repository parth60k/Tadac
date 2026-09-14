'use client';

import { Flame, Trophy, CalendarDays, Activity, BarChart3, Quote as QuoteIcon } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import { getRandomQuote } from '@/lib/quotes';
import { useState, useEffect } from 'react';

type ProgressData = {
  streaks: { currentStreak: number; longestStreak: number; totalActive: number };
  chartData: Array<{ dateStr: string; label: string; value: number }>;
  totals: { totalSessions: number; totalRevs: number; totalInterviews: number; totalTasks: number };
};

export default function ProgressClient({ data }: { data: ProgressData }) {
  const [quote, setQuote] = useState(getRandomQuote().quote);

  useEffect(() => {
    // Sparing quote engine - change quote natively on mount
    setQuote(getRandomQuote().quote);
  }, []);

  const maxChartVal = Math.max(...data.chartData.map(d => d.value), 60); // min height baseline

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Activity size={24} color="var(--accent)" /> Analytics Hub
      </h1>

      {/* Quote Banner */}
      <Panel padding="lg" style={{ marginBottom: 32, background: 'var(--bg-primary)', borderLeft: '4px solid var(--accent)' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <QuoteIcon size={24} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 8 }}>
              "{quote.text}"
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>— {quote.author}</p>
          </div>
        </div>
      </Panel>

      {/* Streak Dashboard Engine */}
      <h2 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Dedication</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 32 }}>
        
        <Panel padding="lg" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--due)22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={28} color="var(--due)" />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--due)' }}>{data.streaks.currentStreak}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Day Current Streak</div>
          </div>
        </Panel>

        <Panel padding="lg" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--accent)22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={28} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)' }}>{data.streaks.longestStreak}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Best Logged Streak</div>
          </div>
        </Panel>

        <Panel padding="lg" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--success)22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarDays size={28} color="var(--success)" />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>{data.streaks.totalActive}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Total Active Days</div>
          </div>
        </Panel>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'reapto-fit, minmax(300px, 1fr)', gap: 24 }}>
        
        {/* DOM Metric Chart - Deep Focus Flow */}
        <section style={{ flex: 2, minWidth: 350 }}>
          <h2 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={18} /> Focus Trajectory (Last 7 Days)
          </h2>
          <Panel padding="xl">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 200, paddingBottom: 24, borderBottom: '1px solid var(--panel-border)' }}>
              {data.chartData.map((d, i) => {
                const heightPct = data.chartData.length > 0 ? (d.value / maxChartVal) * 100 : 0;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', position: 'relative' }}>
                    
                    {/* Tooltip approx */}
                    <div style={{ 
                      opacity: d.value > 0 ? 1 : 0.5,
                      fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 700 
                    }}>
                      {d.value}m
                    </div>

                    {/* Bar */}
                    <div style={{ 
                      width: '100%', maxWidth: 40, 
                      height: `${Math.max(heightPct, 2)}%`, 
                      background: d.value > 0 ? 'var(--info)' : 'var(--panel-border)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.4s ease'
                    }} />

                    {/* Label mapping */}
                    <div style={{ position: 'absolute', bottom: -24, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {d.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </section>

        {/* Global Output Totals */}
        <section style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Legacy Footprint</h2>
          <Panel padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Focus Sessions Done</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{data.totals.totalSessions}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Questions Interviewed</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{data.totals.totalInterviews}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Spaced Items Conquered</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{data.totals.totalRevs}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Tasks Obliterated</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{data.totals.totalTasks}</span>
            </div>

          </Panel>
        </section>
      </div>
    </div>
  );
}
