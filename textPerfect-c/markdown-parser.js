// Enhanced Markdown Parser and Converter
class MarkdownParser {
  constructor() {
    this.blockPatterns = {
      heading: /^(#{1,6})\s+(.+)$/gm,
      codeBlock: /^```(\w*)\n([\s\S]*?)^```$/gm,
      blockquote: /^>\s+(.+)$/gm,
      unorderedList: /^[\s]*[-*+]\s+(.+)$/gm,
      orderedList: /^[\s]*\d+\.\s+(.+)$/gm,
      paragraph: /^(?!#|```|>|[\s]*[-*+\d])(.+)$/gm
    };
    
    this.inlinePatterns = {
      bold: /\*\*(.*?)\*\*/g,
      italic: /\*(.*?)\*/g,
      underline: /__(.*?)__/g,
      inlineCode: /`([^`]+)`/g,
      link: /\[([^\]]+)\]\(([^)]+)\)/g
    };
  }

  // Convert HTML to Markdown
  htmlToMarkdown(html) {
    if (!html || html.trim() === '') return '';
    
  //  console.log('MarkdownParser: Converting HTML to Markdown');
    
    // Create a temporary div to work with
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    let markdown = '';
    
    const processNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        let content = '';
        
        // Handle special code block divs created by our editor
        if (tagName === 'div' && this.isCodeBlockDiv(node)) {
          const codeElement = node.querySelector('code');
          if (codeElement) {
            // Clone the element to process <br> tags without modifying original
            const codeClone = codeElement.cloneNode(true);
            
            // Convert <br> tags to line breaks for proper formatting
            const brElements = codeClone.querySelectorAll('br');
            brElements.forEach(br => {
              br.replaceWith('\n');
            });
            
            // Use innerText to preserve line breaks and formatting
            const codeContent = codeClone.innerText || codeClone.textContent || '';
            //console.log('MarkdownParser: Found code block with content:', codeContent);
            
            return `\`\`\`\n${codeContent}\n\`\`\``+`\u200B`;
          }
          //console.log('MarkdownParser: Code block div found but no code element');
          return '';
        }
        
        // Process children for other elements
        for (let child of node.childNodes) {
          content += processNode(child);
        }
        
