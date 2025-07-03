import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, User, Settings, Crown, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import MessageBubble from './MessageBubble';
import AuthModal from './AuthModal';
import PlanUpgrade from './PlanUpgrade';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  category?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  category: string;
  plan: 'free' | 'pro' | 'enterprise';
  messagesUsed: number;
  messageLimit: number;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showPlanUpgrade, setShowPlanUpgrade] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Updated webhook URL
  const WEBHOOK_BASE_URL = 'https://n8n.smartbiz.org.il/webhook';

  useEffect(() => {
    // Check for existing user session
    const savedUser = localStorage.getItem('lovable_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      loadChatHistory();
    } else {
      setShowAuth(true);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = () => {
    const savedMessages = localStorage.getItem('lovable_chat_history');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  };

  const saveChatHistory = (newMessages: Message[]) => {
    localStorage.setItem('lovable_chat_history', JSON.stringify(newMessages));
  };

  const authenticateUser = async (email: string, name: string, category: string, isSignUp: boolean, password?: string) => {
    try {
      const userId = crypto.randomUUID();
      
      if (isSignUp) {
        // רישום משתמש חדש
        const registerResponse = await fetch(`${WEBHOOK_BASE_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'register',
            userId,
            email,
            name,
            category,
            password,
            timestamp: new Date().toISOString()
          })
        });

        if (registerResponse.ok) {
          const userData = await registerResponse.json();
          
          if (userData === false) {
            throw new Error('המשתמש כבר קיים במערכת. אנא התחברו במקום להירשם.');
          }
          
          const newUser: User = {
            id: userData.id || userId,
            email,
            name,
            category,
            plan: userData.plan || 'free',
            messagesUsed: userData.messagesUsed || 0,
            messageLimit: userData.messageLimit || 50
          };
          
          setUser(newUser);
          localStorage.setItem('lovable_user', JSON.stringify(newUser));
          setShowAuth(false);
          
          toast({
            title: "ברוכים הבאים!",
            description: `נרשמתם בהצלחה כמומחה ב${category}.`
          });
        } else {
          throw new Error('שגיאה ברישום. אנא נסו שוב.');
        }
      } else {
        // התחברות משתמש קיים
        const loginResponse = await fetch('https://n8n.smartbiz.org.il/webhook/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'login',
            email,
            password,
            timestamp: new Date().toISOString()
          })
        });

        if (loginResponse.ok) {
          const userData = await loginResponse.json();
          
          if (userData === false) {
            throw new Error('משתמש לא נמצא במערכת. אנא הירשמו תחילה.');
          }
          
          if (userData === 'invalid_password') {
            throw new Error('סיסמה שגויה. אנא נסו שוב.');
          }
          
          if (userData === true || (typeof userData === 'object' && userData.success)) {
            // במקרה שהשרת מחזיר רק true, נצטרך לטעון את פרטי המשתמש בקריאה נוספת
            // או לקבל את הפרטים בתגובה
            const existingUser: User = {
              id: userData.id || userId,
              email,
              name: userData.name || name,
              category: userData.category || 'תכנות',
              plan: userData.plan || 'free',
              messagesUsed: userData.messagesUsed || 0,
              messageLimit: userData.messageLimit || 50
            };
            
            setUser(existingUser);
            localStorage.setItem('lovable_user', JSON.stringify(existingUser));
            setShowAuth(false);
            
            toast({
              title: "ברוכים הבאים!",
              description: `התחברתם בהצלחה כמומחה ב${existingUser.category}.`
            });
          } else {
            throw new Error('שגיאה בהתחברות. אנא בדקו את הפרטים ונסו שוב.');
          }
        } else {
          throw new Error('שגיאה בהתחברות. אנא נסו שוב.');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    
    toast({
      title: "קבצים הועלו",
      description: `הועלו ${files.length} קבצים בהצלחה.`
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if ((!inputValue.trim() && uploadedFiles.length === 0) || !user || isLoading) return;

    // Check message limits
    if (user.messagesUsed >= user.messageLimit) {
      setShowPlanUpgrade(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue || (uploadedFiles.length > 0 ? `הועלו ${uploadedFiles.length} קבצים` : ''),
      isUser: true,
      timestamp: new Date(),
      category: user.category
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    saveChatHistory(newMessages);
    
    // Prepare form data for file upload with all user details
    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('userEmail', user.email);
    formData.append('userName', user.name);
    formData.append('userCategory', user.category);
    formData.append('userPlan', user.plan);
    formData.append('userMessagesUsed', user.messagesUsed.toString());
    formData.append('userMessageLimit', user.messageLimit.toString());
    formData.append('message', inputValue);
    formData.append('category', user.category);
    formData.append('chatHistory', JSON.stringify(messages.slice(-10)));
    formData.append('timestamp', new Date().toISOString());
    
    // Add files to form data
    uploadedFiles.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });

    setInputValue('');
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      const response = await fetch(`${WEBHOOK_BASE_URL}/chatbot`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        
        let cleanContent = data.message || data.response || data.content || '';
        
        try {
          const parsed = JSON.parse(cleanContent);
          cleanContent = parsed.message || parsed.text || parsed.content || cleanContent;
        } catch {
          // Not JSON, use as is
        }

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: cleanContent,
          isUser: false,
          timestamp: new Date(),
          category: user.category
        };

        const updatedMessages = [...newMessages, botMessage];
        setMessages(updatedMessages);
        saveChatHistory(updatedMessages);

        const updatedUser = { ...user, messagesUsed: user.messagesUsed + 1 };
        setUser(updatedUser);
        localStorage.setItem('lovable_user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast({
        title: "שגיאת הודעה",
        description: "נכשל בשליחת ההודעה. אנא נסו שוב.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    localStorage.removeItem('lovable_chat_history');
    toast({
      title: "שיחה חדשה",
      description: "התחלנו שיחה חדשה."
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (showAuth) {
    return <AuthModal onAuth={authenticateUser} onClose={() => setShowAuth(false)} />;
  }

  if (showPlanUpgrade) {
    return <PlanUpgrade user={user} onClose={() => setShowPlanUpgrade(false)} onUpgrade={(plan) => {
      if (user) {
        const updatedUser = { ...user, plan, messageLimit: plan === 'pro' ? 500 : 2000 };
        setUser(updatedUser);
        localStorage.setItem('lovable_user', JSON.stringify(updatedUser));
      }
      setShowPlanUpgrade(false);
    }} />;
  }

  return (
    <div className="flex h-screen premium-gradient text-white" dir="rtl">
      {/* Sidebar */}
      <div className="w-80 premium-dark-surface border-l border-white/10 flex flex-col backdrop-blur-xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              בוט מסונן
            </h1>
            <button
              onClick={() => setShowPlanUpgrade(true)}
              className="premium-icon-button p-2 rounded-lg"
              title="שדרוג"
            >
              <Crown className="w-5 h-5 text-yellow-400" />
            </button>
          </div>
          
          {user && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 space-x-reverse text-sm text-white/70">
                <User className="w-4 h-4" />
                <span>{user.name}</span>
              </div>
              <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                {user.category}
              </Badge>
              <div className="text-xs text-white/50">
                {user.messagesUsed}/{user.messageLimit} הודעות נשלחו
              </div>
            </div>
          )}
        </div>

        {/* New Conversation Button */}
        <div className="p-4">
          <Button
            onClick={startNewConversation}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 border-0"
          >
            <Plus className="w-4 h-4 ml-2" />
            שיחה חדשה
          </Button>
        </div>

        {/* Chat History Summary */}
        <div className="flex-1 p-4">
          <h3 className="text-sm font-semibold text-white/70 mb-3">שיחות אחרונות</h3>
          <div className="space-y-2">
            {messages.length > 0 ? (
              <Card className="p-3 cursor-pointer hover:bg-white/5 transition-colors bg-white/10 border-white/10">
                <div className="text-sm text-white/70 truncate">
                  {messages[0]?.content.substring(0, 50)}...
                </div>
                <div className="text-xs text-white/50 mt-1">
                  {messages.length} הודעות
                </div>
              </Card>
            ) : (
              <div className="text-sm text-white/40 text-center py-8">
                עדיין אין שיחות
              </div>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="p-4 border-t border-white/10">
          <div className="text-sm text-white/50 text-center">
            הקטגוריה שלכם: <span className="font-semibold text-green-400">{user?.category}</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                ברוכים הבאים לבוט המסונן שלנו – לצרכי עבודה בלבד
              </h2>
              <p className="text-white/70 max-w-md mx-auto">
                המומחה שלכם ב{user?.category} מוכן לעזור. 
                שאלו אותי כל שאלה הקשורה ל{user?.category.toLowerCase()}!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-end">
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10 max-w-xs">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 bg-black/20 backdrop-blur-xl p-6">
          {/* File Upload Area */}
          {uploadedFiles.length > 0 && (
            <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                    <span className="text-sm text-white/70">{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex space-x-4 space-x-reverse">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="premium-icon-button p-3 rounded-lg"
              disabled={isLoading}
              title="העלאת קבצים"
            >
              <Upload className="w-5 h-5" />
            </button>
            
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`שאלו את המומחה שלכם ב${user?.category} כל שאלה או העלו קבצים...`}
                className="pl-12 py-3 text-base bg-white/10 border-white/20 focus:border-green-400 focus:ring-green-400 text-right text-white placeholder-white/50 backdrop-blur-sm"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={(!inputValue.trim() && uploadedFiles.length === 0) || isLoading}
              className="premium-icon-button p-3 rounded-lg disabled:opacity-50"
              title="שליחת נתונים"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {user && user.messagesUsed >= user.messageLimit * 0.8 && (
            <div className="mt-3 p-3 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
              <p className="text-sm text-yellow-300">
                נגמרות לכם ההודעות ({user.messagesUsed}/{user.messageLimit} נשלחו). 
                <Button
                  variant="link"
                  className="p-0 mr-1 text-yellow-300 underline"
                  onClick={() => setShowPlanUpgrade(true)}
                >
                  שדרגו להודעות ללא הגבלה
                </Button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
