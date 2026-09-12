'use client';

import Panel from '@/components/ui/Panel';
import { useTheme } from '@/lib/theme';
import { Settings, Sun, Moon, Monitor } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: 'day'  as const, label: 'Day',   icon: Sun },
    { value: 'night'as const, label: 'Night', icon: Moon },
    { value: 'auto' as const, label: 'Auto',  icon: Monitor },
  ];

  return (
    <div className="page-wrapper">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>
        Settings
      </h1>

      {/* Appearance */}
      <Panel padding="md" style={{ marginBottom: 16 }}>
        <p className="section-title" style={{ marginBottom: 16 }}>Appearance</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12 }}>Theme</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              id={`theme-option-${value}`}
              onClick={() => setTheme(value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 'var(--radius-md)',
                border: theme === value ? '2px solid var(--accent)' : '1px solid var(--panel-border)',
                background: theme === value ? 'var(--accent-soft)' : 'var(--panel-bg)',
                color: theme === value ? 'var(--accent)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>
        <p style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
          Auto picks Night after 18:00 and Day otherwise.
        </p>
      </Panel>

      {/* More settings coming later */}
      <Panel padding="md" style={{ opacity: 0.6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Settings size={24} color="var(--text-tertiary)" strokeWidth={1.5} />
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>More settings coming later</p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: 2 }}>
              Timezone, focus goals, quote preferences, and more — added progressively.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
