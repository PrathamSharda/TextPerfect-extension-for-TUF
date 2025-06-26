// // Background Script for textPerfect Extension
// class TextPerfectBackground {
//   constructor() {
//     this.init();
//   }
  
//   init() {
//     console.log('textPerfect Background: Initializing...');
    
//     // Listen for extension installation
//     chrome.runtime.onInstalled.addListener((details) => {
//       console.log('textPerfect Background: Extension installed/updated', details.reason);
//     });
    
//     // Listen for messages from content scripts and popup
//     chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//       this.handleMessage(request, sender, sendResponse);
//       return true; // Keep message channel open for async responses
//     });
    
//     // Listen for tab updates
//     chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//       if (changeInfo.status === 'complete') {
//        // console.log('textPerfect Background: Page loaded');
//       }
//     });
//   }
  
//   async ensureContentScriptInjected(tabId) {
//     try {
//       // Try to ping the content script
//       const response = await chrome.tabs.sendMessage(tabId, { action: 'getStatus' });
//       if (response && response.initialized) {
//         //console.log('textPerfect Background: Content script already active');
//         return;
//       }
//     } catch (error) {
//       // Content script not loaded or not responding, inject it
//       console.log('textPerfect Background: Injecting content script');
      
//       try {
//         // Inject scripts in correct order
//         await chrome.scripting.executeScript({
//           target: { tabId: tabId },
//           files: ['markdown-parser.js']
//         });
        
//         await chrome.scripting.executeScript({
//           target: { tabId: tabId },
//           files: ['contentScript.js']
//         });
        
//         // Inject CSS
//         await chrome.scripting.insertCSS({
//           target: { tabId: tabId },
//           files: ['styles.css']
//         });
        
//         //console.log('textPerfect Background: Content script injected successfully');
//       } catch (injectError) {
//         console.error('textPerfect Background: Error injecting content script:', injectError);
//       }
//     }
//   }
  
//   async handleMessage(request, sender, sendResponse) {
//     try {
//      // console.log('textPerfect Background: Received message:', request.action);
      
//       switch (request.action) {
//         case 'getStatus':
//           sendResponse({ 
//             success: true, 
//             status: 'Background script active',
//             version: chrome.runtime.getManifest().version
//           });
//           break;
          
//         case 'showOverlay':
//           const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//           if (tab) {
//             await this.ensureContentScriptInjected(tab.id);
//             await chrome.tabs.sendMessage(tab.id, { action: 'showOverlay' });
//             sendResponse({ success: true });
//           }
//           break;
          
//         case 'hideOverlay':
//           const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
//           if (currentTab) {
//             await chrome.tabs.sendMessage(currentTab.id, { action: 'hideOverlay' });
//             sendResponse({ success: true });
//           }
//           break;
          
//         default:
//           console.warn('textPerfect Background: Unknown action:', request.action);
//           sendResponse({ error: 'Unknown action' });
//       }
//     } catch (error) {
//       console.error('textPerfect Background: Error handling message:', error);
//       sendResponse({ error: error.message });
//     }
//   }
// }

// // Initialize background script
// const textPerfectBackground = new TextPerfectBackground();

// //console.log('textPerfect Background: Script loaded and initialized');

// Firefox Background Script for textPerfect Extension
class TextPerfectBackground {
  constructor() {
      this.init();
  }

