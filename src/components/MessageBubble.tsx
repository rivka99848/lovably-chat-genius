
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

  const hasCode = message.content.includes('```') || message.content.includes('<') || message.content.includes('function') || message.content.includes('const ') || message.content.includes('let ');
  const hasVisualCode = message.content.includes('<html') || message.content.includes('<div') || message.content.includes('className') || message.content.includes('style=') || message.content.includes('<component');
  const codeBlocks = message.content.match(/```[\s\S]*?```/g) || [];
  
  const formatContent = (content: string) => {
    if (!hasCode) return content;

    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const codeContent = part.slice(3, -3).trim();
        const lines = codeContent.split('\n');
        const language = lines[0].includes(' ') ? '' : lines[0];
        const code = language ? lines.slice(1).join('\n') : codeContent;
        
        return (
          <div key={index} className="my-4 relative group">
            <div className={`rounded-lg overflow-hidden ${
              isDarkMode ? 'bg-gray-900' : 'bg-gray-800'
            }`}>
              {language && (
                <div className={`px-4 py-2 text-sm border-b ${
                  isDarkMode 
                    ? 'bg-gray-800 text-gray-300 border-gray-700' 
                    : 'bg-gray-700 text-gray-200 border-gray-600'
                }`}>
                  {language}
                </div>
              )}
              <div className="p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100">
                  <code>{code}</code>
                </pre>
              </div>
              <button
                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-gray-700/50"
                onClick={() => copyToClipboard(code)}
              >
                <Copy className="w-4 h-4 text-gray-300" />
              </button>
            </div>
          </div>
        );
      }
      
      return (
        <div key={index} className="whitespace-pre-wrap">
          {part}
        </div>
      );
    });
  };

  const formatTimestamp = (timestamp: Date | string) => {
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${message.isUser ? 'justify-start' : 'justify-end'}`} dir="rtl">
      <div className={`max-w-4xl ${message.isUser ? 'w-auto' : 'w-full'}`}>
        <Card className={`p-4 ${
          message.isUser 
            ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white mr-12' 
            : isDarkMode
              ? 'bg-gray-800 border-gray-700 text-white ml-12'
              : 'bg-white border-gray-200 text-gray-800 ml-12'
        }`}>
          <div className="space-y-2">
            {/* Message Content */}
            <div className={`text-sm leading-relaxed ${
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
              <div className={`flex items-center space-x-2 space-x-reverse pt-2 border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-100'
              }`}>
                <button
                  onClick={copyEntireMessage}
                  className="p-2 rounded-full hover:bg-gray-200/20 transition-colors"
                  title="העתק תשובה"
                >
                  <Copy className="w-4 h-4" />
                </button>

                {hasCode && (
                  <button
                    onClick={() => {
                      const allCode = codeBlocks.map(block => 
                        block.slice(3, -3).trim().split('\n').slice(1).join('\n')
                      ).join('\n\n');
                      copyToClipboard(allCode);
                    }}
                    className="p-2 rounded-full hover:bg-gray-200/20 transition-colors"
                    title="העתק קוד"
                  >
                    <Code className="w-4 h-4" />
                  </button>
                )}

                {hasVisualCode && (
                  <button
                    onClick={() => setShowPreview(true)}
                    className="p-2 rounded-full hover:bg-gray-200/20 transition-colors"
                    title="תצוגה מקדימה"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}

                <div className="flex-1"></div>
                
                <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
            )}

            {/* User message timestamp */}
            {message.isUser && (
              <div className="text-left">
                <span className="text-xs text-green-100 opacity-75">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Code Preview Modal */}
        {showPreview && hasVisualCode && (
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
