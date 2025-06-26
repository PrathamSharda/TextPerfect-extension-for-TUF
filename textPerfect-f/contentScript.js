// Content Script for textPerfect Extension
class NotesExtensionContent {
  constructor() {
    this.overlayInjected = false;
    this.targetTextarea = null;
    this.documentObserver = null;
    this.isInitialized = false;
    this.markdownParser = new MarkdownParser();
    this.isOverlayActive = false;
    this.originalContent = '';
    this.eventListeners = [];

    this.init();
  }

  init() {
   // console.log('textPerfect: Content script starting...');
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupAfterDOMReady();
      });
    } else {
      this.setupAfterDOMReady();
    }
  }

  setupAfterDOMReady() {
   // console.log('textPerfect: Setting up after DOM ready');
    this.setupDocumentObserver();
    this.findNotesTextarea();
    this.setupMessageListener();
    this.isInitialized = true;
    
    // Add a test button for debugging
    this.addTestButton();
    
    //console.log('textPerfect: Content script ready');
  }

  setupMessageListener() {
    browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'getStatus':
          sendResponse({ initialized: this.isInitialized });
          break;
        case 'showOverlay':
          this.showOverlay();
          sendResponse({ success: true });
          break;
        case 'hideOverlay':
          this.hideOverlay();
          sendResponse({ success: true });
          break;
      }
    });
  }

  addTestButton() {
    const testBtn = document.createElement('button');
    testBtn.id = 'textperfect-test-btn';
    testBtn.style.cssText = `
     
    `;
    
    
    document.body.appendChild(testBtn);
    //console.log('textPerfect: Test button added');
  }

  // Find textarea specifically named "note"
  findNotesTextarea() {
    const noteTextarea = document.querySelector('textarea[name="note"]');
    
    if (noteTextarea && this.targetTextarea !== noteTextarea) {
      this.targetTextarea = noteTextarea;
     // console.log('textPerfect: Found textarea[name="note"]');
      
      // Add focus listener to show overlay
      this.setupTextareaListener(noteTextarea);
    }
    
    return noteTextarea;
  }

  setupTextareaListener(textarea) {
    // Remove existing listeners first
    const existingHandler = textarea._textPerfectHandler;
    if (existingHandler) {
      textarea.removeEventListener('focus', existingHandler);
    }

    // Create new handler
    const focusHandler = (e) => {
      if (!this.isOverlayActive) {
       // console.log('textPerfect: Textarea focused, showing overlay...');
        this.showOverlay();
      }
    };

    // Store handler reference and add listener
    textarea._textPerfectHandler = focusHandler;
    textarea.addEventListener('focus', focusHandler);
    
    // Also add click handler for better detection
    const clickHandler = (e) => {
      if (!this.isOverlayActive) {
       // console.log('textPerfect: Textarea clicked, showing overlay...');
        setTimeout(() => this.showOverlay(), 100);
      }
    };
    textarea.addEventListener('click', clickHandler);
    
   // console.log('textPerfect: Event listeners added to textarea');
  }

  setupDocumentObserver() {
    this.documentObserver = new MutationObserver((mutations) => {
      let shouldCheckForTextarea = false;

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if added node contains our target textarea
            if (node.tagName === 'TEXTAREA' && node.name === 'note') {
              shouldCheckForTextarea = true;
            } else if (node.querySelector && node.querySelector('textarea[name="note"]')) {
              shouldCheckForTextarea = true;
            }
          }
        });
      });

      if (shouldCheckForTextarea) {
        setTimeout(() => this.findNotesTextarea(), 100);
      }
    });

    this.documentObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Block all page interactions
  blockPageInteractions() {
    // Block all click events
    const blockClick = (e) => {
      const overlay = document.getElementById('notes-extension-overlay');
      if (overlay && !overlay.contains(e.target)) {
        
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    // Block all key events except within overlay
    const blockKey = (e) => {
      const overlay = document.getElementById('notes-extension-overlay');
      if (overlay && !overlay.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    // Block all mouse events
    const blockMouse = (e) => {
      const overlay = document.getElementById('notes-extension-overlay');
      if (overlay && !overlay.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    // Add event listeners to capture phase to block everything
    const events = ['click', 'mousedown', 'mouseup', 'mousemove', 'keydown', 'keyup', 'keypress', 'focus', 'blur'];
    events.forEach(eventType => {
      const handler = eventType.includes('key') ? blockKey : (eventType.includes('mouse') || eventType.includes('click')) ? blockMouse : blockClick;
      document.addEventListener(eventType, handler, true);
      this.eventListeners.push({ type: eventType, handler, capture: true });
    });

   // console.log('textPerfect: Page interactions blocked');
  }

  // Unblock page interactions
  unblockPageInteractions() {
    this.eventListeners.forEach(({ type, handler, capture }) => {
      document.removeEventListener(type, handler, capture);
    });
    this.eventListeners = [];
    //console.log('textPerfect: Page interactions unblocked');
  }

  async showOverlay() {
    if (this.overlayInjected) {
     // console.log('textPerfect: Overlay already shown');
      const existingOverlay = document.getElementById('notes-extension-overlay');
      if (existingOverlay) {
        existingOverlay.style.display = 'flex';
        existingOverlay.style.visibility = 'visible';
        existingOverlay.style.opacity = '1';
      }
      return;
    }

    try {
     // console.log('textPerfect: Injecting overlay...');
      
      // Store original content from textarea
      this.originalContent = this.targetTextarea ? this.targetTextarea.value : '';
      
      // Block all page interactions
      this.blockPageInteractions();
      this.isOverlayActive = true;

      // Create overlay element
      const overlay = document.createElement('div');
      overlay.id = 'notes-extension-overlay';
      
      // Set the complete HTML content
      overlay.innerHTML = this.getOverlayHTML();
      
      // Add to body
      document.body.appendChild(overlay);
      
      // Setup event handlers
      this.setupOverlayEventHandlers();
      
      // Load existing content from textarea
      this.loadContentFromTextarea();
      
      this.overlayInjected = true;
      //console.log('textPerfect: Overlay injected successfully');
      
    } catch (error) {
      //console.error('textPerfect: Error creating overlay:', error);
    }
  }

  hideOverlay() {
    const overlay = document.getElementById('notes-extension-overlay');
    if (overlay) {
      overlay.remove();
      this.overlayInjected = false;
      this.isOverlayActive = false;
      
      // Unblock page interactions
      this.unblockPageInteractions();
      
      //console.log('textPerfect: Overlay hidden');
    }
  }

  saveAndClose() {
    // Convert content to markdown and save to textarea
    this.saveContentToTextarea();
    this.hideOverlay();
  }

  cancelAndClose() {
    // Restore original content without converting to markdown
    if (this.targetTextarea) {
      this.targetTextarea.value = this.originalContent;
    }
    this.hideOverlay();
  }

  getOverlayHTML() {
    return `
      <div class="dialog-box">
        <!-- Header -->
        <div class="dialog-header">
          <h2 class="dialog-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            Save notes
          </h2>
          <div class="dialog-controls">
            <button type="button" id="clear-btn" class="control-btn delete-btn" title="Clear Content">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="dialog-content">
          <!-- Toolbar -->
          <div class="toolbar">
            <div class="toolbar-group">
              <button type="button" id="bold-btn" class="toolbar-btn" title="Bold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                  <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                </svg>
              </button>
              <button type="button" id="italic-btn" class="toolbar-btn" title="Italic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="19" y1="4" x2="10" y2="4"></line>
                  <line x1="14" y1="20" x2="5" y2="20"></line>
                  <line x1="15" y1="4" x2="9" y2="20"></line>
                </svg>
              </button>
              <button type="button" id="underline-btn" class="toolbar-btn" title="Underline">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
                  <line x1="4" y1="21" x2="20" y2="21"></line>
                </svg>
              </button>
            </div>
            
            <div class="toolbar-separator"></div>
            
            <div class="toolbar-group">
              <button type="button" id="h1-btn" class="toolbar-btn" title="Heading 1">H1</button>
              <button type="button" id="h2-btn" class="toolbar-btn" title="Heading 2">H2</button>
              <button type="button" id="h3-btn" class="toolbar-btn" title="Heading 3">H3</button>
            </div>
            
            <div class="toolbar-separator"></div>
            
            <div class="toolbar-group">
              <button type="button" id="code-btn" class="toolbar-btn" title="Code Block">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="16,18 22,12 16,6"></polyline>
                  <polyline points="8,6 2,12 8,18"></polyline>
                </svg>
              </button>
              <button type="button" id="bullet-list-btn" class="toolbar-btn" title="Bullet List">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              </button>
              <button type="button" id="numbered-list-btn" class="toolbar-btn" title="Numbered List">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="10" y1="6" x2="21" y2="6"></line>
                  <line x1="10" y1="12" x2="21" y2="12"></line>
                  <line x1="10" y1="18" x2="21" y2="18"></line>
                  <path d="M4 6h1v4"></path>
                  <path d="M4 10h2"></path>
                  <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Editor Container -->
          <div class="text-editor-container">
            <div id="text-editor" contenteditable="true" data-placeholder="Start typing your notes here..."></div>
          </div>

          <!-- Statistics -->
          <div class="editor-stats">
            <span id="word-count">Words: 0</span>
            <span id="char-count">Characters: 0</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="dialog-footer">
          <div class="footer-right">
            <button type="button" id="cancel-btn" class="btn btn-cancel">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Cancel
            </button>
            <button type="button" id="save-btn" class="btn btn-save">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17,21 17,13 7,13 7,21"></polyline>
                <polyline points="7,3 7,8 15,8"></polyline>
              </svg>
              Save
            </button>
          </div>
        </div>
      </div>
    `;
  }

  setupOverlayEventHandlers() {
    const editor = document.getElementById('text-editor');
    
    // Prevent overlay from closing on clicks inside
    const overlay = document.getElementById('notes-extension-overlay');
    overlay.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Clear button
    document.getElementById('clear-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all content?')) {
        editor.innerHTML = '\u200B';
        this.updateStats();
      }
    });

    // Save button - only converts to markdown on save
    document.getElementById('save-btn').addEventListener('click', () => {
      this.saveAndClose();
    });

    // Cancel button
    document.getElementById('cancel-btn').addEventListener('click', () => {
      this.cancelAndClose();
    });

    // Toolbar buttons
    this.setupToolbarHandlers();

    // Editor event handlers
    this.setupEditorHandlers();

    // Update stats on input
    editor.addEventListener('input', () => {
      this.updateStats();
    });

    // Initial stats
    this.updateStats();
  }

  // setupToolbarHandlers() {
  //   // Bold
  //   document.getElementById('bold-btn').addEventListener('click', (e) => {
  //     e.preventDefault();
  //     document.execCommand('bold', false, null);
  //   });

  //   // Italic
  //   document.getElementById('italic-btn').addEventListener('click', (e) => {
  //     e.preventDefault();
  //     document.execCommand('italic', false, null);
  //   });

  //   // Underline
  //   document.getElementById('underline-btn').addEventListener('click', (e) => {
  //     e.preventDefault();
  //     document.execCommand('underline', false, null);
  //   });

  //   // Headers
  //   document.getElementById('h1-btn').addEventListener('click', (e) => {
  //     e.preventDefault();
  //     document.execCommand('formatBlock', false, '<h1>');
  //   });

  //   document.getElementById('h2-btn').addEventListener('click', (e) => {
  //     e.preventDefault();
  //     document.execCommand('formatBlock', false, '<h2>');
  //   });

  //   document.getElementById('h3-btn').addEventListener('click', (e) => {
  //     e.preventDefault();
  //     document.execCommand('formatBlock', false, '<h3>');
  //   });

  //   // Code block
  //   document.getElementById('code-btn').addEventListener('click', (e) => {
  //     e.preventDefault();
  //     this.insertCodeBlock();
  //   });

  //   // Lists
  //   document.getElementById('bullet-list-btn').addEventListener('click', (e) => {
  //     e.preventDefault();
  //     document.execCommand('insertUnorderedList', false, null);
  //   });

  //   document.getElementById('numbered-list-btn').addEventListener('click', (e) => {
  //     e.preventDefault();
  //     document.execCommand('insertOrderedList', false, null);
  //   });
  // }

  // setupEditorHandlers() {
  //   const editor = document.getElementById('text-editor');

  //   // Handle Enter key in code blocks to prevent creating new code blocks
  //   editor.addEventListener('keydown', (e) => {
  //     if (e.key === 'Enter') {
  //       const selection = window.getSelection();
  //       const range = selection.getRangeAt(0);
  //       const container = range.commonAncestorContainer;
        
  //       // Check if we're inside a code block
  //       const codeBlock = this.findParentCodeBlock(container);
  //       if (codeBlock) {
  //         e.preventDefault();
          
  //         // Insert a line break instead of creating a new block
  //         const br = document.createElement('br');
  //         range.deleteContents();
  //         range.insertNode(br);
          
  //         // Move cursor after the br
  //         range.setStartAfter(br);
  //         range.setEndAfter(br);
  //         selection.removeAllRanges();
  //         selection.addRange(range);
          
  //         return false;
  //       }
  //     }
  //   });

  //   // Prevent default behavior that might interfere with our code blocks
  //   editor.addEventListener('paste', (e) => {
  //     e.preventDefault();
  //     const text = e.clipboardData.getData('text/plain');
  //     document.execCommand('insertText', false, text);
  //   });
  // }

  // findParentCodeBlock(node) {
  //   let current = node;
  //   while (current && current !== document.getElementById('text-editor')) {
  //     if (current.nodeType === Node.ELEMENT_NODE) {
  //       if (current.tagName === 'CODE' || 
  //           current.tagName === 'PRE' || 
  //           current.classList?.contains('code-block-container')) {
  //         return current;
  //       }
  //     }
  //     current = current.parentNode;
  //   }
  //   return null;
  // }

  setupEditorHandlers() {
    const editor = document.getElementById('text-editor');
  
    // Handle Enter key in code blocks to prevent creating new code blocks
    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        
        // Check if we're inside a code block
        const codeBlock = this.findParentCodeBlock(container);
        if (codeBlock) {
          e.preventDefault();
          e.stopPropagation();
          
          // Insert a line break instead of creating a new block
          const br = document.createElement('br');
          
          // Delete any selected content first
          range.deleteContents();
          
          // Insert the br element
          range.insertNode(br);
          
          // Create a new range after the br
          const newRange = document.createRange();
          newRange.setStartAfter(br);
          newRange.collapse(true);
          
          // Update selection
          selection.removeAllRanges();
          selection.addRange(newRange);
          
          // Update stats after modification
          this.updateStats();
          return false;
        }
      }
    });
  
    // Handle paste events
    editor.addEventListener('paste', (e) => {
      // Check if we're pasting inside a code block
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const codeBlock = this.findParentCodeBlock(range.commonAncestorContainer);
        
        if (codeBlock) {
          // Let the code block's own paste handler deal with it
          return;
        }
      }
      
      // For regular editor content, use plain text
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
      this.updateStats();
    });
  }
  
  // Fixed findParentCodeBlock method
  findParentCodeBlock(node) {
    let current = node;
    const editor = document.getElementById('text-editor');
    
    while (current && current !== editor && current !== document.body) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        // Check for the actual code element inside your code blocks
        if (current.tagName === 'CODE' && current.contentEditable === 'true') {
          return current;
        }
        // Check for the code block container
        if (current.classList && current.classList.contains('code-block-container')) {
          // Find the code element within this container
          const codeElement = current.querySelector('code[contenteditable="true"]');
          if (codeElement) {
            return codeElement;
          }
        }
        // Also check for pre elements that might contain our code
        if (current.tagName === 'PRE') {
          const codeElement = current.querySelector('code[contenteditable="true"]');
          if (codeElement) {
            return codeElement;
          }
        }
      }
      current = current.parentNode;
    }
    return null;
  }

  // insertCodeBlock() {
  //   const editor = document.getElementById('text-editor');
  //   const selection = window.getSelection();
  //   const range = selection.getRangeAt(0);

  //   // Create code block container
  //   const codeBlockContainer = document.createElement('div');
  //   codeBlockContainer.className = 'code-block-container';
  //   codeBlockContainer.style.cssText = `
  //     margin: 16px 0;
  //     background: #2a2a2a;
  //     border: 1px solid #444;
  //     border-radius: 8px;
  //     overflow: hidden;
  //   `;

  //   // Create header
  //   const header = document.createElement('div');
  //   header.style.cssText = `
  //     background: #333;
  //     padding: 8px 12px;
  //     font-size: 12px;
  //     color: #aaa;
  //     display: flex;
  //     justify-content: space-between;
  //     align-items: center;
  //   `;
  //   header.textContent = 'Code Block';

  //   // Create pre element
  //   const pre = document.createElement('pre');
  //   pre.style.cssText = `
  //     margin: 0;
  //     padding: 16px;
  //     background: #1e1e1e;
  //     color: #e0e0e0;
  //     font-family: 'SF Mono', Monaco, monospace;
  //     font-size: 14px;
  //     line-height: 1.4;
  //     overflow-x: auto;
  //     white-space: pre-wrap;
  //   `;

  //   // Create code element
  //   const code = document.createElement('code');
  //   code.contentEditable = true;
  //   code.textContent = 'Enter your code here...';
  //   code.style.cssText = `
  //     display: block;
  //     outline: none;
  //   `;

  //   // Add event listener to handle proper editing
  //   code.addEventListener('click', () => {
  //     if (code.textContent === 'Enter your code here...') {
  //       code.textContent = '';
  //     }
  //     code.focus();
  //   });
  //   code.addEventListener('paste',async(e)=>{
  //     e.preventDefault();
  //     let paste= e.clipboardData.getData('text');
  //     console.log('Pasted content:', paste);
  //     let formattingPaste=paste.replaceAll('\n','<br></br>');
  //     const selection=window.getSelection();
  //     if (!selection.rangeCount) return;
  //     selection.deleteFromDocument();
  //     selection.getRangeAt(0).insertNode(document.createTextNode(formattingPaste));
  //     selection.collapseToEnd();
  //   });
  //   // Assemble the code block
  //   pre.appendChild(code);
  //   codeBlockContainer.appendChild(header);
  //   codeBlockContainer.appendChild(pre);

  //   // Insert into editor
  //   range.deleteContents();
  //   range.insertNode(codeBlockContainer);

  //   // Add a paragraph after the code block for continued typing
  //   const afterPara = document.createElement('p');
  //   afterPara.innerHTML = '<br>';
  //   codeBlockContainer.insertAdjacentElement('afterend', afterPara);

  //   // Set cursor in the new paragraph
  //   const newRange = document.createRange();
  //   newRange.setStart(afterPara, 0);
  //   newRange.setEnd(afterPara, 0);
  //   selection.removeAllRanges();
  //   selection.addRange(newRange);
  // }
