import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as Prism from 'prismjs';

// Import common languages
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-json';

@Pipe({
  name: 'convertTextToHtml',
  standalone: true
})
export class ConvertTextToHtmlPipe implements PipeTransform {
  private readonly languageAliases: { [key: string]: string } = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'cs': 'csharp',
    'html': 'markup',
    'xml': 'markup'
  };

  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string): SafeHtml {
    if (!text) return '';

    // Split the text into code blocks and regular text
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    let formattedContent = parts.map(part => {
      if (part.startsWith('```')) {
        // Handle code blocks
        const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
        if (match) {
          let [, language = 'plaintext', code] = match;
          code = code.trim();
          
          // Normalize language name
          language = this.normalizeLanguage(language);

          // Highlight the code
          const highlightedCode = Prism.highlight(
            code,
            Prism.languages[language] || Prism.languages['plaintext'],
            language
          );
          
          return `
            <div class="code-block">
              <div class="code-block-header">
                <span class="language-label">${language}</span>
                <button class="copy-code-btn" data-code="${this.escapeHtml(code)}">
                  <i class="fa fa-copy"></i> Copy
                </button>
              </div>
              <pre class="language-${language}"><code>${highlightedCode}</code></pre>
            </div>
          `;
        }
      }
      
      // Handle regular text with inline code
      return this.formatTextContent(part);
    }).join('');

    return this.sanitizer.bypassSecurityTrustHtml(formattedContent);
  }

  private normalizeLanguage(language: string): string {
    language = language.toLowerCase();
    return this.languageAliases[language] || language;
  }

  private formatTextContent(text: string): string {
    // Handle inline code
    text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    // Convert URLs to links
    text = text.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    // Convert newlines to <br> tags
    text = text.replace(/\n/g, '<br>');
    
    return text;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}