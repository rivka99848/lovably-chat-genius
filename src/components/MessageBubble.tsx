
import React, { useState } from 'react';
import { Copy, Eye, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

  const copyEntireMessage = () => {
    copyToClipboard(processedContent);
  };

  // Advanced content cleaning function
  const cleanContent = (content: string) => {
    if (!content) return '';
    
    try {
      // Try to parse JSON if it looks like JSON
      if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
        const parsed = JSON.parse(content);
        
        // Extract meaningful content from common JSON structures
        if (typeof parsed === 'string') {
          return cleanTextContent(parsed);
        }
        
        if (Array.isArray(parsed)) {
          // Handle array responses - join meaningful content
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
      
      // If not JSON, clean as regular text
      return cleanTextContent(content);
      
    } catch {
      // If JSON parsing fails, clean as regular text
      return cleanTextContent(content);
    }
  };

  // Extract content from object structures
  const extractContentFromObject = (obj: any): string => {
    // Common content fields to look for
    const contentFields = ['message', 'response', 'content', 'text', 'data', 'result', 'output'];
    
    for (const field of contentFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        return cleanTextContent(obj[field]);
      }
    }
    
    // If no standard fields found, try to extract meaningful text
    const values = Object.values(obj)
      .filter(val => typeof val === 'string' && val.trim().length > 10)
      .map(val => cleanTextContent(val as string));
    
    return values.length > 0 ? values.join('\n\n') : cleanTextContent(JSON.stringify(obj, null, 2));
  };

  // Clean text content from escape characters and formatting
  const cleanTextContent = (text: string): string => {
    return text
      .replace(/^[\[\]"]+|[\[\]"]+$/g, '') // Remove leading/trailing brackets and quotes
      .replace(/\\n/g, '\n') // Convert \n to actual newlines
      .replace(/\\t/g, '\t') // Convert \t to actual tabs
      .replace(/\\"/g, '"') // Convert \" to "
      .replace(/\\r/g, '\r') // Convert \r to actual carriage returns
      .replace(/\\\\/g, '\\') // Convert \\ to \
      .replace(/\\u[\dA-Fa-f]{4}/g, (match) => {
        // Convert Unicode escape sequences
        return String.fromCharCode(parseInt(match.replace('\\u', ''), 16));
      })
      .replace(/^\s*["'`]|["'`]\s*$/g, '') // Remove outer quotes
      .replace(/\s+$/gm, '') // Remove trailing whitespace from lines
      .replace(/^\s*[\r\n]+|[\r\n]+\s*$/g, '') // Remove leading/trailing empty lines
      .trim();
  };

  // Enhanced content detection
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

  const processedContent = cleanContent(message.content);
  const contentTypes = detectContentType(processedContent);
  
  const formatContent = (content: string) => {
    // Split content by code blocks first
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      // Handle code blocks
      if (part.startsWith('```') && part.endsWith('```')) {
        const codeContent = part.slice(3, -3).trim();
        const lines = codeContent.split('\n');
        const language = lines[0] && !lines[0].includes(' ') && lines[0].length < 20 ? lines[0] : '';
        const code = language ? lines.slice(1).join('\n') : codeContent;
        
        return (
          <div key={index} className="my-4 relative group">
            <div className={`rounded-lg overflow-hidden border ${
              isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              {language && (
                <div className={`px-4 py-2 text-xs font-medium border-b flex items-center justify-between ${
                  isDarkMode 
                    ? 'bg-gray-800 text-gray-300 border-gray-700' 
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}>
                  <span>{language.toUpperCase()}</span>
                  <button
                    onClick={() => copyToClipboard(code)}
                    className={`p-1 rounded hover:bg-gray-600/20 transition-colors ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="העתק קוד"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="p-4 overflow-x-auto relative">
                <pre className={`text-sm leading-relaxed ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                } whitespace-pre-wrap font-mono`}>
                  <code>{code}</code>
                </pre>
                {!language && (
                  <button
                    onClick={() => copyToClipboard(code)}
                    className={`absolute top-2 left-2 p-1 rounded hover:bg-gray-600/20 transition-colors opacity-0 group-hover:opacity-100 ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="העתק"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      }
      
      // Handle regular text
      return (
        <div key={index} className="leading-relaxed text-base">
          {formatTextWithInlineCode(part)}
        </div>
      );
    });
  };

  const formatTextWithInlineCode = (text: string) => {
    // Handle inline code and technical terms
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

  // Handle both Date objects and string dates from localStorage
  const getFormattedTime = () => {
    const date = typeof message.timestamp === 'string' ? new Date(message.timestamp) : message.timestamp;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${message.isUser ? 'justify-start' : 'justify-end'}`} dir="rtl">
      <div className={`max-w-4xl ${message.isUser ? 'w-auto' : 'w-full'}`}>
        <Card className={`p-6 ${
          message.isUser 
            ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white mr-12' 
            : isDarkMode
              ? 'bg-gray-800 border-gray-700 text-white ml-12'
              : 'bg-white border-gray-200 text-gray-800 ml-12'
        }`}>
          <div className="space-y-3">
            {/* Message Content */}
            <div className={`text-sm ${
              message.isUser 
                ? 'text-white' 
                : isDarkMode 
                  ? 'text-gray-100' 
                  : 'text-gray-800'
            }`}>
              {formatContent(processedContent)}
            </div>

            {/* Action Buttons */}
            {!message.isUser && (
              <div className={`flex items-center space-x-3 space-x-reverse pt-3 border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <button
                  onClick={copyEntireMessage}
                  className={`p-2 rounded-md transition-colors ${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
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
                      const allCode = codeBlocks.map(block => 
                        block.slice(3, -3).trim().split('\n').slice(1).join('\n')
                      ).join('\n\n');
                      copyToClipboard(allCode || processedContent);
                    }}
                    className={`p-2 rounded-md transition-colors ${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
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
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                    title="תצוגה מקדימה"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}

                <div className="flex-1"></div>
                
                <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {getFormattedTime()}
                </span>
              </div>
            )}

            {/* User message timestamp */}
            {message.isUser && (
              <div className="text-left">
                <span className="text-xs text-green-100 opacity-75">
                  {getFormattedTime()}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Code Preview Modal */}
        {showPreview && contentTypes.hasVisualCode && (
          <CodePreview
            code={processedContent}
            onClose={() => setShowPreview(false)}
          />
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
