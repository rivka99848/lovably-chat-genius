
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
    // Split content by code blocks
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
                      className={`flex items-center space-x-1 space-x-reverse px-3 py-1 rounded text-sm transition-colors ${
                        isDarkMode 
                          ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                          : 'hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </button>
                  )}
                  <button
                    onClick={() => copyToClipboard(code)}
                    className={`flex items-center space-x-1 space-x-reverse px-3 py-1 rounded text-sm transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                        : 'hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
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
        // This is regular text - check if it contains a lot of code patterns
        const hasLotsOfCode = detectAndWrapCodeContent(part);
        if (hasLotsOfCode.shouldWrapAsCode) {
          return (
            <div key={index} className="my-4">
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
                    {(hasLotsOfCode.cleanCode.includes('<') || hasLotsOfCode.cleanCode.includes('function') || hasLotsOfCode.cleanCode.includes('const')) && (
                      <button
                        onClick={() => setShowPreview(true)}
                        className={`flex items-center space-x-1 space-x-reverse px-3 py-1 rounded text-sm transition-colors ${
                          isDarkMode 
                            ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                            : 'hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        <span>Preview</span>
                      </button>
                    )}
                    <button
                      onClick={() => copyToClipboard(hasLotsOfCode.cleanCode)}
                      className={`flex items-center space-x-1 space-x-reverse px-3 py-1 rounded text-sm transition-colors ${
                        isDarkMode 
                          ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                          : 'hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
                
                {/* Code */}
                <div className="p-4 overflow-x-auto max-w-full">
                  <pre className={`text-sm font-mono whitespace-pre-wrap break-words ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>
                    <code className="block">{hasLotsOfCode.cleanCode}</code>
                  </pre>
                </div>
              </div>
            </div>
          );
        }
        
        return (
          <div key={index} className="leading-relaxed text-base">
            {formatPlainText(part)}
          </div>
        );
      }
    });
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
    // Handle numbered lists (1. 2. 3. etc.)
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Check if line starts with number followed by dot
      const numberedListMatch = line.match(/^(\d+\.)\s*(.*)$/);
      
      if (numberedListMatch) {
        return (
          <div key={lineIndex} className="mb-2 flex">
            <span className="font-medium ml-2 min-w-[2rem]">{numberedListMatch[1]}</span>
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
