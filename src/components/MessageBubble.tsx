
import React, { useState } from 'react';
import { Copy, Code, User, Bot, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import CodePreview from './CodePreview';

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
    // Split content by code blocks first
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // This is a code block
        const codeContent = part.slice(3, -3).trim();
        const lines = codeContent.split('\n');
        const language = lines[0] && !lines[0].includes(' ') && lines[0].length < 20 ? lines[0] : '';
        const code = language ? lines.slice(1).join('\n') : codeContent;
        
        return (
          <div key={index} className="my-4 relative group">
            <div className={`rounded-lg border ${
              isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              {/* Header */}
              <div className={`flex items-center justify-between px-4 py-3 border-b ${
                isDarkMode 
                  ? 'border-gray-700 text-gray-300' 
                  : 'border-gray-200 text-gray-600'
              }`}>
                <span className="text-sm font-medium">
                  {language || 'code'}
                </span>
                <div className="flex items-center space-x-2 space-x-reverse">
                  {(language === 'html' || language === 'javascript' || language === 'js' || language === 'jsx' || language === 'tsx' || code.includes('<') || code.includes('function') || code.includes('const')) && (
                    <button
                      onClick={() => setShowPreview(true)}
                      className={`p-2 rounded text-sm transition-colors ${
                        isDarkMode 
                          ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                          : 'hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                      }`}
                      title="תצוגה מקדימה"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => copyToClipboard(code)}
                    className={`p-2 rounded text-sm transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                        : 'hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                    }`}
                    title="העתק קוד"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Code */}
              <div className="p-4 overflow-x-auto max-w-full">
                <pre className={`text-sm font-mono whitespace-pre-wrap break-words ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  <code className="block">{code}</code>
                </pre>
              </div>
            </div>
          </div>
        );
      } else {
        // This is regular text - check if it needs to be split between explanation and code
        const separatedContent = separateExplanationFromCode(part);
        
        return (
          <div key={index}>
            {/* Explanation text */}
            {separatedContent.explanation && (
              <div className="leading-relaxed text-base mb-4">
                {formatPlainText(separatedContent.explanation)}
              </div>
            )}
            
            {/* Code section */}
            {separatedContent.code && (
              <div className="my-4">
                <div className={`rounded-lg border ${
                  isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  {/* Header */}
                  <div className={`flex items-center justify-between px-4 py-3 border-b ${
                    isDarkMode 
                      ? 'border-gray-700 text-gray-300' 
                      : 'border-gray-200 text-gray-600'
                  }`}>
                    <span className="text-sm font-medium">code</span>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {(separatedContent.code.includes('<') || separatedContent.code.includes('function') || separatedContent.code.includes('const')) && (
                        <button
                          onClick={() => setShowPreview(true)}
                          className={`p-2 rounded text-sm transition-colors ${
                            isDarkMode 
                              ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                              : 'hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                          }`}
                          title="תצוגה מקדימה"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => copyToClipboard(separatedContent.code)}
                        className={`p-2 rounded text-sm transition-colors ${
                          isDarkMode 
                            ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                            : 'hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                        }`}
                        title="העתק קוד"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Code */}
                  <div className="p-4 overflow-x-auto max-w-full">
                    <pre className={`text-sm font-mono whitespace-pre-wrap break-words ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-800'
                    }`}>
                      <code className="block">{separatedContent.code}</code>
                    </pre>
                  </div>
                </div>
              </div>
            )}
            
            {/* After explanation text */}
            {separatedContent.afterExplanation && (
              <div className="leading-relaxed text-base mt-4">
                {formatPlainText(separatedContent.afterExplanation)}
              </div>
            )}
          </div>
        );
      }
    });
  };

  const separateExplanationFromCode = (text: string) => {
    if (!text.trim()) return { explanation: text, code: '', afterExplanation: '' };
    
    const lines = text.split('\n');
    let codeBlocks: Array<{start: number, end: number}> = [];
    
    // זיהוי פשוט של בלוקי קוד
    const codeIndicators = [
      /^npm\s+/i, /^git\s+/i, /^cd\s+/i, /^node\s+/i,
      /^import\s+/i, /^const\s+/i, /^function\s+/i, /^class\s+/i,
      /^<[^>]+>/, /^\s*{/, /^\s*\[/, /^[\$#]\s+/
    ];
    
    let currentStart = -1;
    let consecutiveLines = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const isCodeLine = codeIndicators.some(pattern => pattern.test(line));
      
      if (isCodeLine) {
        if (currentStart === -1) {
          currentStart = i;
          consecutiveLines = 1;
        } else {
          consecutiveLines++;
        }
      } else if (currentStart !== -1) {
        // סיים בלוק קוד אם יש לפחות 3 שורות
        if (consecutiveLines >= 3) {
          codeBlocks.push({ start: currentStart, end: i - 1 });
        }
        currentStart = -1;
        consecutiveLines = 0;
      }
    }
    
    // בלוק קוד בסוף
    if (currentStart !== -1 && consecutiveLines >= 3) {
      codeBlocks.push({ start: currentStart, end: lines.length - 1 });
    }
    
    if (codeBlocks.length === 0) {
      return { explanation: text, code: '', afterExplanation: '' };
    }
    
    // איחד כל הבלוקים לאחד
    const firstBlock = codeBlocks[0];
    const lastBlock = codeBlocks[codeBlocks.length - 1];
    
    const explanation = lines.slice(0, firstBlock.start).join('\n').trim();
    const code = lines.slice(firstBlock.start, lastBlock.end + 1).join('\n').trim();
    const afterExplanation = lastBlock.end < lines.length - 1 
      ? lines.slice(lastBlock.end + 1).join('\n').trim() 
      : '';
    
    return { explanation, code, afterExplanation };
  };

  const detectAndWrapCodeContent = (text: string) => {
    // Count code-like patterns
    const codePatterns = [
      /\$\s+[^\n]+/g, // Commands starting with $
      /npm\s+[^\n]+/g, // npm commands
      /cd\s+[^\n]+/g, // cd commands
      /import\s+[^\n]+/g, // import statements
      /const\s+[^\n]+/g, // const declarations
      /function\s+[^\n]+/g, // function declarations
      /\{[^}]*\}/g, // JSON-like objects
      /\([^)]*\)/g, // Function calls
    ];

    let codeMatches = 0;
    codePatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      codeMatches += matches.length;
    });

    // If there are many code patterns, treat the whole thing as code
    const shouldWrapAsCode = codeMatches > 3;
    
    return {
      shouldWrapAsCode,
      cleanCode: text.trim()
    };
  };

  const formatPlainText = (text: string) => {
    // Handle numbered lists (1. 2. 3. etc.) and inline code
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      
      // Check if line starts with number followed by dot
      const numberedListMatch = line.match(/^(\d+\.)\s*(.*)$/);
      
      if (numberedListMatch) {
        elements.push(
          <div key={lineIndex} className="mb-2 flex">
            <span className="font-medium ml-2 min-w-[2rem]">{numberedListMatch[1]}</span>
            <span className="flex-1">{formatTextWithInlineCode(numberedListMatch[2])}</span>
          </div>
        );
      } else if (!line.trim()) {
        elements.push(<br key={lineIndex} />);
      } else {
        // Check if this line is a short code snippet
        const isShortCode = detectShortCodeLine(line);
        
        if (isShortCode) {
          elements.push(
            <div key={lineIndex} className="my-3">
              <div className={`rounded-lg border ${
                isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className={`flex items-center justify-between px-4 py-3 border-b ${
                  isDarkMode 
                    ? 'border-gray-700 text-gray-300' 
                    : 'border-gray-200 text-gray-600'
                }`}>
                  <span className="text-sm font-medium">code</span>
                  <button
                    onClick={() => copyToClipboard(line.trim())}
                    className={`p-2 rounded text-sm transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                        : 'hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                    }`}
                    title="העתק קוד"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 overflow-x-auto max-w-full">
                  <pre className={`text-sm font-mono whitespace-pre-wrap break-words ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>
                    <code className="block">{line.trim()}</code>
                  </pre>
                </div>
              </div>
            </div>
          );
        } else {
          elements.push(
            <div key={lineIndex} className="mb-2">
              {formatTextWithInlineCode(line)}
            </div>
          );
        }
      }
    }
    
    return elements;
  };

  const detectShortCodeLine = (line: string): boolean => {
    const trimmedLine = line.trim();
    
    // דלג על שורות ריקות או קצרות מדי
    if (!trimmedLine || trimmedLine.length < 3) return false;
    
    // דלג על שורות שמתחילות בטקסט עברי רגיל
    if (/^[א-ת\s]+/.test(trimmedLine) && !trimmedLine.includes('`')) return false;
    
    // זהה שורות קוד קצרות
    const shortCodePatterns = [
      /^[\$#]\s+.+$/,           // פקודות טרמינל
      /^npm\s+.+$/i,           // פקודות npm
      /^npx\s+.+$/i,           // פקודות npx
      /^git\s+.+$/i,           // פקודות git
      /^cd\s+.+$/i,            // פקודות cd
      /^node\s+.+$/i,          // פקודות node
      /^python\s+.+$/i,        // פקודות python
      /^pip\s+.+$/i,           // פקודות pip
      /^yarn\s+.+$/i,          // פקודות yarn
      /^curl\s+.+$/i,          // פקודות curl
      /^mkdir\s+.+$/i,         // פקודות mkdir
      /^touch\s+.+$/i,         // פקודות touch
      /^echo\s+.+$/i,          // פקודות echo
      /^cat\s+.+$/i,           // פקודות cat
      /^ls\s+.+$/i,            // פקודות ls
      /^cp\s+.+$/i,            // פקודות cp
      /^mv\s+.+$/i,            // פקודות mv
      /^rm\s+.+$/i,            // פקודות rm
      /^chmod\s+.+$/i,         // פקודות chmod
      /^sudo\s+.+$/i,          // פקודות sudo
      /^docker\s+.+$/i,        // פקודות docker
      /^kubectl\s+.+$/i,       // פקודות kubectl
      /^ssh\s+.+$/i,           // פקודות ssh
      /^scp\s+.+$/i,           // פקודות scp
      /^import\s+.+$/i,        // הצהרות import
      /^from\s+.+\s+import/i,  // הצהרות from import
      /^const\s+.+$/i,         // הצהרות const
      /^let\s+.+$/i,           // הצהרות let
      /^var\s+.+$/i,           // הצהרות var
      /^function\s+.+$/i,      // הצהרות function
      /^class\s+.+$/i,         // הצהרות class
      /^interface\s+.+$/i,     // הצהרות interface
      /^type\s+.+$/i,          // הצהרות type
      /^export\s+.+$/i,        // הצהרות export
      /^<[^>]+\/?>\s*$/,       // תגיות HTML בודדות
      /^[a-zA-Z_$][a-zA-Z0-9_$]*\([^)]*\)\s*[;{]?$/, // קריאות פונקציות
      /^[a-zA-Z_$][a-zA-Z0-9_$.]*\s*[=:]\s*.+$/,     // השמות משתנים
      /`[^`]+`/,               // קוד בתוך backticks
    ];
    
    return shortCodePatterns.some(pattern => pattern.test(trimmedLine));
  };

  const formatTextWithInlineCode = (text: string) => {
    // זהה קוד בתוך backticks
    const parts = text.split(/(`[^`]+`)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        const codeText = part.slice(1, -1);
        return (
          <code 
            key={index}
            className={`px-2 py-1 mx-1 rounded text-sm font-mono ${
              isDarkMode 
                ? 'bg-gray-800 text-gray-200 border border-gray-600' 
                : 'bg-gray-100 text-gray-800 border border-gray-300'
            }`}
          >
            {codeText}
          </code>
        );
      }
      return part;
    });
  };

  const getFormattedTime = () => {
    const date = typeof message.timestamp === 'string' ? new Date(message.timestamp) : message.timestamp;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const processedContent = cleanContent(message.content);
  const contentTypes = detectContentType(processedContent);

  return (
    <div className="w-full mb-6" dir="rtl">
      {/* Message Header - Only Icon and Time */}
      <div className="flex items-center mb-2">
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
                  // אם השורה הראשונה היא שפת התכנות, נדלג עליה
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
