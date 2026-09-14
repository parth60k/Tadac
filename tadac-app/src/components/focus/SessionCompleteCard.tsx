'use client';

/**
 * Completion overlay — shown after a session finishes or is stopped.
 * Design spec §12: brief fade, XP text, NO confetti, understated transition only.
 */

import { CheckCircle2, Zap } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import { useFocus } from '@/lib/focus-context';
import { formatDuration } from '@/lib/date';

export default function SessionCompleteCard() {
  const { state, handleDismiss } = useFocus();
  const { completedMins, xpEarned, category } = state;

  return (
    <div
      style={{
        position:  'absolute',
        inset:     0,
        display:   'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'pageFadeIn 0.25s ease',
        zIndex:    10,
      }}
    >
      <Panel
        padding="lg"
        style={{
          textAlign:  'center',
          maxWidth:   360,
          width:      '100%',
        }}
        id="session-complete-card"
      >
        <CheckCircle2
          size={44}
          color="var(--success)"
          strokeWidth={1.5}
          style={{ margin: '0 auto 16px' }}
        />

        <h2 style={{
          fontSize:   '1.15rem',
          fontWeight: 700,
          color:      'var(--text-primary)',
          marginBottom: 6,
        }}>
          Session complete
        </h2>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
          {category}
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 24 }}>
          <div>
            <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '1rem', color: 'var(--text-primary)' }}>
              {formatDuration(completedMins)}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 4 }}>focused</p>
          </div>
          {xpEarned > 0 && (
            <div>
              <p style={{
                fontFamily: 'var(--font-pixel)',
                fontSize:   '1rem',
                color:      'var(--accent)',
                display:    'flex',
                alignItems: 'center',
                gap:        6,
              }}>
                <Zap size={14} fill="var(--accent)" stroke="none" />
                +{xpEarned}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 4 }}>XP earned</p>
            </div>
          )}
        </div>

        <Button
          variant="primary"
          onClick={handleDismiss}
          id="session-dismiss-btn"
          style={{ width: '100%' }}
        >
          Start next session
        </Button>
      </Panel>
    </div>
  );
}
