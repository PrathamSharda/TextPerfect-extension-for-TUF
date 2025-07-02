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
  
                default:
                    console.warn('textPerfect Background: Unknown action:', request.action);
                    return Promise.resolve({ error: 'Unknown action' });
            }
        } catch (error) {
            console.error('textPerfect Background: Error handling message:', error);
            return Promise.resolve({ error: error.message });
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