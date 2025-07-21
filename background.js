// Background script for Everything Explorer Extension

// Handle extension icon click to open side panel
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Open side panel for the current window
    await chrome.sidePanel.open({ windowId: tab.windowId });
  } catch (error) {
    console.error('Error opening side panel:', error);
  }
});

// Set up side panel on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// Handle messages from side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_FILE') {
    // Handle file opening requests
    console.log('Open file request:', message.path);
    sendResponse({ success: true });
  }
  
  if (message.type === 'COPY_PATH') {
    // Handle path copying
    console.log('Copy path request:', message.path);
    sendResponse({ success: true });
  }
  
  return true; // Keep message channel open for async response
});

// Store user preferences
chrome.storage.local.set({
  'everything_port': '8080',
  'default_drive': 'D:',
  'search_on_c_drive': false
});