// Fixed insertCodeBlock method
insertCodeBlock() {
  const editor = document.getElementById('text-editor');
  
  // Ensure we're working within the overlay editor only
  if (!editor || !document.getElementById('notes-extension-overlay')) {
    console.warn('textPerfect: Editor not found or overlay not active');
    return;
  }

  const selection = window.getSelection();
  
  // Verify the selection is within our editor
  if (!selection.rangeCount) {
    // If no selection, focus the editor and create a range at the end
    editor.focus();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false); // Collapse to end
    selection.removeAllRanges();
    selection.addRange(range);
  }

  const range = selection.getRangeAt(0);
  
  // Double-check that the range is within our editor
  const editorElement = document.getElementById('text-editor');
  if (!editorElement.contains(range.commonAncestorContainer) && 
      range.commonAncestorContainer !== editorElement) {
    // Force focus back to our editor
    editor.focus();
    const newRange = document.createRange();
    newRange.selectNodeContents(editor);
    newRange.collapse(false);
    selection.removeAllRanges();
    selection.addRange(newRange);
    return; // Exit and let user try again
  }

  // Create code block container
  const codeBlockContainer = document.createElement('div');
  codeBlockContainer.className = 'code-block-container';
  codeBlockContainer.style.cssText = `
    margin: 16px 0;
    background: #2a2a2a;
    border: 1px solid #444;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    z-index: 1;
  `;

  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    background: #333;
    padding: 8px 12px;
    font-size: 12px;
    color: #aaa;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  header.textContent = 'Code Block';

  // Create pre element
  const pre = document.createElement('pre');
  pre.style.cssText = `
    margin: 0;
    padding: 16px;
    background: #1e1e1e;
    color: #e0e0e0;
    font-family: 'SF Mono', Monaco, monospace;
    font-size: 14px;
    line-height: 1.4;
    overflow-x: auto;
    white-space: pre-wrap;
  `;

  // Create code element
  const code = document.createElement('code');
  code.contentEditable = true;
  code.textContent = 'Enter your code here...';
  code.style.cssText = `
    display: block;
    outline: none;
  `;

  // Add event listener to handle proper editing
  code.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent event bubbling
    if (code.textContent === 'Enter your code here...') {
      code.textContent = '';
    }
    code.focus();
  });

  // Fixed paste handler for code blocks
  code.addEventListener('paste', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    let paste = e.clipboardData.getData('text/plain');
    console.log('Pasted content:', paste);
    
    // Insert plain text without HTML formatting
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    selection.deleteFromDocument();
    const textNode = document.createTextNode(paste);
    selection.getRangeAt(0).insertNode(textNode);
    selection.collapseToEnd();
  });

  // Prevent any events from bubbling outside the overlay
  code.addEventListener('keydown', (e) => {
    e.stopPropagation();
  });

  code.addEventListener('input', (e) => {
    e.stopPropagation();
    // Update stats when code content changes
    this.updateStats();
  });

  // Assemble the code block
  pre.appendChild(code);
  codeBlockContainer.appendChild(header);
  codeBlockContainer.appendChild(pre);

  // Insert into editor with better positioning
  try {
    range.deleteContents();
    range.insertNode(codeBlockContainer);

    // Add a paragraph after the code block for continued typing
    const afterPara = document.createElement('p');
    afterPara.innerHTML = '<br>';
    codeBlockContainer.insertAdjacentElement('afterend', afterPara);

    // Set cursor in the new paragraph
    const newRange = document.createRange();
    newRange.setStart(afterPara, 0);
    newRange.setEnd(afterPara, 0);
    selection.removeAllRanges();
    selection.addRange(newRange);
    
    // Update stats after insertion
    this.updateStats();
    
  } catch (error) {
    console.error('textPerfect: Error inserting code block:', error);
    // Fallback: just focus the editor
    editor.focus();
  }
}

