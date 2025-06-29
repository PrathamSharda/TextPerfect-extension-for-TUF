class TextPerfectBackground {
  constructor() {
      this.init();
  }

  init() {

      // Listen for messages from content scripts and popup
      browser.runtime.onMessage.addListener((request, sender) => {
          return this.handleMessage(request, sender);
      });
  }

  async ensureContentScriptInjected(tabId) {
      try {
          // Try to ping the content script
          const response = await browser.tabs.sendMessage(tabId, { action: 'getStatus' });
          if (response && response.initialized) {
              return;
          }
      } catch (error) {
          // Content script not loaded or not responding, inject it          
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
          } catch (injectError) {
              console.error('textPerfect Background: Error injecting content script:', injectError);
          }
      }
  }

  async handleMessage(request, sender) {
      try {
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
