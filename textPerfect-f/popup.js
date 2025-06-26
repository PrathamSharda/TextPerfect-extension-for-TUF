// DEBUGGING VERSION - Add this to your popup script
class TextPerfectPopup {
  constructor() {
    this.init();
  }

  async init() {
    console.log('textPerfect Popup: Initializing...');
    try {
      await this.updateStatus();
      this.setupEventListeners();
      console.log('textPerfect Popup: Ready');
    } catch (error) {
      console.error('textPerfect Popup: Init failed:', error);
      // Update UI to show error state
      this.updateExtensionStatus('Failed to Initialize', false);
    }
  }

  async updateStatus() {
    try {
      console.log('textPerfect Popup: Checking background status...');
      
      // Add timeout to prevent infinite waiting
      const backgroundStatus = await Promise.race([
        browser.runtime.sendMessage({ action: 'getStatus' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      
      console.log('Background status:', backgroundStatus);
      
      if (backgroundStatus && backgroundStatus.success) {
        this.updateExtensionStatus('Active', true);
      } else {
        this.updateExtensionStatus('Background Error', false);
      }

      // Get current tab info
      console.log('textPerfect Popup: Getting current tab...');
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        console.log('Current tab:', tab.url);
        this.updatePageStatus(tab.url);
        await this.checkForNotes(tab.id);
      } else {
        console.error('No active tab found');
        this.updatePageStatus('Unknown');
      }

    } catch (error) {
      console.error('textPerfect Popup: Error updating status:', error);
      this.updateExtensionStatus('Error: ' + error.message, false);
      
      // Still try to get tab info even if background fails
     
    }
  }

  updateExtensionStatus(status, isActive) {
    console.log('Updating extension status:', status, isActive);
    const statusElement = document.getElementById('extension-status');
    const indicatorElement = document.getElementById('status-indicator');
    
    if (statusElement) {
      statusElement.textContent = status;
    }
    if (indicatorElement) {
      indicatorElement.className = `status-indicator ${isActive ? 'status-active' : 'status-inactive'}`;
    }
  }

  updatePageStatus(url) {
    console.log('Updating page status for:', url);
    const pageStatusElement = document.getElementById('page-status');
    
    if (!pageStatusElement) {
      console.error('page-status element not found');
      return;
    }

    if (url && url.includes('takeuforward.org')) {
      pageStatusElement.textContent = 'TakeUForward (Supported)';
      pageStatusElement.style.color = '#28a745';
    } else if (url) {
      pageStatusElement.textContent = 'Compatible';
      pageStatusElement.style.color = '#ffc107';
    } else {
      pageStatusElement.textContent = 'Unknown Page';
      pageStatusElement.style.color = '#6c757d';
    }
  }

  async checkForNotes(tabId) {
    console.log('Checking for notes on tab:', tabId);
    const notesStatusElement = document.getElementById('notes-status');
    
    if (!notesStatusElement) {
      console.error('notes-status element not found');
      return;
    }

   
  }

  setupEventListeners() {
    console.log('Setting up event listeners...');
    // Add your event listeners here
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new TextPerfectPopup();
  });
} else {
  new TextPerfectPopup();
}