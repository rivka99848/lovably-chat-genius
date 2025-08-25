
import React, { useState } from 'react';
import { Copy, Code, User, Bot, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import CodePreview from './CodePreview';
import CodeBlock from './CodeBlock';

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

  // Function to detect text direction based on content
  const detectTextDirection = (text: string): 'rtl' | 'ltr' => {
    if (!text) return 'rtl';
    
    // If it's code (contains common programming patterns), always LTR
    const codePatterns = [
      /function\s*\(/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /var\s+\w+\s*=/,
      /import\s+/,
      /export\s+/,
      /class\s+\w+/,
      /interface\s+\w+/,
      /\{\s*\w+:/,
      /<\w+/,
      /\$\s*\w+/,
      /npm\s+/,
      /cd\s+/,
      /git\s+/,
      /console\./,
      /document\./,
      /window\./,
      /\w+\(\)/,
      /=>\s*{/,
      /\[.*\]/,
      /\{.*\}/,
      /DOCTYPE/,
      /html/,
      /head/,
      /body/,
      /meta/,
      /script/,
      /style/
    ];
    
    const hasCodePatterns = codePatterns.some(pattern => pattern.test(text));
    if (hasCodePatterns) return 'ltr';
    
    // Count Hebrew characters
    const hebrewChars = text.match(/[\u0590-\u05FF]/g) || [];
    const totalChars = text.replace(/\s/g, '').length;
    
    // If more than 20% Hebrew characters, use RTL
    if (totalChars > 0 && (hebrewChars.length / totalChars) > 0.2) {
      return 'rtl';
    }
    
    return 'ltr';
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
        // This is a code block - use CodeBlock component
        const codeContent = part.slice(3, -3).trim();
        const lines = codeContent.split('\n');
        const language = lines[0] && !lines[0].includes(' ') && lines[0].length < 20 ? lines[0] : '';
        const code = language ? lines.slice(1).join('\n') : codeContent;
        
        return (
          <CodeBlock 
            key={index}
            content={part}
            language={language || 'code'}
            isDarkMode={isDarkMode}
          />
        );
      } else {
        // This is regular text - check if it needs to be split between explanation and code
        const separatedContent = separateExplanationFromCode(part);
        
        return (
          <div key={index}>
            {/* Explanation text */}
            {separatedContent.explanation && (
              <div className={`leading-relaxed text-base mb-4 ${
                detectTextDirection(separatedContent.explanation) === 'rtl' ? 'text-right' : 'text-left'
              }`} dir={detectTextDirection(separatedContent.explanation)}>
                {formatPlainText(separatedContent.explanation)}
              </div>
            )}
            
            {/* Code section */}
            {separatedContent.code && (
              <div dir="ltr" className="text-left">
                <CodeBlock 
                  content={separatedContent.code}
                  language="code"
                  isDarkMode={isDarkMode}
                />
              </div>
            )}
          </div>
        );
      }
    });
  };

  const separateExplanationFromCode = (text: string) => {
    if (!text.trim()) return { explanation: text, code: '' };
    
    const lines = text.split('\n');
    let codeStartIndex = -1;
    
    // מילות מפתח שמציינות התחלת קוד
    const codeIndicators = [
      /^bash\s*$/i,
      /^[\$#]\s+/,  // פקודות שמתחילות ב-$ או #
      /^npm\s+/i,
      /^npx\s+/i,
      /^cd\s+/i,
      /^git\s+/i,
      /^node\s+/i,
      /^python\s+/i,
      /^pip\s+/i,
      /^yarn\s+/i,
      /^curl\s+/i,
      /^mkdir\s+/i,
      /^touch\s+/i,
      /^echo\s+/i,
      /^cat\s+/i,
      /^ls\s+/i,
      /^cp\s+/i,
      /^mv\s+/i,
      /^rm\s+/i,
      /^chmod\s+/i,
      /^sudo\s+/i,
      /^apt\s+/i,
      /^yum\s+/i,
      /^brew\s+/i,
      /^docker\s+/i,
      /^kubectl\s+/i,
      /^ssh\s+/i,
      /^scp\s+/i,
      /^rsync\s+/i,
      /^tar\s+/i,
      /^zip\s+/i,
      /^unzip\s+/i,
      /^wget\s+/i,
      /^^import\s+/i, // הצהרות import
      /^from\s+.+\s+import/i,
      /^const\s+/i,
      /^let\s+/i,
      /^var\s+/i,
      /^function\s+/i,
      /^class\s+/i,
      /^interface\s+/i,
      /^type\s+/i,
      /^export\s+/i,
      /^<[^>]+>/,  // HTML tags
      /^\s*{/,     // JSON או object
      /^\s*\[/,    // Array
    ];
    
    // חפש את השורה הראשונה שמכילה קוד
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // דלג על שורות ריקות
      if (!line) continue;
      
      // בדוק אם השורה מתחילה עם אחד ממחווני הקוד
      const isCodeLine = codeIndicators.some(pattern => pattern.test(line));
      
      if (isCodeLine) {
        codeStartIndex = i;
        break;
      }
      
      // אם זה נראה כמו רשימה ממוספרת שמכילה קוד
      const numberedListWithCode = line.match(/^\d+\.\s*(.+)$/);
      if (numberedListWithCode) {
        const listContent = numberedListWithCode[1];
        const hasCodeInList = codeIndicators.some(pattern => pattern.test(listContent));
        if (hasCodeInList) {
          codeStartIndex = i;
          break;
        }
      }
    }
    
    if (codeStartIndex === -1) {
      // לא נמצא קוד, החזר הכל כהסבר
      return { explanation: text, code: '' };
    }
    
    const explanation = lines.slice(0, codeStartIndex).join('\n').trim();
    const code = lines.slice(codeStartIndex).join('\n').trim();
    
    return { explanation, code };
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
    const textDir = detectTextDirection(text);
    // Handle numbered lists (1. 2. 3. etc.)
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Check if line starts with number followed by dot
      const numberedListMatch = line.match(/^(\d+\.)\s*(.*)$/);
      
      if (numberedListMatch) {
        return (
          <div key={lineIndex} className={`mb-2 flex ${textDir === 'rtl' ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
            <span className={`font-medium min-w-[2rem] ${textDir === 'rtl' ? 'mr-2' : 'ml-2'}`}>{numberedListMatch[1]}</span>
            <span className="flex-1">{numberedListMatch[2]}</span>
          </div>
        );
      }
      
      // Regular line
      if (!line.trim()) return <br key={lineIndex} />;
      
      return (
        <div key={lineIndex} className={`mb-2 ${textDir === 'rtl' ? 'text-right' : 'text-left'}`}>
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
  const textDirection = detectTextDirection(processedContent);

  return (
    <div className="w-full mb-6">
      {/* Message Header - Only Icon and Time */}
      <div className="flex items-center mb-2 justify-start">
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