        switch (tagName) {
          case 'h1':
            return `# ${content}\n\n`;
          case 'h2':
            return `## ${content}\n\n`;
          case 'h3':
            return `### ${content}\n\n`;
          case 'h4':
            return `#### ${content}\n\n`;
          case 'h5':
            return `##### ${content}\n\n`;
          case 'h6':
            return `###### ${content}\n\n`;
          case 'p':
            return content.trim() ? `${content}\n\n` : '\n';
          case 'br':
            return '\n';
          case 'strong':
          case 'b':
            return `**${content}**`;
          case 'em':
          case 'i':
            return `*${content}*`;
          case 'u':
            return `__${content}__`;
          case 'code':
            if (node.closest('div') && this.isCodeBlockDiv(node.closest('div'))) {
              return '';
            }
            return `\`${content}\``;
          case 'pre':
            if (node.closest('div') && this.isCodeBlockDiv(node.closest('div'))) {
              return '';
            }
            const codeEl = node.querySelector('code');
            const codeContent = codeEl ? codeEl.textContent : content;
            return `\`\`\`\n${codeContent}\n\`\`\`\n\n`;
          case 'blockquote':
            const lines = content.split('\n').filter(line => line.trim());
            return lines.map(line => `> ${line.trim()}`).join('\n') + '\n\n';
          case 'ul':
            return this.processList(node, '-') + '\n';
          case 'ol':
            return this.processList(node, '1.') + '\n';
          case 'li':
            return content;
          case 'a':
            const href = node.getAttribute('href') || '';
            return `[${content}](${href})`;
          case 'div':
            if (this.isCodeBlockDiv(node)) {
              return '';
            }
            return content + (content.endsWith('\n') ? '' : '\n');
          default:
            return content;
        }
      }
      
      return '';
    };
    
    for (let child of tempDiv.childNodes) {
      markdown += processNode(child);
    }
    
    // Clean up excessive newlines and trim
    const result = markdown.replace(/\n{3,}/g, '\n\n').trim();
   // console.log('MarkdownParser: HTML to Markdown conversion complete');
    return result;
  }
  
  isCodeBlockDiv(node) {
    if (!node || node.tagName.toLowerCase() !== 'div') return false;
    
    return node.classList?.contains('code-block-container') || 
           node.style.background?.includes('2a2a2a') ||
           node.style.backgroundColor?.includes('2a2a2a');
  }
  
  processList(listElement, marker) {
    let result = '';
    const items = listElement.querySelectorAll('li');
    
    items.forEach((item, index) => {
      const content = item.textContent.trim();
      if (marker === '1.') {
        result += `${index + 1}. ${content}\n`;
      } else {
        result += `${marker} ${content}\n`;
      }
    });
    
    return result;
  }

  // Convert Markdown to HTML
  markdownToHtml(markdown) {
    if (!markdown || markdown.trim() === '') return '';
    
   // console.log('MarkdownParser: Converting Markdown to HTML');
    
    let html = markdown;
    
    // Process block elements first
    // Headers (process from h6 to h1 to avoid conflicts)
    html = html.replace(/^(#{6})\s+(.+)$/gm, '<h6>$2</h6>');
    html = html.replace(/^(#{5})\s+(.+)$/gm, '<h5>$2</h5>');
    html = html.replace(/^(#{4})\s+(.+)$/gm, '<h4>$2</h4>');
    html = html.replace(/^(#{3})\s+(.+)$/gm, '<h3>$2</h3>');
    html = html.replace(/^(#{2})\s+(.+)$/gm, '<h2>$2</h2>');
    html = html.replace(/^(#{1})\s+(.+)$/gm, '<h1>$2</h1>');
    
    // Code blocks - preserve whitespace and line breaks
    html = html.replace(/```(\w*)\n([\s\S]*?)\n```/g, (match, lang, code) => {
      // Preserve line breaks by converting them to HTML line breaks
      const preservedCode = this.escapeHtml(code).replace(/\n/g, '<br>');
      return `<div class="code-block-container">
                <div>Code Block</div>
                <pre><code contenteditable="true">${preservedCode}</code></pre>
              </div>`;
    });
    
    // Blockquotes
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
    
    // Lists
    html = this.processMarkdownLists(html);
    
    // Process inline elements
    // Bold (do before italic to prevent conflicts)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Underline
    html = html.replace(/__(.*?)__/g, '<u>$1</u>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Line breaks and paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    html = `<p>${html}</p>`;
    
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p><br><\/p>/g, '');
    
    //console.log('MarkdownParser: Markdown to HTML conversion complete');
    return html;
  }
  
  processMarkdownLists(html) {
    const lines = html.split('\n');
    let result = [];
    let inUnorderedList = false;
    let inOrderedList = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const unorderedMatch = line.match(/^[\s]*[-*+]\s+(.+)$/);
      const orderedMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
      
      if (unorderedMatch) {
        if (!inUnorderedList) {
          if (inOrderedList) {
            result.push('</ol>');
            inOrderedList = false;
          }
          result.push('<ul>');
          inUnorderedList = true;
        }
        result.push(`<li>${unorderedMatch[1]}</li>`);
      } else if (orderedMatch) {
        if (!inOrderedList) {
          if (inUnorderedList) {
            result.push('</ul>');
            inUnorderedList = false;
          }
          result.push('<ol>');
          inOrderedList = true;
        }
        result.push(`<li>${orderedMatch[1]}</li>`);
      } else {
        if (inUnorderedList) {
          result.push('</ul>');
          inUnorderedList = false;
        }
        if (inOrderedList) {
          result.push('</ol>');
          inOrderedList = false;
        }
        result.push(line);
      }
    }
    
    // Close any remaining lists
    if (inUnorderedList) result.push('</ul>');
    if (inOrderedList) result.push('</ol>');
    
    return result.join('\n');
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export for use in other scripts
window.MarkdownParser = MarkdownParser;

