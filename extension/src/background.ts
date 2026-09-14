/// <reference types="chrome"/>

// Global state holding the latest payload from Tadac web app relay
let latestFocusState: any = null;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'TADAC_STATE_SYNC') {
    latestFocusState = message.payload;
    
    // Broadcast state immediately globally to all open injected HUDs natively
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'TADAC_HUD_UPDATE', payload: latestFocusState }).catch(() => {});
        }
      });
    });
    
    sendResponse({ success: true });
    return;
  }

  // Handle command routing back to Tab Relay
  if (message.type === 'TADAC_COMMAND') {
    chrome.tabs.query({ url: "*://localhost/*" }, (tabs) => {
       tabs.forEach(tab => {
         if (tab.id) {
           chrome.tabs.sendMessage(tab.id, { type: 'TADAC_HUD_COMMAND', action: message.action }).catch(() => {});
         }
       });
    });
    sendResponse({ success: true });
    return;
  }

  // When a HUD mounts, it manually asks for initialization state
  if (message.type === 'TADAC_STATE_INIT') {
    sendResponse({ payload: latestFocusState });
    return;
  }
});

// User explicit toggling for injecting HUD onto Active Tab
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  
  // Natively check if we already injected to prevent double-mount
  try {
    const res = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => !!document.getElementById('tadac-extension-root')
    });
    
    const isMounted = res[0].result;
    
    if (isMounted) {
      // Toggle visibility if already mounted via message
      chrome.tabs.sendMessage(tab.id, { type: 'TADAC_HUD_TOGGLE' }).catch(() => {});
    } else {
      // Inject CSS + Script strictly mapped via MV3 execution
      await chrome.scripting.executeScript({
         target: { tabId: tab.id },
         files: ['src/content.tsx']
      });
    }
  } catch (error) {
    console.error('Failed to inject Tadac HUD:', error);
  }
});
