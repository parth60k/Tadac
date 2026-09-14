'use client';

/**
 * Preset selector — shown only in idle phase.
 * Presets: 25/5 · 50/10 · 60/10 · 90/20 · Custom
 */

import { useState } from 'react';
import Panel from '@/components/ui/Panel';
import { Input } from '@/components/ui/Input';
import { useFocus, PRESET_CONFIGS, type PresetConfig } from '@/lib/focus-context';
import type { FocusPreset } from '@/types/domain';

const PRESETS: { value: FocusPreset; label: string; sub: string }[] = [
  { value: '25/5',  label: '25 / 5',  sub: 'Classic Pomodoro' },
  { value: '50/10', label: '50 / 10', sub: 'Deep work' },
  { value: '60/10', label: '60 / 10', sub: 'Long focus' },
  { value: '90/20', label: '90 / 20', sub: 'Flow state' },
  { value: 'custom',label: 'Custom',  sub: 'Your settings' },
];

export default function PresetSelector() {
  const { state, setPreset, setCustomConfig } = useFocus();
  const [showCustom, setShowCustom] = useState(false);
  const [customFocus, setCustomFocus]   = useState(state.customConfig.focus.toString());
  const [customShort, setCustomShort]   = useState(state.customConfig.shortBreak.toString());
  const [customLong,  setCustomLong]    = useState(state.customConfig.longBreak.toString());
  const [customCycles,setCustomCycles]  = useState(state.customConfig.cycles.toString());

  function handleSelectPreset(p: FocusPreset) {
    if (p === 'custom') {
      setShowCustom(true);
      setPreset('custom', state.customConfig);
    } else {
      setShowCustom(false);
      setPreset(p, PRESET_CONFIGS[p]);
    }
  }

  function applyCustom() {
    const config: PresetConfig = {
      focus:      Math.max(1, parseInt(customFocus)  || 25),
      shortBreak: Math.max(1, parseInt(customShort)  || 5),
      longBreak:  Math.max(1, parseInt(customLong)   || 15),
      cycles:     Math.max(1, parseInt(customCycles) || 4),
    };
    setCustomConfig(config);
    setPreset('custom', config);
  }

  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      {/* Preset chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
        {PRESETS.map(p => {
          const isActive = state.preset === p.value;
          return (
            <button
              key={p.value}
              id={`preset-${p.value}`}
              onClick={() => handleSelectPreset(p.value)}
              style={{
                display:    'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap:        2,
                padding:    '10px 18px',
                borderRadius: 'var(--radius-md)',
                border:     isActive ? '1.5px solid var(--accent)' : '1px solid var(--panel-border)',
                background: isActive ? 'var(--accent-soft)' : 'var(--panel-bg)',
                color:      isActive ? 'var(--accent)' : 'var(--text-secondary)',
                cursor:     'pointer',
                transition: 'all 150ms',
                minWidth:   80,
              }}
            >
              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.65rem', fontWeight: 700 }}>
                {p.label}
              </span>
              <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{p.sub}</span>
            </button>
          );
        })}
      </div>

      {/* Custom config panel */}
      {showCustom && (
        <Panel padding="md" style={{ marginTop: 8 }}>
          <p className="section-title" style={{ marginBottom: 12 }}>Custom Preset</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              id="custom-focus"
              label="Focus (mins)"
              type="number" min="1" max="240"
              value={customFocus}
              onChange={e => setCustomFocus(e.target.value)}
            />
            <Input
              id="custom-short-break"
              label="Short break (mins)"
              type="number" min="1" max="60"
              value={customShort}
              onChange={e => setCustomShort(e.target.value)}
            />
            <Input
              id="custom-long-break"
              label="Long break (mins)"
              type="number" min="1" max="90"
              value={customLong}
              onChange={e => setCustomLong(e.target.value)}
            />
            <Input
              id="custom-cycles"
              label="Cycles before long break"
              type="number" min="1" max="10"
              value={customCycles}
              onChange={e => setCustomCycles(e.target.value)}
            />
          </div>
          <button
            onClick={applyCustom}
            id="apply-custom-preset"
            style={{
              marginTop: 12,
              padding: '8px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent)',
              color: '#1c1f2b',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            Apply
          </button>
        </Panel>
      )}

      {/* Current config hint */}
      <p style={{ textAlign: 'center', marginTop: 12, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
        {state.config.focus}m focus · {state.config.shortBreak}m short · {state.config.longBreak}m long · {state.config.cycles} cycles
      </p>
    </div>
  );
}