// Enhanced setupToolbarHandlers method with better event isolation
setupToolbarHandlers() {
  // Ensure all toolbar button clicks are contained within overlay
  const toolbarButtons = document.querySelectorAll('#notes-extension-overlay .toolbar-btn');
  
  toolbarButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Ensure focus is on our editor before any command
      const editor = document.getElementById('text-editor');
      if (editor) {
        editor.focus();
      }
    });
  });

  // Bold
  document.getElementById('bold-btn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.executeEditorCommand('bold');
  });

  // Italic
  document.getElementById('italic-btn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.executeEditorCommand('italic');
  });

  // Underline
  document.getElementById('underline-btn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.executeEditorCommand('underline');
  });

  // Headers
  document.getElementById('h1-btn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.executeEditorCommand('formatBlock', '<h1>');
  });

  document.getElementById('h2-btn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.executeEditorCommand('formatBlock', '<h2>');
  });

  document.getElementById('h3-btn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.executeEditorCommand('formatBlock', '<h3>');
  });

  // Code block
  document.getElementById('code-btn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.insertCodeBlock();
  });

  // Lists
  document.getElementById('bullet-list-btn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.executeEditorCommand('insertUnorderedList');
  });

  document.getElementById('numbered-list-btn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.executeEditorCommand('insertOrderedList');
  });
}

