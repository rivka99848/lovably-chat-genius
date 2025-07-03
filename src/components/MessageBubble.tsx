
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

  // Detect if content has instructions followed by actual content
  const detectContentSections = (text: string) => {
    const cleaned = cleanContent(text);
    const lines = cleaned.split('\n');
    
    // Look for patterns that indicate instructions vs content
    const codeKeywords = ['CREATE', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DATABASE', 'TABLE', 'USE', 'PRIMARY KEY', 'FOREIGN KEY'];
    const instructionKeywords = ['צריך', 'רוצה', 'בקשה', 'יש', 'לך', 'אתה', 'כדי', 'בשביל'];
    
    let instructionLines: string[] = [];
    let contentLines: string[] = [];
    let foundCode = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Check if this line contains code keywords
      const hasCodeKeywords = codeKeywords.some(keyword => 
        line.toUpperCase().includes(keyword)
      );
      
      // Check if this line contains instruction keywords
      const hasInstructionKeywords = instructionKeywords.some(keyword => 
        line.includes(keyword)
      );
      
      if (hasCodeKeywords || foundCode) {
        foundCode = true;
        contentLines.push(line);
      } else if (hasInstructionKeywords && !foundCode) {
        instructionLines.push(line);
      } else if (!foundCode) {
        instructionLines.push(line);
      } else {
        contentLines.push(line);
      }
    }
    
    return {
      hasInstructions: instructionLines.length > 0,
      instructions: instructionLines.join('\n'),
      content: contentLines.join('\n'),
      isCode: contentLines.some(line => 
        codeKeywords.some(keyword => line.toUpperCase().includes(keyword))
      )
    };
  };

  const sections = detectContentSections(content);
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

  const formatContent = (text: string, isCodeSection: boolean = false) => {
    return text.split('\n').map((line, index) => (
      <div key={index} className={cn(
        "leading-relaxed",
        isCodeSection && "font-mono text-sm"
      )}>
        {line || <br />}
      </div>
    ));
  };

  if (!isUser && (sections.hasInstructions || sections.isCode)) {
    return (
      <div className={cn(
        "max-w-3xl mb-4 space-y-3",
        isUser ? "ml-auto" : "mr-auto"
      )}>
        {/* Instructions section */}
        {sections.hasInstructions && (
          <div className={cn(
            "p-4 rounded-lg shadow-sm border-r-4",
            "bg-blue-50 border-blue-400 text-gray-800"
          )}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 text-right" dir="rtl">
                {formatContent(sections.instructions)}
              </div>
              <div className="text-xs text-blue-600 font-medium">
                הנחיות
              </div>
            </div>
          </div>
        )}
        
        {/* Content section */}
        {sections.content && (
          <div className={cn(
            "p-4 rounded-lg shadow-sm border-r-4 relative group",
            sections.isCode 
              ? "bg-gray-900 border-green-400 text-green-400" 
              : "bg-gray-50 border-gray-400 text-gray-800"
          )}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1" dir={sections.isCode ? "ltr" : "rtl"}>
                {formatContent(sections.content, sections.isCode)}
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="text-xs font-medium">
                  {sections.isCode ? "קוד" : "תוכן"}
                </div>
                <button
                  onClick={() => copyToClipboard(sections.content)}
                  className={cn(
                    "p-2 rounded-lg transition-all duration-200 opacity-70 hover:opacity-100",
                    sections.isCode 
                      ? "bg-green-800 hover:bg-green-700 text-green-200" 
                      : "bg-gray-200 hover:bg-gray-300 text-gray-600"
                  )}
                  title="העתק"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {copied && (
          <div className="text-xs text-green-600 text-center animate-fade-in-out">
            הועתק!
          </div>
        )}
        
        {timestamp && (
          <div className="text-xs text-gray-500 text-center">
            {timestamp}
          </div>
        )}
      </div>
    );
  }

  // Regular message bubble for user messages or simple AI responses
  return (
    <div className={cn(
      "max-w-3xl mb-4",
      isUser ? "ml-auto" : "mr-auto"
    )}>
      <div className={cn(
        "p-4 rounded-lg shadow-sm relative group",
        isUser 
          ? "bg-blue-600 text-white border-r-4 border-blue-800" 
          : "bg-white text-gray-800 border border-gray-200"
      )}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 text-right" dir="rtl">
            {formatContent(displayContent)}
          </div>
          
          {!isUser && (
            <button
              onClick={() => copyToClipboard(displayContent)}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors opacity-70 hover:opacity-100"
              title="העתק"
            >
              <Copy size={16} className="text-gray-600" />
            </button>
          )}
        </div>
      </div>
      
      {copied && (
        <div className="text-xs text-green-600 text-center mt-1 animate-fade-in-out">
          הועתק!
        </div>
      )}
      
      {timestamp && (
        <div className="text-xs text-gray-500 text-center mt-1">
          {timestamp}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
