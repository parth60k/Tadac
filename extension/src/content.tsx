import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Play, Pause, Square } from 'lucide-react';

// Isolated CSS rendering seamlessly across generic websites via style tags in Shadow DOM
const STYLES = `
  .tadac-hud {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(10, 10, 10, 0.85);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
    font-family: system-ui, -apple-system, sans-serif;
    padding: 16px 20px;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
    z-index: 2147483647; /* Absolute Chrome Maximum */
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 220px;
    cursor: move;
    user-select: none;
    transition: opacity 0.2s ease;
  }
  .tadac-hud.hidden {
    opacity: 0;
    pointer-events: none;
  }
  .tadac-header {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #a0a0a0;
  }
  .tadac-timer {
    font-size: 2.2rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    margin: 4px 0;
  }
  .tadac-controls {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  .tadac-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease;
  }
  .tadac-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  .tadac-lbl {
    font-size: 0.85rem;
    color: #e0e0e0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .disconnected {
    color: #ff5555;
    font-size: 0.9rem;
    font-weight: 500;
  }
`;

// @ts-ignore
import type { SyncPayload, HudCommandAction, ExtMessageType } from '../../tadac-app/src/lib/bridge';

function DraggableHUD() {
  const [visible, setVisible] = useState(true);
  const [state, setState] = useState<SyncPayload | null>(null);
  
  // Real-time ticking remaining seconds shielded from Background throttling
  const [displaySecs, setDisplaySecs] = useState<number>(0);
  
  // Basic drag state natively built to avoid heavy libraries
  const [pos] = useState({ x: 20, y: 20 }); 

  useEffect(() => {
    // Initialization sync - immediately request fresh state to prevent stale cache drift
    chrome.runtime.sendMessage({ type: 'REQUEST_STATE_SYNC' } as ExtMessageType, () => {});

    // Listen to background worker hooks dynamically
    const listener = (msg: ExtMessageType) => {
      if (msg.type === 'TADAC_HUD_UPDATE') {
        setState(msg.payload);
      } else if (msg.type === 'TADAC_HUD_TOGGLE') {
        setVisible(v => !v);
      }
    };
    
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  // Visual countdown engine matching exact timestamps
  useEffect(() => {
    if (!state) return;
    
    // Natively set instantaneous display sync
    setDisplaySecs(state.remainingSecs);
    
    if (state.phase !== 'running' && state.phase !== 'break') return;

    const interval = setInterval(() => {
      const remainingMS = state.targetEndTime - Date.now();
      const s = Math.max(0, Math.ceil(remainingMS / 1000));
      setDisplaySecs(s);
    }, 250);

    return () => clearInterval(interval);
  }, [state]);

  const sendAction = (action: HudCommandAction) => {
    chrome.runtime.sendMessage({ type: 'TADAC_COMMAND', action } as ExtMessageType).catch(() => {});
  };

  const formatSecs = (total: number) => {
    if (!total || total < 0) return '00:00';
    const m = Math.floor(total / 60).toString().padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!visible) return null;

  return (
    <div className="tadac-hud" style={{ bottom: pos.y, right: pos.x }}>
      {!state ? (
        <div className="disconnected">Open Tadac to connect...</div>
      ) : (
        <>
          <div className="tadac-header">{state.phase}</div>
          <div className="tadac-timer">{formatSecs(displaySecs)}</div>
          
          <div className="tadac-lbl">{state.category} {state.linkedTaskId ? '(Task Active)' : ''}</div>

          <div className="tadac-controls">
            {(state.phase === 'running' || state.phase === 'paused') && (
              <button className="tadac-btn" onClick={() => sendAction(state.phase === 'paused' ? 'RESUME' : 'PAUSE')}>
                {state.phase === 'paused' ? <Play size={16} /> : <Pause size={16} />}
              </button>
            )}
            
            {state.phase === 'idle' && (
              <button className="tadac-btn" onClick={() => sendAction('START')}>
                <Play size={16} />
              </button>
            )}

            {state.phase !== 'idle' && state.phase !== 'completed' && (
              <button className="tadac-btn" onClick={() => sendAction('STOP')}>
                <Square size={16} />
              </button>
            )}
            
            {state.phase === 'break' && (
              <button className="tadac-btn" onClick={() => sendAction('SKIP')}>
                Skip
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NATIVE SHADOW DOM MOUNTING INJECTION
// ─────────────────────────────────────────────────────────────────────────────

const rootId = 'tadac-extension-root';
let hostElement = document.getElementById(rootId);

if (!hostElement) {
  hostElement = document.createElement('div');
  hostElement.id = rootId;
  document.body.appendChild(hostElement);
  
  // Attach Shadow DOM so websites don't break our CSS
  const shadowRoot = hostElement.attachShadow({ mode: 'open' });
  
  // Inject isolated styles
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLES;
  shadowRoot.appendChild(styleEl);
  
  // Create React mount point inside shadow tree
  const reactRootEl = document.createElement('div');
  shadowRoot.appendChild(reactRootEl);
  
  const root = ReactDOM.createRoot(reactRootEl);
  root.render(<DraggableHUD />);
}
