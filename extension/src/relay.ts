/// <reference types="chrome"/>

/**
 * 1. Listening to Web App -> Sending to Extension Background
 */
window.addEventListener('message', (event) => {
  // Security + identification validation
  if (event.source !== window || event.data?.source !== 'tadac-web') {
    return;
  }

  if (event.data.type === 'FOCUS_TICK') {
    chrome.runtime.sendMessage({
      type: 'TADAC_STATE_SYNC',
      payload: event.data.payload
    }).catch(() => {}); // Catch safely if extension gets reloaded/disconnected
  }
});

/**
 * 2. Listening from Extension Background -> Dispatching to Web App
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'TADAC_HUD_COMMAND') {
    window.postMessage({
      source: 'tadac-extension',
      type: 'HUD_CONTROL',
      action: message.action
    }, '*');
    sendResponse({ ok: true });
  }
});
