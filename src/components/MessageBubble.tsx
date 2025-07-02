
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
  timestamp: Date;
  category?: string;
}

interface Props {
  message: Message;
}

const MessageBubble: React.FC<Props> = ({ message }) => {
  const [showPreview, setShowPreview] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard.",
    });
  };

  const copyEntireMessage = () => {
    copyToClipboard(message.content);
  };

  // Detect if message contains code
  const hasCode = message.content.includes('```') || message.content.includes('<') || message.content.includes('function') || message.content.includes('const ') || message.content.includes('let ');
  
  // Detect if code is visual (HTML/CSS/React)
  const hasVisualCode = message.content.includes('<html') || message.content.includes('<div') || message.content.includes('className') || message.content.includes('style=') || message.content.includes('<component');

  // Extract code blocks
  const codeBlocks = message.content.match(/```[\s\S]*?```/g) || [];
  
  // Format message content with code highlighting
  const formatContent = (content: string) => {
    if (!hasCode) return content;

    // Split content by code blocks and format each part
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const codeContent = part.slice(3, -3).trim();
        const lines = codeContent.split('\n');
        const language = lines[0].includes(' ') ? '' : lines[0];
        const code = language ? lines.slice(1).join('\n') : codeContent;
        
        return (
          <div key={index} className="my-4 relative group">
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              {language && (
                <div className="bg-gray-800 px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
                  {language}
                </div>
              )}
              <div className="p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100">
                  <code>{code}</code>
                </pre>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(code)}
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
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

  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-4xl ${message.isUser ? 'w-auto' : 'w-full'}`}>
        <Card className={`p-4 ${
          message.isUser 
            ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white ml-12' 
            : 'bg-white border-gray-200 mr-12'
        }`}>
          <div className="space-y-2">
            {/* Message Content */}
            <div className={`text-sm leading-relaxed ${message.isUser ? 'text-white' : 'text-gray-800'}`}>
              {formatContent(message.content)}
            </div>

            {/* Action Buttons */}
            {!message.isUser && (
              <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyEntireMessage}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Reply
                </Button>

                {hasCode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const allCode = codeBlocks.map(block => 
                        block.slice(3, -3).trim().split('\n').slice(1).join('\n')
                      ).join('\n\n');
                      copyToClipboard(allCode);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Code className="w-3 h-3 mr-1" />
                    Copy Code
                  </Button>
                )}

                {hasVisualCode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPreview(true)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                )}

                <div className="flex-1"></div>
                
                <span className="text-xs text-gray-400">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}

            {/* User message timestamp */}
            {message.isUser && (
              <div className="text-right">
                <span className="text-xs text-green-100 opacity-75">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
