
import React, { useState } from 'react';
import { Copy, Code, User, Bot, Eye, Download } from 'lucide-react';
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

  const downloadImage = async (url: string, filename: string = 'image.png') => {
    try {
      // Use a different approach for cross-origin images
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Create a temporary click event
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "הורדה החלה!",
        description: "התמונה מורדת למחשב שלך.",
      });
    } catch (error) {
      console.error('Download error:', error);
      // Fallback - copy URL to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "קישור הועתק",
          description: "קישור התמונה הועתק ללוח - הדבק בדפדפן כדי להוריד.",
        });
      } catch (clipboardError) {
        toast({
          title: "שגיאה בהורדה",
          description: "לא ניתן להוריד את התמונה.",
          variant: "destructive",
        });
      }
    }
  };

  const detectImageLink = (content: string) => {
    try {
      if (content.trim().startsWith('{')) {
        const parsed = JSON.parse(content);
        if (parsed.קישור && typeof parsed.קישור === 'string') {
          const url = parsed.קישור.trim();
          if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) || url.includes('files.smartbiz.org.il')) {
            return url;
          }
        }
      }
    } catch (error) {
      // Not JSON, continue
    }
    
    // Check for direct image URLs in text
    const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|bmp|svg))/gi;
    const match = content.match(urlRegex);
    return match ? match[0] : null;
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
    let cleaned = text;
    
    // Remove code instruction prompts in Hebrew and English
    const instructionPatterns = [
      /הצג את הקוד הבא בתוך בלוק קוד בלבד[^`]*?(?=```|$)/g,
      /הצג את הקוד ה[בנ]א[^`]*?(?=```|$)/g,
      /בלי שום טקסט מקדים[^`]*?(?=```|$)/g,
      /הסברים מחוץ לבלוק[^`]*?(?=```|$)/g,
      /אל תוסיף הסברים[^`]*?(?=```|$)/g,
      /השפה: \w+[^`]*?(?=```|$)/g,
      /עם הדגשת תחביר[^`]*?(?=```|$)/g,
      /syntax highlighting[^`]*?(?=```|$)/gi,
      /Display the following code[^`]*?(?=```|$)/gi,
      /Show the code[^`]*?(?=```|$)/gi,
      /Language: \w+[^`]*?(?=```|$)/gi,
      /תיאורים.*(?=```|$)/g,
      /הפורמט צריך להיות ברור[^`]*?(?=```|$)/g,
      /בפורמט הבא[^`]*?(?=```|$)/g,
      /^.*?הנחיה.*?$/gm,
      /^.*?instruction.*?$/gmi,
    ];
    
    // Apply instruction removal patterns
    instructionPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    // Remove Hebrew explanations after code blocks
    // Look for code blocks and remove Hebrew text that follows
    cleaned = cleaned.replace(/(```[\s\S]*?```)\s*[\u0590-\u05FF][\s\S]*$/gm, '$1');
    
    // Remove explanations that start after code ends (when brackets close and Hebrew text follows)
    cleaned = cleaned.replace(/(\}\s*[\n\r]*)\s*[\u0590-\u05FF].*$/gm, '$1');
    
    return cleaned
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
      // הסרת ההערה הבאה כדי לא לנקות תוי HTML
      // .replace(/[^\w\s\u0590-\u05FF\u200E\u200F.,;:!?()[\]{}"'<>/-]/g, '')
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
              <div className="leading-tight text-base mb-2">
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
            
            {/* Text after code */}
            {separatedContent.afterCode && (
              <div className="leading-tight text-base mt-2">
                {formatPlainText(separatedContent.afterCode)}
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
    let codeEndIndex = -1;
    
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
    
    // מצא את סוף הקוד - חפש שורה שמכילה טקסט הסבר בעברית אחרי סוגריים סוגרים
    let braceBalance = 0;
    let hasFoundClosingBrace = false;
    
    for (let i = codeStartIndex; i < lines.length; i++) {
      const line = lines[i];
      
      // ספור סוגריים
      for (const char of line) {
        if (char === '{') braceBalance++;
        if (char === '}') braceBalance--;
      }
      
      // אם האיזון הסתיים והיה לפחות סוגריים סגורים
      if (braceBalance === 0 && line.includes('}')) {
        hasFoundClosingBrace = true;
        
        // בדוק אם יש הסבר בעברית אחרי השורה הזו
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j].trim();
          
          // דלג על שורות ריקות
          if (!nextLine) continue;
          
          // אם נמצא טקסט בעברית, זה הסוף של הקוד
          if (/[\u0590-\u05FF]/.test(nextLine)) {
            codeEndIndex = i;
            break;
          }
          
          // אם נמצא עוד קוד, המשך
          const isMoreCode = codeIndicators.some(pattern => pattern.test(nextLine));
          if (isMoreCode) {
            break; // צא מהלולאה הפנימית ותמשיך לחפש
          }
        }
        
        if (codeEndIndex !== -1) break;
      }
    }
    
    // אם לא נמצא סוף מוגדר, הקוד הוא עד הסוף
    if (codeEndIndex === -1) {
      codeEndIndex = lines.length - 1;
    }
    
    const explanation = lines.slice(0, codeStartIndex).join('\n').trim();
    const code = lines.slice(codeStartIndex, codeEndIndex + 1).join('\n').trim();
    const afterCode = codeEndIndex < lines.length - 1 ? lines.slice(codeEndIndex + 1).join('\n').trim() : '';
    
    return { 
      explanation, 
      code,
      afterCode 
    };
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
          <div key={lineIndex} className="mb-1 flex">
            <span className="font-medium ml-2 min-w-[2rem]">{numberedListMatch[1]}</span>
            <span className="flex-1">{numberedListMatch[2]}</span>
          </div>
        );
      }
      
      // Regular line
      if (!line.trim()) return <br key={lineIndex} />;
      
      return (
        <div key={lineIndex} className="mb-1">
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
  const imageUrl = detectImageLink(message.content);

  return (
    <div className="w-full max-w-3xl mx-auto mb-6" dir="rtl">
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

      {/* Image Display */}
      {imageUrl && (
        <div className="mb-4">
          <div className={`rounded-lg border overflow-hidden ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <img 
              src={imageUrl} 
              alt="תמונה שנוצרה"
              className="w-full h-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className={`p-3 border-t flex items-center justify-between ${
              isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
            }`}>
              <span className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                תמונה שנוצרה
              </span>
              <button
                onClick={() => downloadImage(imageUrl)}
                className={`p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/25'
                }`}
                title="הורד תמונה"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Content - Only show if no image */}
      {!imageUrl && (
        <div className={`text-base leading-snug ${
          isDarkMode ? 'text-gray-100' : 'text-gray-800'
        } mb-3`}>
          {formatContent(processedContent)}
        </div>
      )}

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
