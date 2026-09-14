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

function DraggableHUD() {
  const [visible, setVisible] = useState(true);
  const [state, setState] = useState<any>(null);
  
  // Basic drag state natively built to avoid heavy libraries
  const [pos] = useState({ x: 20, y: 20 }); 

  useEffect(() => {
    // Initialization sync
    chrome.runtime.sendMessage({ type: 'TADAC_STATE_INIT' }, (res) => {
      if (res?.payload) setState(res.payload);
    });

    // Listen to background worker hooks dynamically
    const listener = (msg: any) => {
      if (msg.type === 'TADAC_HUD_UPDATE') {
        setState(msg.payload);
      } else if (msg.type === 'TADAC_HUD_TOGGLE') {
        setVisible(v => !v);
      }
    };
    
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const sendAction = (action: string) => {
    chrome.runtime.sendMessage({ type: 'TADAC_COMMAND', action }).catch(() => {});
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
        <div className="disconnected">Waiting for Tadac App...</div>
      ) : (
        <>
          <div className="tadac-header">{state.phase === 'break' ? 'Break' : 'Focus'}</div>
          <div className="tadac-timer">{formatSecs(state.phase === 'break' ? state.remainingBreakSecs : state.remainingFocusSecs)}</div>
          
          {state.taskTitle && (
            <div className="tadac-lbl">{state.taskTitle}</div>
          )}

          <div className="tadac-controls">
            <button className="tadac-btn" onClick={() => sendAction(state.phase === 'paused' ? 'RESUME' : 'PAUSE')}>
              {state.phase === 'paused' ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <button className="tadac-btn" onClick={() => sendAction('STOP')}>
              <Square size={16} />
            </button>
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
