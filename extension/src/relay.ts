/// <reference types="chrome"/>

// @ts-ignore
import type { WebToRelayMessage, ExtMessageType } from '../../tadac-app/src/lib/bridge';

/**
 * 1. Listening to Web App -> Sending to Extension Background
 */
window.addEventListener('message', (event) => {
  // Security + identification validation
  if (event.source !== window || event.data?.source !== 'tadac-web') {
    return;
  }

  const data = event.data as WebToRelayMessage;
  if (data.type === 'FOCUS_TICK') {
    chrome.runtime.sendMessage({
      type: 'TADAC_STATE_SYNC',
      payload: data.payload
    } as ExtMessageType).catch(() => {}); // Catch safely if extension gets reloaded/disconnected
  }
});

// Broadcast disconnected state to HUD on tab shutdown
window.addEventListener('beforeunload', () => {
  chrome.runtime.sendMessage({ type: 'TADAC_DISCONNECTED' } as ExtMessageType).catch(() => {});
});

/**
 * 2. Listening from Extension Background -> Dispatching to Web App
 */
chrome.runtime.onMessage.addListener((message: ExtMessageType, _sender, sendResponse) => {
  if (message.type === 'TADAC_HUD_COMMAND') {
    window.postMessage({
      source: 'tadac-extension',
      type: 'HUD_CONTROL',
      action: message.action
    }, '*');
    sendResponse({ ok: true });
  } else if (message.type === 'REQUEST_STATE_SYNC') {
    // Tell Tadac to emit the current full state organically
    window.postMessage({
      source: 'tadac-extension',
      type: 'HUD_REQUEST_STATE'
    }, '*');
    sendResponse({ ok: true });
  }
});
