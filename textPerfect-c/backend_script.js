// Backend Script for textPerfect Extension
class TextPerfectBackend {
  constructor() {
    this.initialized = false;
    this.init();
  }
  
  init() {
    if (this.initialized) return;
    
   // console.log('textPerfect Backend: Initializing...');
    this.initialized = true;
   // console.log('textPerfect Backend: Initialized successfully');
  }
  
  // Utility functions that can be used by other scripts
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  static sanitizeHtml(html) {
    const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'li', 'a', 'div'];
    const allowedAttributes = ['href', 'target', 'style', 'class'];
    
    // Basic HTML sanitization
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    const sanitize = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        
        if (!allowedTags.includes(tagName)) {
          return node.textContent;
        }
        
        let result = `<${tagName}`;
        
        // Add allowed attributes
        for (const attr of node.attributes) {
          if (allowedAttributes.includes(attr.name.toLowerCase())) {
            result += ` ${attr.name}="${attr.value}"`;
          }
        }
        
        result += '>';
        
        // Process children
        for (const child of node.childNodes) {
          result += sanitize(child);
        }
        
        result += `</${tagName}>`;
        return result;
      }
      
      return '';
    };
    
    let sanitized = '';
    for (const child of temp.childNodes) {
      sanitized += sanitize(child);
    }
    
    return sanitized;
  }
  sanitizeHtmlContent(html) {
    
    // Check if DOMPurify is available
    if (typeof DOMPurify === 'undefined') {
      
      console.warn('DOMPurify not found, falling back to basic sanitization');
      return this.fallbackSanitize(html);
    }
    
    // DOMPurify configuration matching your original allowed tags/attributes
   
    const config = {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'code', 'pre', 
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 
        'ul', 'ol', 'li', 'a','div'
      ],
      ALLOWED_ATTR: ['href', 'target', 'class'],
      ALLOW_DATA_ATTR: false,
      FORBID_SCRIPT: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input','style','iframe'],
      FORBID_CONTENTS: ['onload', 'onerror'],
      KEEP_CONTENT: true,
      SANITIZE_DOM: true
    };
    
    try {
      return DOMPurify.sanitize(html, config);
      
    } catch (error) {
      console.error('DOMPurify sanitization failed:', error);
      return this.fallbackSanitize(html);
    }
  }
  
  static getTextStats(text) {
    const words = text.trim() ? text.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    
    return {
      words,
      characters,
      charactersNoSpaces,
      paragraphs
    };
  }
}

// Initialize backend
const textPerfectBackend = new TextPerfectBackend();

// Export for use in other scripts
window.TextPerfectBackend = TextPerfectBackend;
//console.log('textPerfect Backend: Script loaded successfully');
