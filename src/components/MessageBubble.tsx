
import React, { useState } from 'react';
import { Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  content: string;
  isUser?: boolean;
  timestamp?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  content, 
  isUser = false, 
  timestamp 
}) => {
  const [copied, setCopied] = useState(false);

  // Clean content from unwanted characters and JSON formatting
  const cleanContent = (text: string): string => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(text);
      if (typeof parsed === 'string') {
        text = parsed;
      } else if (parsed.content) {
        text = parsed.content;
      } else if (parsed.message) {
        text = parsed.message;
      }
    } catch {
      // Not JSON, continue with cleaning
    }

    return text
      // Remove markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      // Remove hashtags and special characters at start of lines
      .replace(/^#+\s*/gm, '')
      .replace(/^[#*-]\s*/gm, '')
      // Clean up extra whitespace
      .replace(/\n\s*\n/g, '\n')
      .trim();
  };

  const displayContent = cleanContent(content);

  const copyToClipboard = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => (
      <div key={index} className="leading-relaxed">
        {line || <br />}
      </div>
    ));
  };

  return (
    <div className="max-w-4xl mx-auto mb-6 border-b border-gray-200 pb-4">
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
          isUser ? "bg-blue-500 text-white" : "bg-gray-500 text-white"
        )}>
          {isUser ? "אתה" : "AI"}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-right" dir="rtl">
            {formatContent(displayContent)}
          </div>
          
          {timestamp && (
            <div className="text-xs text-gray-500 mt-2 text-right">
              {timestamp}
            </div>
          )}
        </div>
        
        {!isUser && (
          <button
            onClick={() => copyToClipboard(displayContent)}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="העתק"
          >
            <Copy size={16} />
          </button>
        )}
      </div>
      
      {copied && (
        <div className="text-xs text-green-600 text-center mt-2 animate-pulse">
          הועתק!
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
