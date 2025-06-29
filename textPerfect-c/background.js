// Background Script for textPerfect Extension
class TextPerfectBackground {
  constructor() {
    this.init();
  }

  init() {    
    // Listen for messages from content scripts and popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });
  }
  
  async ensureContentScriptInjected(tabId) {
    try {
      // Try to ping the content script
      const response = await chrome.tabs.sendMessage(tabId, { action: 'getStatus' });
      if (response && response.initialized) {
        return;
      }
    } catch (error) {
      // Content script not loaded or not responding, inject it
      
      try {
        // Inject scripts in correct order
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['markdown-parser.js']
        });
        
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['contentScript.js']
        });
        
        // Inject CSS
        await chrome.scripting.insertCSS({
          target: { tabId: tabId },
          files: ['styles.css']
        });
      } catch (injectError) {
        console.error('textPerfect Background: Error injecting content script:', injectError);
      }
    }
  }
  
  async handleMessage(request, sender, sendResponse) {
    try {
      
      switch (request.action) {
        case 'getStatus':
          sendResponse({ 
            success: true, 
            status: 'Background script active',
            version: chrome.runtime.getManifest().version
          });
          break;
          
        case 'showOverlay':
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab) {
            await this.ensureContentScriptInjected(tab.id);
            await chrome.tabs.sendMessage(tab.id, { action: 'showOverlay' });
            sendResponse({ success: true });
          }
          break;
          
        case 'hideOverlay':
          const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (currentTab) {
            await chrome.tabs.sendMessage(currentTab.id, { action: 'hideOverlay' });
            sendResponse({ success: true });
          }
          break;
          
        default:
          console.warn('textPerfect Background: Unknown action:', request.action);
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('textPerfect Background: Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }
}

// Initialize background script
const textPerfectBackground = new TextPerfectBackground();