// New helper method to safely execute editor commands
executeEditorCommand(command, value = null) {
  const editor = document.getElementById('text-editor');
  if (!editor || !document.getElementById('notes-extension-overlay')) {
    console.warn('textPerfect: Editor not available');
    return;
  }

  // Ensure editor has focus
  editor.focus();
  
  // Verify selection is within our editor
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer) && 
        range.commonAncestorContainer !== editor) {
      // Create new selection within editor
      const newRange = document.createRange();
      newRange.selectNodeContents(editor);
      newRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  }

  // Execute the command
  try {
    document.execCommand(command, false, value);
    this.updateStats();
  } catch (error) {
    console.error(`textPerfect: Error executing command ${command}:`, error);
  }
}
  loadContentFromTextarea() {
    const editor = document.getElementById('text-editor');
    if (this.targetTextarea && this.targetTextarea.value) {
      // Convert markdown to HTML for editing
      const htmlContent = this.markdownParser.markdownToHtml(this.targetTextarea.value);
      editor.innerHTML = htmlContent;
    } else {
      editor.innerHTML = '';
    }
    this.updateStats();
  }

  saveContentToTextarea() {
    const editor = document.getElementById('text-editor');
    if (this.targetTextarea && editor) {
      // Convert HTML content to markdown only on save
      const markdownContent = this.markdownParser.htmlToMarkdown(editor.innerHTML);
      this.targetTextarea.value = markdownContent;
      
      // Trigger change event so the page knows the textarea was updated
      const event = new Event('change', { bubbles: true });
      this.targetTextarea.dispatchEvent(event);
      
      //console.log('textPerfect: Content saved to textarea as markdown');
    }
  }

  updateStats() {
    const editor = document.getElementById('text-editor');
    const text = editor.textContent || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;

    document.getElementById('word-count').textContent = `Words: ${words}`;
    document.getElementById('char-count').textContent = `Characters: ${chars}`;
  }
}

// Initialize content script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new NotesExtensionContent();
  });
} else {
  new NotesExtensionContent();
}

//console.log('textPerfect: Content script loaded');
