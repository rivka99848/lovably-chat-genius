
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
    copyToClipboard(message.content);
  };

  // Enhanced content detection
  const detectContentType = (content: string) => {
    const hasCodeBlocks = content.includes('```');
    const hasSQLKeywords = /\b(CREATE|SELECT|INSERT|UPDATE|DELETE|TABLE|FROM|WHERE|JOIN)\b/i.test(content);
    const hasHTMLTags = /<[^>]+>/g.test(content);
    const hasJavaScript = /\b(function|const|let|var|class|import|export)\b/.test(content);
    
    return {
      hasCodeBlocks,
      hasSQLKeywords,
      hasHTMLTags,
      hasJavaScript,
      hasVisualCode: hasHTMLTags || content.includes('className') || content.includes('style=')
    };
  };

  const contentTypes = detectContentType(message.content);
  
  const formatContent = (content: string) => {
    // Split content by code blocks first
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      // Handle code blocks
      if (part.startsWith('```') && part.endsWith('```')) {
        const codeContent = part.slice(3, -3).trim();
        const lines = codeContent.split('\n');
        const language = lines[0] && !lines[0].includes(' ') ? lines[0] : 'text';
        const code = language !== 'text' ? lines.slice(1).join('\n') : codeContent;
        
        return (
          <div key={index} className="my-4 relative group">
            <div className={`rounded-lg overflow-hidden border ${
              isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              {language !== 'text' && (
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
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="p-4 overflow-x-auto">
                <pre className={`text-sm leading-relaxed ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                } whitespace-pre-wrap`}>
                  <code>{code}</code>
                </pre>
              </div>
            </div>
          </div>
        );
      }
      
      // Handle regular text with potential inline code or technical terms
      return (
        <div key={index} className="leading-relaxed">
          {formatTextWithInlineCode(part)}
        </div>
      );
    });
  };

  const formatTextWithInlineCode = (text: string) => {
    // Handle inline code and technical terms
    const technicalTerms = /\b(SQL|HTML|CSS|JavaScript|React|CREATE TABLE|SELECT|INSERT|UPDATE|DELETE|VARCHAR|INT|PRIMARY KEY|FOREIGN KEY|NOT NULL|UNIQUE|INDEX|DATABASE|SCHEMA)\b/g;
    
    return text.split('\n').map((line, lineIndex) => (
      <div key={lineIndex} className="mb-2">
        {line.split(technicalTerms).map((segment, segmentIndex) => {
          if (technicalTerms.test(segment)) {
            return (
              <span
                key={segmentIndex}
                className={`inline-block px-1.5 py-0.5 rounded text-xs font-mono ${
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
    ));
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
              {formatContent(message.content)}
            </div>

            {/* Action Buttons */}
            {!message.isUser && (
              <div className={`flex items-center space-x-3 space-x-reverse pt-3 border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <button
                  onClick={copyEntireMessage}
                  className={`flex items-center space-x-1 space-x-reverse px-3 py-1.5 rounded-md text-xs transition-colors ${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  title="העתק תשובה"
                >
                  <Copy className="w-3 h-3" />
                  <span>העתק הכל</span>
                </button>

                {(contentTypes.hasCodeBlocks || contentTypes.hasSQLKeywords) && (
                  <button
                    onClick={() => {
                      const codeBlocks = message.content.match(/```[\s\S]*?```/g) || [];
                      const allCode = codeBlocks.map(block => 
                        block.slice(3, -3).trim().split('\n').slice(1).join('\n')
                      ).join('\n\n');
                      copyToClipboard(allCode || message.content);
                    }}
                    className={`flex items-center space-x-1 space-x-reverse px-3 py-1.5 rounded-md text-xs transition-colors ${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                    title="העתק קוד"
                  >
                    <Code className="w-3 h-3" />
                    <span>העתק קוד</span>
                  </button>
                )}

                {contentTypes.hasVisualCode && (
                  <button
                    onClick={() => setShowPreview(true)}
                    className={`flex items-center space-x-1 space-x-reverse px-3 py-1.5 rounded-md text-xs transition-colors ${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                    title="תצוגה מקדימה"
                  >
                    <Eye className="w-3 h-3" />
                    <span>תצוגה מקדימה</span>
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
            code={message.content}
            onClose={() => setShowPreview(false)}
          />
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
