
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
    const result: any[] = [];
    let currentSection = { type: 'explanation', content: '', startIndex: 0 };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // בדוק אם השורה הנוכחית היא קוד
      const isCodeLine = isLineCode(trimmedLine);
      
      if (isCodeLine && currentSection.type === 'explanation') {
        // עבר מהסבר לקוד
        if (currentSection.content.trim()) {
          result.push({ ...currentSection, endIndex: i - 1 });
        }
        currentSection = { type: 'code', content: line, startIndex: i };
      } else if (isCodeLine && currentSection.type === 'code') {
        // המשך קוד
        currentSection.content += '\n' + line;
      } else if (!isCodeLine && currentSection.type === 'code') {
        // עבר מקוד להסבר
        result.push({ ...currentSection, endIndex: i - 1 });
        currentSection = { type: 'explanation', content: line, startIndex: i };
      } else {
        // המשך אותו סוג
        if (currentSection.content) {
          currentSection.content += '\n' + line;
        } else {
          currentSection.content = line;
        }
      }
    }
    
    // הוסף את החלק האחרון
    if (currentSection.content.trim()) {
      result.push({ ...currentSection, endIndex: lines.length - 1 });
    }
    
    // אם יש רק הסבר, החזר כמו קודם
    if (result.length === 1 && result[0].type === 'explanation') {
      return { explanation: text, code: '', afterExplanation: '' };
    }
    
    // אם יש רק קוד, החזר כמו קודם
    if (result.length === 1 && result[0].type === 'code') {
      return { explanation: '', code: text, afterExplanation: '' };
    }
    
    // אם יש מיקס, החזר את החלק הראשון כהסבר
    const firstExplanation = result.find(r => r.type === 'explanation')?.content.trim() || '';
    const codeSection = result.find(r => r.type === 'code')?.content.trim() || '';
    
    // מצא את ההסבר האחרון
    let lastExplanationIndex = -1;
    for (let i = result.length - 1; i >= 0; i--) {
      if (result[i].type === 'explanation') {
        lastExplanationIndex = i;
        break;
      }
    }
    
    const afterExplanation = lastExplanationIndex > 0 ? result[lastExplanationIndex].content.trim() : '';
    
    return { explanation: firstExplanation, code: codeSection, afterExplanation };
  };

  const isLineCode = (line: string): boolean => {
    if (!line || line.length < 2) return false;
    
    // דלג על שורות שמתחילות בטקסט עברי רגיל (אלא אם יש בהן backticks)
    if (/^[א-ת\s]+/.test(line) && !line.includes('`')) return false;
    
    // זהה סוגי קוד שונים
    const codePatterns = [
      // פקודות טרמינל וכלים
      /^[\$#]\s+.+$/,
      /^(npm|npx|yarn|pnpm)\s+.+$/i,
      /^(git|cd|mkdir|touch|echo|cat|ls|cp|mv|rm|chmod|sudo)\s+.+$/i,
      /^(curl|wget|ssh|scp|rsync|tar|zip|unzip)\s+.+$/i,
      /^(docker|kubectl|helm)\s+.+$/i,
      /^(python|pip|node|java|javac|gcc|make)\s+.+$/i,
      /^(apt|yum|brew|dnf|pacman)\s+.+$/i,
      
      // הצהרות תכנות
      /^(import|from)\s+.+$/i,
      /^(const|let|var|function|class|interface|type|enum)\s+.+$/i,
      /^(export|default|async|await)\s+.+$/i,
      /^(if|else|for|while|switch|case|try|catch|finally)\s*[\(\{].*$/i,
      /^(return|throw|break|continue)\s+.+$/i,
      
      // HTML/XML תגים
      /^<[^>]+\/?>\s*$/,
      /^<\/[^>]+>\s*$/,
      
      // JSON ואובייקטים
      /^\s*[\{\[].*[\}\]]\s*,?\s*$/,
      /^\s*["\'][^"\']*["\']:\s*.+,?\s*$/,
      /^\s*[a-zA-Z_$][a-zA-Z0-9_$]*:\s*.+,?\s*$/,
      
      // קריאות פונקציות והשמות
      /^[a-zA-Z_$][a-zA-Z0-9_$.]*\([^)]*\)\s*[;{]?\s*$/,
      /^[a-zA-Z_$][a-zA-Z0-9_$.]*\s*[=:]\s*.+[;]?\s*$/,
      
      // CSS סלקטורים ותכונות
      /^[.#]?[a-zA-Z_-][a-zA-Z0-9_-]*\s*\{\s*$/,
      /^\s*[a-zA-Z-]+:\s*.+;\s*$/,
      /^\s*\}\s*$/,
      
      // SQL פקודות
      /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|ORDER|GROUP|HAVING)\s+.+$/i,
      
      // קוד בתוך backticks
      /`[^`]+`/,
      
      // מספרים וסמלים מיוחדים בתחילת השורה
      /^[\d\.\-\+\*\/\=\!\@\#\$\%\^\&\*\(\)\[\]\{\}\|\\\:\;\,\<\>\?]+.*$/,
      
      // שורות עם סוגריים או מילים שמורות ללא עברית
      /^.*[\(\)\[\]\{\}].*$/,
      /^[^א-ת]*$/,  // שורות ללא עברית בכלל (חוץ מרווחים)
      
      // קבצים ונתיבים
      /^[\.\/~][a-zA-Z0-9_\-\.\/]+$/,
      /^[a-zA-Z]:[\\\/][a-zA-Z0-9_\-\\\/\.]+$/,
      
      // URL ו-URI
      /^https?:\/\/.+$/i,
      /^ftp:\/\/.+$/i,
      /^mailto:.+$/i,
      
      // קונפיגורציות וסטרינגים מובנים
      /^[A-Z_][A-Z0-9_]*\s*=.+$/,
      /^.*\.(js|ts|jsx|tsx|html|css|json|xml|yml|yaml|ini|conf|config)$/i,
    ];
    
    return codePatterns.some(pattern => pattern.test(line));
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
    
    // השתמש באותה פונקציה שמזהה קוד
    return isLineCode(trimmedLine);
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
