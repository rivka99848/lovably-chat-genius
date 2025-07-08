
import React, { useState } from 'react';
import { Copy, Eye, Code, User, Bot } from 'lucide-react';
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
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const codeContent = part.slice(3, -3).trim();
        const lines = codeContent.split('\n');
        const language = lines[0] && !lines[0].includes(' ') && lines[0].length < 20 ? lines[0] : '';
        const code = language ? lines.slice(1).join('\n') : codeContent;
        
        return (
          <div key={index} className="my-4 relative group">
            {/* Code block with clear boundaries */}
            <div className={`rounded-xl border-2 shadow-lg ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-700/50 shadow-slate-900/20' 
                : 'bg-white border-slate-200 shadow-slate-200/30'
            }`}>
              {/* Header */}
              <div className={`px-4 py-3 border-b rounded-t-xl ${
                isDarkMode 
                  ? 'bg-slate-800/80 text-slate-300 border-slate-700/50' 
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className={`p-1.5 rounded-md ${
                      isDarkMode ? 'bg-blue-500/20' : 'bg-blue-500/10'
                    }`}>
                      <Code className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <span className="font-medium text-sm">
                      {language ? `${language.toUpperCase()} Code` : 'Code'}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 space-x-reverse ${
                      isDarkMode 
                        ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30' 
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200'
                    }`}
                    title="העתק קוד בלבד"
                  >
                    <Copy className="w-3 h-3" />
                    <span>העתק קוד</span>
                  </button>
                </div>
              </div>
              
              {/* Code content with clear visual separation */}
              <div className={`relative ${
                isDarkMode ? 'bg-slate-900' : 'bg-slate-50/30'
              }`}>
                <div className="p-6 overflow-x-auto">
                  <pre className={`text-sm leading-6 ${
                    isDarkMode ? 'text-slate-100' : 'text-slate-800'
                  } whitespace-pre-wrap font-mono`}>
                    <code>{code}</code>
                  </pre>
                </div>
                
                {/* Visual indicators for code boundaries */}
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  isDarkMode ? 'bg-blue-500/30' : 'bg-blue-500/20'
                }`}></div>
                <div className={`absolute bottom-0 right-0 w-8 h-1 ${
                  isDarkMode ? 'bg-slate-700' : 'bg-slate-300'
                } rounded-tl-full opacity-60`}></div>
              </div>
            </div>
          </div>
        );
      }
      
      return (
        <div key={index} className="leading-relaxed text-base">
          {formatTextWithInlineCode(part)}
        </div>
      );
    });
  };

  const formatTextWithInlineCode = (text: string) => {
    const technicalTerms = /\b(SQL|HTML|CSS|JavaScript|React|Python|CREATE TABLE|SELECT|INSERT|UPDATE|DELETE|VARCHAR|INT|PRIMARY KEY|FOREIGN KEY|NOT NULL|UNIQUE|INDEX|DATABASE|SCHEMA|API|JSON|XML|HTTP|HTTPS|URL|ID|UUID)\b/g;
    
    return text.split('\n').map((line, lineIndex) => {
      if (!line.trim()) return <br key={lineIndex} />;
      
      return (
        <div key={lineIndex} className="mb-2">
          {line.split(technicalTerms).map((segment, segmentIndex) => {
            if (technicalTerms.test(segment)) {
              return (
                <span
                  key={segmentIndex}
                  className={`inline-block px-2 py-0.5 rounded text-sm font-mono mx-0.5 ${
                    isDarkMode 
                      ? 'bg-blue-900/30 text-blue-300 border border-blue-700/50' 
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}
                >
                  {segment}
                </span>
              );
            }
            return segment;
          })}
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

          {contentTypes.hasVisualCode && (
            <button
              onClick={() => setShowPreview(true)}
              className={`p-2 rounded-md transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="תצוגה מקדימה"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Code Preview Modal */}
      {showPreview && contentTypes.hasVisualCode && (
        <CodePreview
          code={processedContent}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default MessageBubble;
