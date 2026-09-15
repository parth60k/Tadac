/// <reference types="chrome"/>

// @ts-ignore
import type { ExtMessageType } from '../../tadac-app/src/lib/bridge';

// Global state holding the latest payload from Tadac web app relay
let latestFocusState: any = null;

const tadacOrigins = ["*://localhost/*", "*://tadac.app/*", "*://*.vercel.app/*"];

chrome.runtime.onMessage.addListener((message: ExtMessageType, _sender, sendResponse) => {
  if (message.type === 'TADAC_STATE_SYNC') {
    latestFocusState = message.payload;
    
    // Broadcast state immediately globally to all open injected HUDs natively
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'TADAC_HUD_UPDATE', payload: latestFocusState } as ExtMessageType).catch(() => {});
        }
      });
    });
    
    sendResponse({ success: true });
    return;
  }
  
  if (message.type === 'TADAC_DISCONNECTED') {
    latestFocusState = null;
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'TADAC_HUD_UPDATE', payload: null } as ExtMessageType).catch(() => {});
        }
      });
    });
    sendResponse({ success: true });
    return;
  }

  // Handle command routing back to Tab Relay
  if (message.type === 'TADAC_COMMAND') {
    chrome.tabs.query({ url: tadacOrigins }, (tabs) => {
       tabs.forEach(tab => {
         if (tab.id) {
           chrome.tabs.sendMessage(tab.id, { type: 'TADAC_HUD_COMMAND', action: message.action } as ExtMessageType).catch(() => {});
         }
       });
    });
    sendResponse({ success: true });
    return;
  }
  
  if (message.type === 'REQUEST_STATE_SYNC') {
    // Send request downward to Tab to forcefully re-emit its current state entirely organically
    chrome.tabs.query({ url: tadacOrigins }, (tabs) => {
       if (tabs.length === 0) {
          // Tell HUD we are disconnected
          chrome.tabs.query({}, (allTabs) => {
            allTabs.forEach(tab => {
              if (tab.id) chrome.tabs.sendMessage(tab.id, { type: 'TADAC_HUD_UPDATE', payload: null } as ExtMessageType).catch(() => {});
            });
          });
       } else {
         tabs.forEach(tab => {
           if (tab.id) {
             chrome.tabs.sendMessage(tab.id, { type: 'REQUEST_STATE_SYNC' } as ExtMessageType).catch(() => {});
           }
         });
       }
    });
    sendResponse({ success: true });
    return;
  }
});

// @ts-ignore
import contentScriptUrl from './content?script';

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
         files: [contentScriptUrl]
      });
    }
  } catch (error) {
    console.error('Failed to inject Tadac HUD:', error);
  }
});