  init() {
      console.log('textPerfect Background: Initializing for Firefox...');
      
      // Listen for extension installation
      browser.runtime.onInstalled.addListener((details) => {
          console.log('textPerfect Background: Extension installed/updated', details.reason);
      });

      // Listen for messages from content scripts and popup
      browser.runtime.onMessage.addListener((request, sender) => {
          return this.handleMessage(request, sender);
      });

      // Listen for tab updates
      browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
          if (changeInfo.status === 'complete') {
              // console.log('textPerfect Background: Page loaded');
          }
      });
  }

  async ensureContentScriptInjected(tabId) {
      try {
          // Try to ping the content script
          const response = await browser.tabs.sendMessage(tabId, { action: 'getStatus' });
          if (response && response.initialized) {
              //console.log('textPerfect Background: Content script already active');
              return;
          }
      } catch (error) {
          // Content script not loaded or not responding, inject it
          console.log('textPerfect Background: Injecting content script');
          
          try {
              // Firefox uses tabs.executeScript (Manifest V2 style)
              await browser.tabs.executeScript(tabId, {
                  file: 'markdown-parser.js'
              });
              
              await browser.tabs.executeScript(tabId, {
                  file: 'backend_script.js'
              });
              
              await browser.tabs.executeScript(tabId, {
                  file: 'contentScript.js'
              });

              // Inject CSS
              await browser.tabs.insertCSS(tabId, {
                  file: 'styles.css'
              });
              
              console.log('textPerfect Background: Content script injected successfully');
          } catch (injectError) {
              console.error('textPerfect Background: Error injecting content script:', injectError);
          }
      }
  }

  async handleMessage(request, sender) {
      try {
          // console.log('textPerfect Background: Received message:', request.action);
          
          switch (request.action) {
              case 'getStatus':
                  return Promise.resolve({
                      success: true,
                      status: 'Background script active',
                      version: browser.runtime.getManifest().version
                  });

              case 'showOverlay':
                  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
                  if (tabs.length > 0) {
                      const tab = tabs[0];
                      await this.ensureContentScriptInjected(tab.id);
                      await browser.tabs.sendMessage(tab.id, { action: 'showOverlay' });
                      return Promise.resolve({ success: true });
                  }
                  return Promise.resolve({ error: 'No active tab found' });

              case 'hideOverlay':
                  const currentTabs = await browser.tabs.query({ active: true, currentWindow: true });
                  if (currentTabs.length > 0) {
                      const currentTab = currentTabs[0];
                      await browser.tabs.sendMessage(currentTab.id, { action: 'hideOverlay' });
                      return Promise.resolve({ success: true });
                  }
                  return Promise.resolve({ error: 'No active tab found' });

              case 'saveNote':
                  // Handle note saving
                  if (request.data) {
                      await browser.storage.local.set({
                          [`note_${request.data.id}`]: request.data
                      });
                      return Promise.resolve({ success: true, message: 'Note saved' });
                  }
                  return Promise.resolve({ error: 'No data provided' });

              case 'loadNote':
                  // Handle note loading
                  if (request.noteId) {
                      const result = await browser.storage.local.get(`note_${request.noteId}`);
                      const noteData = result[`note_${request.noteId}`];
                      return Promise.resolve({ 
                          success: true, 
                          data: noteData || null 
                      });
                  }
                  return Promise.resolve({ error: 'No note ID provided' });

              case 'getAllNotes':
                  // Get all stored notes
                  const allData = await browser.storage.local.get();
                  const notes = {};
                  
                  Object.keys(allData).forEach(key => {
                      if (key.startsWith('note_')) {
                          notes[key] = allData[key];
                      }
                  });
                  
                  return Promise.resolve({ 
                      success: true, 
                      notes: notes 
                  });

              case 'deleteNote':
                  // Delete a specific note
                  if (request.noteId) {
                      await browser.storage.local.remove(`note_${request.noteId}`);
                      return Promise.resolve({ success: true, message: 'Note deleted' });
                  }
                  return Promise.resolve({ error: 'No note ID provided' });

              default:
                  console.warn('textPerfect Background: Unknown action:', request.action);
                  return Promise.resolve({ error: 'Unknown action' });
          }
      } catch (error) {
          console.error('textPerfect Background: Error handling message:', error);
          return Promise.resolve({ error: error.message });
      }
  }

  // Firefox-specific storage helpers
  async saveData(key, data) {
      try {
          await browser.storage.local.set({ [key]: data });
          return { success: true };
      } catch (error) {
          console.error('Storage save error:', error);
          return { error: error.message };
      }
  }

  async loadData(key) {
      try {
          const result = await browser.storage.local.get(key);
          return { success: true, data: result[key] };
      } catch (error) {
          console.error('Storage load error:', error);
          return { error: error.message };
      }
  }

  // Handle Firefox-specific tab permissions
  async checkTabPermissions(tabId) {
      try {
          const tab = await browser.tabs.get(tabId);
          const url = new URL(tab.url);
          
          // Check if we have permission for this domain
          if (url.hostname === 'takeuforward.org') {
              return true;
          }
          
          return false;
      } catch (error) {
          console.error('Permission check error:', error);
          return false;
      }
  }
}

// Initialize background script for Firefox
const textPerfectBackground = new TextPerfectBackground();
console.log('textPerfect Background: Firefox script loaded and initialized');
