'use client';

/**
 * Focus controls — Start / Pause / Resume / Stop / Skip break.
 * Design spec §11: simple controls, no game HUD styling.
 */

import { Play, Pause, Square, SkipForward, Loader2 } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useFocus } from '@/lib/focus-context';

export default function FocusControls() {
  const {
    state, handleStart, handlePause,
    handleResume, handleStop, handleSkipBreak,
  } = useFocus();
  const { phase } = state;
  const [loading, setLoading] = useState(false);

  async function onStart() {
    setLoading(true);
    await handleStart();
    setLoading(false);
  }

  async function onStop() {
    setLoading(true);
    await handleStop();
    setLoading(false);
  }

  if (phase === 'idle') {
    return (
      <Button
        variant="primary"
        size="lg"
        id="focus-start-btn"
        onClick={onStart}
        disabled={loading}
        style={{ minWidth: 160, gap: 10 }}
      >
        {loading
          ? <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Starting…</>
          : <><Play size={18} strokeWidth={2.5} fill="currentColor" /> Start Focus</>
        }
      </Button>
    );
  }

  if (phase === 'break') {
    return (
      <div style={{ display: 'flex', gap: 12 }}>
        <Button
          variant="ghost"
          size="md"
          id="focus-skip-break-btn"
          onClick={handleSkipBreak}
          style={{ gap: 8 }}
        >
          <SkipForward size={16} strokeWidth={2} /> Skip break
        </Button>
        <Button
          variant="danger"
          size="md"
          id="focus-stop-from-break-btn"
          onClick={onStop}
          disabled={loading}
          style={{ gap: 8 }}
        >
          <Square size={14} strokeWidth={2.5} fill="currentColor" /> Stop
        </Button>
      </div>
    );
  }

  if (phase === 'running') {
    return (
      <div style={{ display: 'flex', gap: 12 }}>
        <Button
          variant="ghost"
          size="md"
          id="focus-pause-btn"
          onClick={handlePause}
          style={{ gap: 8 }}
        >
          <Pause size={16} strokeWidth={2.5} fill="currentColor" /> Pause
        </Button>
        <Button
          variant="danger"
          size="md"
          id="focus-stop-btn"
          onClick={onStop}
          disabled={loading}
          style={{ gap: 8 }}
        >
          {loading
            ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
            : <Square size={14} strokeWidth={2.5} fill="currentColor" />
          }
          Stop
        </Button>
      </div>
    );
  }

  if (phase === 'paused') {
    return (
      <div style={{ display: 'flex', gap: 12 }}>
        <Button
          variant="primary"
          size="md"
          id="focus-resume-btn"
          onClick={handleResume}
          style={{ gap: 8 }}
        >
          <Play size={16} strokeWidth={2.5} fill="currentColor" /> Resume
        </Button>
        <Button
          variant="danger"
          size="md"
          id="focus-stop-paused-btn"
          onClick={onStop}
          disabled={loading}
          style={{ gap: 8 }}
        >
          <Square size={14} strokeWidth={2.5} fill="currentColor" /> Stop
        </Button>
      </div>
    );
  }

  return null;
}
