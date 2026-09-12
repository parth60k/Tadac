interface XPBarProps {
  level: number;
  currentXP: number;
  maxXP: number;
}

export default function XPBar({ level, currentXP, maxXP }: XPBarProps) {
  const pct = Math.min(100, (currentXP / maxXP) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Level badge */}
      <div
        style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: '0.6rem',
          color: 'var(--accent)',
          background: 'var(--accent-soft)',
          border: '1px solid var(--accent)',
          borderRadius: 6,
          padding: '4px 8px',
          whiteSpace: 'nowrap',
          lineHeight: 1.4,
        }}
      >
        LV {level}
      </div>

      {/* XP bar track */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="xp-bar-track">
          <div
            className="xp-bar-fill"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={currentXP}
            aria-valuemin={0}
            aria-valuemax={maxXP}
            aria-label={`XP: ${currentXP} of ${maxXP}`}
          />
        </div>
        <span
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '0.5rem',
            color: 'var(--text-tertiary)',
            letterSpacing: '0.04em',
          }}
        >
          {currentXP.toLocaleString()} / {maxXP.toLocaleString()} XP
        </span>
      </div>
    </div>
  );
}
