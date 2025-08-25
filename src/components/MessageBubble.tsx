
import React, { useState } from 'react';
import { Copy, Code, User, Bot, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import CodePreview from './CodePreview';
import CodeBlock from './CodeBlock';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date | string;
  category?: string;
}

interface Props {
  message: Message;
  isDarkMode?: boolean;
}

const MessageBubble: React.FC<Props> = ({ message, isDarkMode = true }) => {
  const [showPreview, setShowPreview] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "הועתק!",
      description: "התוכן הועתק ללוח הכתיבה.",
    });
  };

  // Function to detect if text is Hebrew
  const isHebrewText = (text: string): boolean => {
    if (!text) return false;
    const hebrewChars = text.match(/[\u0590-\u05FF]/g) || [];
    const totalChars = text.replace(/\s/g, '').length;
    return totalChars > 0 && (hebrewChars.length / totalChars) > 0.3;
  };

  // Function to detect if text is code
  const isCodeText = (text: string): boolean => {
    if (!text) return false;
    
    const codePatterns = [
      /function\s*\(/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /var\s+\w+\s*=/,
      /import\s+/,
      /export\s+/,
      /class\s+\w+/,
      /interface\s+\w+/,
      /\{\s*\w+:/,
      /<\w+/,
      /\$\s*\w+/,
      /npm\s+/,
      /cd\s+/,
      /git\s+/,
      /console\./,
      /document\./,
      /window\./,
      /\w+\(\)/,
      /=>\s*{/,
      /DOCTYPE/,
      /html/,
      /head/,
      /body/,
      /meta/,
      /script/,
      /style/,
      /^[\$#]\s+/,
      /^\w+@\w+:/,
      /\w+\.\w+\(/
    ];
    
    return codePatterns.some(pattern => pattern.test(text));
  };

  // Function to parse content and separate Hebrew text from code
  const parseContent = (content: string) => {
    const segments = [];
    const lines = content.split('\n');
    let currentSegment = { type: '', content: '', lines: [] as string[] };
    let inCodeBlock = false;
    let codeBlockType = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip empty lines
      if (!line.trim()) {
        if (currentSegment.lines.length > 0) {
          currentSegment.lines.push(line);
        }
        continue;
      }

      // Detect specific code block starts
      let isCodeStart = false;
      let detectedCodeType = '';
      
      if (!inCodeBlock) {
        // HTML/XML documents - including plain "html" start
        if (/^(<!DOCTYPE|<html|<HTML|html\s*$|html$)/i.test(line.trim())) {
          isCodeStart = true;
          detectedCodeType = 'html';
        }
        // CSS
        else if (/^(\s*[\w\-#.:\[\]]+\s*{|\s*@media|\s*@import|\s*\/\*)/i.test(line.trim())) {
          isCodeStart = true;
          detectedCodeType = 'css';
        }
        // JavaScript/TypeScript functions, variables, imports
        else if (/^(function|const|let|var|class|interface|import|export|if|for|while|switch|try|catch)\b/i.test(line.trim())) {
          isCodeStart = true;
          detectedCodeType = 'javascript';
        }
        // SQL
        else if (/^(CREATE|SELECT|INSERT|UPDATE|DELETE|ALTER|DROP|WITH|FROM|WHERE)\b/i.test(line.trim())) {
          isCodeStart = true;
          detectedCodeType = 'sql';
        }
        // Python
        else if (/^(def|class|import|from|if __name__|print\(|return\b)/i.test(line.trim())) {
          isCodeStart = true;
          detectedCodeType = 'python';
        }
        // Shell/Terminal commands
        else if (/^(\$|#|\w+@\w+:|\w+>\s*|npm\s+|cd\s+|git\s+|ls\s+|mkdir\s+)/i.test(line.trim())) {
          isCodeStart = true;
          detectedCodeType = 'shell';
        }
        // JSON
        else if (/^(\s*{|\s*\[|\s*"[\w\-]+"\s*:)/i.test(line.trim())) {
          isCodeStart = true;
          detectedCodeType = 'json';
        }
        // XML or other tags
        else if (/^<[a-zA-Z][^>]*>/.test(line.trim())) {
          isCodeStart = true;
          detectedCodeType = 'xml';
        }
      }

      if (isCodeStart) {
        inCodeBlock = true;
        codeBlockType = detectedCodeType;
      }

      // Determine if we should end the code block based on type
      let shouldEndCodeBlock = false;
      if (inCodeBlock) {
        const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
        const isNextLineHebrew = nextLine && isHebrewText(nextLine);
        const isCurrentLineHebrew = isHebrewText(line);
        
        switch (codeBlockType) {
          case 'html':
            // End HTML when we see closing html tag OR when we reach clear Hebrew text that's not part of HTML
            shouldEndCodeBlock = /<\/html>/i.test(line) || 
              (/<\/body>/i.test(line) && isNextLineHebrew && !nextLine.includes('<')) ||
              (line.trim().endsWith('>') && isNextLineHebrew && 
               !nextLine.includes('<') && !nextLine.includes('=') && 
               isCurrentLineHebrew && line.length > 20); // Long Hebrew line after HTML suggests end
            break;
            
          case 'css':
            // End CSS when we see unmatched closing brace followed by Hebrew
            const openBraces = (line.match(/\{/g) || []).length;
            const closeBraces = (line.match(/\}/g) || []).length;
            shouldEndCodeBlock = closeBraces > 0 && isNextLineHebrew && 
              !nextLine.includes('{') && !nextLine.includes(':');
            break;
            
          case 'javascript':
          case 'python':
            // End when we reach clear Hebrew text that's not part of strings/comments
            shouldEndCodeBlock = isNextLineHebrew && 
              !nextLine.includes('(') && 
              !nextLine.includes('{') && 
              !nextLine.includes('=') &&
              !/^(function|const|let|var|class|if|for|while|def|return)/i.test(nextLine);
            break;
            
          case 'sql':
            // End SQL when we see semicolon followed by Hebrew
            shouldEndCodeBlock = /;/.test(line) && isNextLineHebrew && 
              !/^(CREATE|SELECT|INSERT|UPDATE|DELETE|WITH|FROM|WHERE)/i.test(nextLine);
            break;
            
          case 'shell':
            // End shell when we reach Hebrew that's not part of command
            shouldEndCodeBlock = isNextLineHebrew && 
              !/^(\$|#|\w+@\w+:|\w+>\s*|npm\s+|cd\s+|git\s+)/i.test(nextLine);
            break;
            
          case 'json':
            // End JSON when we see closing brace/bracket followed by Hebrew
            shouldEndCodeBlock = /^\s*[\}\]]/.test(line) && isNextLineHebrew && 
              !nextLine.includes('"');
            break;
            
          case 'xml':
            // End XML when we see closing tag followed by Hebrew
            shouldEndCodeBlock = /<\/[^>]+>/.test(line) && isNextLineHebrew && 
              !nextLine.includes('<');
            break;
            
          default:
            // Default: end when we reach clear Hebrew text that doesn't look like code
            shouldEndCodeBlock = isNextLineHebrew && !isCodeText(nextLine);
        }
        
        // Additional check: if current line has Hebrew and looks like descriptive text, end the code block
        if (!shouldEndCodeBlock && isCurrentLineHebrew && line.length > 30 && 
            !line.includes('<') && !line.includes('=') && !line.includes('{') && !line.includes('}')) {
          shouldEndCodeBlock = true;
        }
      }

      let segmentType = 'text';
      if (inCodeBlock && !shouldEndCodeBlock) {
        segmentType = 'code';
      } else {
        if (shouldEndCodeBlock) {
          inCodeBlock = false;
          codeBlockType = '';
        }
        
        const lineIsHebrew = isHebrewText(line);
        if (lineIsHebrew) segmentType = 'hebrew';
      }

      // If this is a new segment type, finish the current one and start new
      if (currentSegment.type && currentSegment.type !== segmentType) {
        if (currentSegment.lines.length > 0) {
          segments.push({
            type: currentSegment.type,
            content: currentSegment.lines.join('\n').trim()
          });
        }
        currentSegment = { type: segmentType, content: '', lines: [] };
      } else if (!currentSegment.type) {
        currentSegment.type = segmentType;
      }

      currentSegment.lines.push(line);
    }

    // Don't forget the last segment
    if (currentSegment.lines.length > 0) {
      segments.push({
        type: currentSegment.type,
        content: currentSegment.lines.join('\n').trim()
      });
    }

    return segments;
  };

  const cleanContent = (content: string) => {
    if (!content) return '';
    
    try {
      if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
        const parsed = JSON.parse(content);
        
        if (typeof parsed === 'string') {
          return cleanTextContent(parsed);
        }
        
        if (Array.isArray(parsed)) {
          return parsed
            .map(item => {
              if (typeof item === 'string') return cleanTextContent(item);
              if (item && typeof item === 'object') {
                return extractContentFromObject(item);
              }
              return String(item);
            })
            .filter(item => item && item.trim())
            .join('\n\n');
        }
        
        if (parsed && typeof parsed === 'object') {
          return extractContentFromObject(parsed);
        }
        
        return cleanTextContent(String(parsed));
      }
      
      return cleanTextContent(content);
      
    } catch {
      return cleanTextContent(content);
    }
  };

  const extractContentFromObject = (obj: any): string => {
    const contentFields = ['message', 'response', 'content', 'text', 'data', 'result', 'output'];
    
    for (const field of contentFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        return cleanTextContent(obj[field]);
      }
    }
    
    const values = Object.values(obj)
      .filter(val => typeof val === 'string' && val.trim().length > 10)
      .map(val => cleanTextContent(val as string));
    
    return values.length > 0 ? values.join('\n\n') : cleanTextContent(JSON.stringify(obj, null, 2));
  };

  const cleanTextContent = (text: string): string => {
    return text
      .replace(/^[\[\]"]+|[\[\]"]+$/g, '')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\r/g, '\r')
      .replace(/\\\\/g, '\\')
      .replace(/\\u[\dA-Fa-f]{4}/g, (match) => {
        return String.fromCharCode(parseInt(match.replace('\\u', ''), 16));
      })
      .replace(/^\s*["'`]|["'`]\s*$/g, '')
      .replace(/[#]{3,}/g, '')
      .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '')
      .replace(/[\u201C\u201D\u2018\u2019]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[\u00A0]/g, ' ')
      .replace(/[^\w\s\u0590-\u05FF\u200E\u200F.,;:!?()[\]{}"'-]/g, '')
      .replace(/\s+$/gm, '')
      .replace(/^\s*[\r\n]+|[\r\n]+\s*$/g, '')
      .replace(/[\r\n]{3,}/g, '\n\n')
      .trim();
  };

  const detectContentType = (content: string) => {
    const hasCodeBlocks = content.includes('```');
    const hasSQLKeywords = /\b(CREATE|SELECT|INSERT|UPDATE|DELETE|TABLE|FROM|WHERE|JOIN|ALTER|DROP)\b/i.test(content);
    const hasHTMLTags = /<[^>]+>/g.test(content);
    const hasJavaScript = /\b(function|const|let|var|class|import|export|if|for|while)\b/.test(content);
    const hasProgrammingKeywords = /\b(def|class|import|from|return|if|elif|else|try|except|for|while|with)\b/.test(content);
    
    return {
      hasCodeBlocks,
      hasSQLKeywords,
      hasHTMLTags,
      hasJavaScript,
      hasProgrammingKeywords,
      hasVisualCode: hasHTMLTags || content.includes('className') || content.includes('style=')
    };
  };

  const formatContent = (content: string) => {
    // First handle code blocks wrapped in ```
    if (content.includes('```')) {
      const parts = content.split(/(```[\s\S]*?```)/g);
      
      return parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const codeContent = part.slice(3, -3).trim();
          const lines = codeContent.split('\n');
          const language = lines[0] && !lines[0].includes(' ') && lines[0].length < 20 ? lines[0] : '';
          const code = language ? lines.slice(1).join('\n') : codeContent;
          
          return (
            <CodeBlock 
              key={index}
              content={part}
              language={language || 'code'}
              isDarkMode={isDarkMode}
            />
          );
        } else {
          // Parse this text part into segments
          const segments = parseContent(part);
          
          return (
            <div key={index}>
              {segments.map((segment, segIndex) => {
                if (segment.type === 'code') {
                  return (
                    <div key={segIndex} dir="ltr" className="text-left my-2">
                      <CodeBlock 
                        content={`\`\`\`\n${segment.content}\n\`\`\``}
                        language="code"
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  );
                } else if (segment.type === 'hebrew') {
                  return (
                    <div key={segIndex} dir="rtl" className="text-right leading-relaxed text-base mb-4">
                      {formatPlainText(segment.content)}
                    </div>
                  );
                } else {
                  return (
                    <div key={segIndex} dir="ltr" className="text-left leading-relaxed text-base mb-4">
                      {formatPlainText(segment.content)}
                    </div>
                  );
                }
              })}
            </div>
          );
        }
      });
    } else {
      // No code blocks, parse the entire content
      const segments = parseContent(content);
      
      return segments.map((segment, index) => {
        if (segment.type === 'code') {
          return (
            <div key={index} dir="ltr" className="text-left my-2">
              <CodeBlock 
                content={`\`\`\`\n${segment.content}\n\`\`\``}
                language="code"
                isDarkMode={isDarkMode}
              />
            </div>
          );
        } else if (segment.type === 'hebrew') {
          return (
            <div key={index} dir="rtl" className="text-right leading-relaxed text-base mb-4">
              {formatPlainText(segment.content)}
            </div>
          );
        } else {
          return (
            <div key={index} dir="ltr" className="text-left leading-relaxed text-base mb-4">
              {formatPlainText(segment.content)}
            </div>
          );
        }
      });
    }
  };

  const formatPlainText = (text: string) => {
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Check if line starts with number followed by dot
      const numberedListMatch = line.match(/^(\d+\.)\s*(.*)$/);
      
      if (numberedListMatch) {
        const isHebrewLine = isHebrewText(numberedListMatch[2]);
        return (
          <div key={lineIndex} className={`mb-2 flex ${isHebrewLine ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
            <span className={`font-medium min-w-[2rem] ${isHebrewLine ? 'mr-2' : 'ml-2'}`}>{numberedListMatch[1]}</span>
            <span className="flex-1">{numberedListMatch[2]}</span>
          </div>
        );
      }
      
      // Regular line
      if (!line.trim()) return <br key={lineIndex} />;
      
      return (
        <div key={lineIndex} className="mb-2">
          {line}
        </div>
      );
    });
  };

  const getFormattedTime = () => {
    const date = typeof message.timestamp === 'string' ? new Date(message.timestamp) : message.timestamp;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const processedContent = cleanContent(message.content);
  const contentTypes = detectContentType(processedContent);

  return (
    <div className="w-full mb-6">
      {/* Message Header - Only Icon and Time */}
      <div className="flex items-center mb-2 justify-start">
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className={`p-1.5 rounded-full ${
            message.isUser 
              ? 'bg-green-500' 
              : isDarkMode 
                ? 'bg-blue-500' 
                : 'bg-blue-600'
          }`}>
            {message.isUser ? (
              <User className="w-4 h-4 text-white" />
            ) : (
              <Bot className="w-4 h-4 text-white" />
            )}
          </div>
          <span className={`text-xs ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {getFormattedTime()}
          </span>
        </div>
      </div>

      {/* Message Content */}
      <div className={`text-base leading-relaxed ${
        isDarkMode ? 'text-gray-100' : 'text-gray-800'
      } mb-3`}>
        {formatContent(processedContent)}
      </div>

      {/* Action Buttons for Bot Messages */}
      {!message.isUser && (
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={() => copyToClipboard(processedContent)}
            className={`p-2 rounded-md transition-colors ${
              isDarkMode 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="העתק תשובה"
          >
            <Copy className="w-4 h-4" />
          </button>

          {(contentTypes.hasCodeBlocks || contentTypes.hasSQLKeywords || contentTypes.hasProgrammingKeywords) && (
            <button
              onClick={() => {
                const codeBlocks = processedContent.match(/```[\s\S]*?```/g) || [];
                const allCode = codeBlocks.map(block => {
                  const content = block.slice(3, -3).trim();
                  const lines = content.split('\n');
                  const isLanguageLine = lines[0] && !lines[0].includes(' ') && lines[0].length < 20;
                  return isLanguageLine ? lines.slice(1).join('\n') : content;
                }).join('\n\n');
                copyToClipboard(allCode || processedContent);
              }}
              className={`p-2 rounded-md transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="העתק קוד"
            >
              <Code className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Code Preview Modal */}
      {showPreview && (
        <CodePreview 
          code={processedContent} 
          onClose={() => setShowPreview(false)} 
        />
      )}

    </div>
  );
};

export default MessageBubble;
