
# TextPerfect – Elevate Your Notes on Take U Forward

TextPerfect is a powerful browser extension that transforms the plain text note-taking section on the [Take U Forward](https://takeuforward.org/) platform into a feature-rich text editor. Designed for learners, it enables cleaner, more organized, and effective notes for Data Structures and Algorithms (DSA), theory notes, and class preparation with zero friction.

---
## Features

- **Rich Text Editing**: Format notes with bold, italic, underline, headings (H1-H3), bullet and numbered lists, and code blocks.
- **Instant Activation**: Automatically enhances note sections on supported Take U Forward pages.
- **Lightweight**: Minimal performance impact with a clean, modern user interface.
- **Markdown Support**: Built-in Markdown parser for seamless import/export of notes.
- **Secure**: Utilizes DOMPurify for safe HTML sanitization to prevent XSS attacks.
- **Designed for Learners**: Tailored for DSA students, with support for code snippets and structured notes.
---
## How It Works

TextPerfect seamlessly integrates with the Take U Forward platform. It detects textareas named "note" and replaces them with a fully featured rich text editor overlay. Notes are converted between Markdown and rich HTML, ensuring compatibility with the platform's plain-text storage.

1. Install the extension from the Chrome Web Store or Firefox Add-ons.
2. Visit any supported page on [Take U Forward](https://takeuforward.org/).
3. Click or focus on a note section to activate the TextPerfect editor overlay.
4. Use the toolbar to format text, insert code blocks, or create lists.
5. Save your notes, which are converted to Markdown and stored in the original textarea.
---
## Screenshots


 ![Popup of Extension](https://github.com/user-attachments/assets/11b43475-3836-4845-9e51-0dbbe063e902)  ![Popup of Extension(1)](https://github.com/user-attachments/assets/ab179504-17a8-483e-a86d-a92c4dd8f01a)  ![Popup of Extension(2)](https://github.com/user-attachments/assets/a6965e7f-0e14-4ec1-b7b0-e3767ff1f189)  ![Popup of Extension(3)](https://github.com/user-attachments/assets/48482f13-e2df-4180-a64d-1f6edf6fb15c) 

---
# video Demo


https://github.com/user-attachments/assets/15faceea-d15a-4250-86d5-50aba610b0bb


https://www.youtube.com/watch?v=or0ELMZuwXQ
---

## Installation

### Option 1: Browser Store (currently not supported ->underwork)
- **Chrome**: [Install from Chrome Web Store](https://chromewebstore.google.com/detail/notes-enhancer-for-tuf-te/jjkgdjamkciachachkfhkmjkmcicbaig?authuser=0&hl=en-GB)
- **Firefox**: [Install from Firefox Add-ons](https://addons.mozilla.org/)
---
### Option 2: Manual Installation (Developer Mode)
1. Clone or download the repository:
``` bash
   git clone https://github.com/yourusername/textperfect-extension.git
   cd textperfect-extension
```
For Chrome:
``` 
    
        Open chrome://extensions/ in your browser.
        Enable Developer Mode.
        Click Load unpacked and select the textPerfect-c folder.
```
 For Firefox:


Navigate to the textPerfect-f folder:
        
```bash
    cd textperfect-extension/textPerfect-f
```
Install the web-ext tool globally:
```bash
    npm install --global web-ext
```

Run the extension in Firefox:
```bash

        web-ext run
```

---
## Project Structure
```
textperfect-extension/
├── textPerfect-c/                # Chrome version
│   ├── background.js             # Manages extension lifecycle and message handling
│   ├── backend_script.js         # Handles background processing (sanitization, utilities)
│   ├── contentScript.js          # Injected into TUF pages to enable the rich text editor
│   ├── manifest.json             # Chrome extension configuration
│   ├── popup.html                # Popup UI HTML
│   ├── popup.js                  # JavaScript for popup interactions
│   ├── popup.css                 # Styling for the popup
│   ├── styles.css                # Main stylesheet for editor and overlay
│   ├── purify.min.js             # DOMPurify for secure HTML sanitization
│   └── markdown-parser.js        # Custom Markdown to HTML parser
├── textPerfect-f/                # Firefox version (similar structure with Firefox-specific adjustments)
└── README.md                     # This file
```
---
## Tech Stack

- **JavaScript**: Core language for extension logic and functionality.
- **HTML/CSS**: For the popup and editor UI, with responsive design and modern styling.
 - **Markdown Parsing**: Custom parser for converting between Markdown and HTML.
- **DOMPurify**: Ensures safe handling of HTML content to prevent security vulnerabilities.
- **Chrome/Firefox Extension APIs**: For browser integration, lifecycle management, and content injection.

---
## Why Use TextPerfect?

- TextPerfect is built for students and professionals using Take U Forward to learn Data Structures and Algorithms. 
- It addresses the limitations of plain text notes by providing a modern, rich text editor that supports:Structured formatting for better organization and readability. 
- Code blocks for documenting DSA problem solutions and code snippets. 
- Markdown compatibility for easy export and sharing of notes.
- A distraction-free, intuitive interface tailored to learning.

---
### Prerequisites

- Node.js (for Firefox development)
- Git
- A modern web browser (Chrome or Firefox)
---
### Building for Production

- For Chrome: Package the textPerfect-c folder as a .zip file for the Chrome Web Store.
-  For Firefox: Use web-ext build in the textPerfect-f folder to create a .xpi file.
---

### Acknowledgments

- Built with inspiration from the Take U Forward community.
- Uses DOMPurify for secure HTML sanitization.
- Icons provided by Feather Icons.
