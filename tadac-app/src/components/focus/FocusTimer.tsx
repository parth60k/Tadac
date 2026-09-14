'use client';

/**
 * The big SVG ring timer — the visual center of the Focus screen.
 * Design spec §11: timer is largest pixel-font element, simple ring, no game-style frame.
 */

import { useFocus } from '@/lib/focus-context';

const SIZE   = 280;            // SVG viewport size
const STROKE = 8;
const RADIUS = (SIZE / 2) - (STROKE * 2);
const CIRCUM = 2 * Math.PI * RADIUS;

const PHASE_COLORS: Record<string, string> = {
  running:   'var(--accent)',
  paused:    'var(--text-tertiary)',
  break:     'var(--info)',
  idle:      'var(--panel-border)',
  completed: 'var(--success)',
};

export default function FocusTimer() {
  const { state, formattedTime, progress } = useFocus();
  const { phase, category } = state;

  const color         = PHASE_COLORS[phase] ?? 'var(--accent)';
  const strokeDashOff = CIRCUM * (1 - progress);

  const phaseLabel =
    phase === 'break'     ? (state.remainingSecs > state.config.shortBreak * 60 ? 'Long Break' : 'Short Break')
    : phase === 'paused'  ? 'Paused'
    : phase === 'running' ? 'Focus'
    : phase === 'completed' ? 'Done'
    : 'Ready';

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            0,
      position:       'relative',
    }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ transform: 'rotate(-90deg)' }}
        aria-label={`Timer: ${formattedTime}`}
      >
        {/* Track ring */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--panel-border)"
          strokeWidth={STROKE}
        />
        {/* Progress ring */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUM}
          strokeDashoffset={strokeDashOff}
          style={{
            transition: phase === 'running' ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.3s ease',
          }}
        />
      </svg>

      {/* Timer text — overlaid on SVG */}
      <div style={{
        position:  'absolute',
        top:       '50%',
        left:      '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
      }}>
        <p
          id="focus-timer-display"
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize:   '2.4rem',
            color:      phase === 'paused' ? 'var(--text-secondary)' : 'var(--text-primary)',
            lineHeight: 1,
            letterSpacing: '0.1em',
            transition: 'color 0.3s ease',
          }}
        >
          {formattedTime}
        </p>
        <p style={{
          marginTop:  10,
          fontSize:   '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color:      color,
          transition: 'color 0.3s ease',
        }}>
          {phaseLabel}
        </p>
        {phase !== 'idle' && (
          <p style={{
            marginTop:  4,
            fontSize:   '0.72rem',
            color:      'var(--text-tertiary)',
          }}>
            {category}
          </p>
        )}
      </div>
    </div>
  );
}
