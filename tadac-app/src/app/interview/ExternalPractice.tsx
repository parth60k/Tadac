'use client';

import { ExternalLink, BookOpen } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import Link from 'next/link';

const RESOURCES = [
  { topic: 'DSA & Algorithms', name: 'LeetCode', url: 'https://leetcode.com', desc: 'Industry standard coding practice.' },
  { topic: 'System Design', name: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer', desc: 'Comprehensive guide to scaling architectures.' },
  { topic: 'Frontend & JS', name: 'MDN Web Docs', url: 'https://developer.mozilla.org', desc: 'The authoritative source for JS & Web APIs.' },
  { topic: 'SQL & DBMS', name: 'SQLBolt', url: 'https://sqlbolt.com/', desc: 'Interactive SQL tutorials.' }
];

export default function ExternalPractice() {
  return (
    <Panel padding="lg" style={{ marginTop: 24, marginBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <BookOpen size={18} color="var(--info)" />
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          External Practice
        </h2>
      </div>
      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: 20 }}>
        Looking for more rigorous drills? Explore these highly recommended external platforms.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {RESOURCES.map(res => (
          <Link key={res.name} href={res.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div style={{ 
              padding: '16px', background: 'var(--panel-bg)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--panel-border)', display: 'flex', flexDirection: 'column', height: '100%',
              transition: 'transform 0.2s, border-color 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--info)')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--panel-border)')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{res.name}</span>
                <ExternalLink size={14} color="var(--text-tertiary)" />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--info)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {res.topic}
              </span>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 'auto' }}>
                {res.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Panel>
  );
}
