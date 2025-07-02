
import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, User, Settings, Crown } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Webhook URL for n8n integration
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

  const authenticateUser = async (email: string, name: string, category: string, isSignUp: boolean) => {
    try {
      const userId = crypto.randomUUID();
      
      if (isSignUp) {
        // בדיקה אם המשתמש כבר קיים
        const checkResponse = await fetch(`${WEBHOOK_BASE_URL}/check-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            timestamp: new Date().toISOString()
          })
        });

        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          if (checkData.exists) {
            throw new Error('משתמש כבר קיים במערכת. אנא התחברו במקום להירשם.');
          }
        }

        // רישום משתמש חדש עם קטגוריה
        const registerResponse = await fetch(`${WEBHOOK_BASE_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'register',
            userId,
            email,
            name,
            category,
            timestamp: new Date().toISOString()
          })
        });

        if (registerResponse.ok) {
          const userData = await registerResponse.json();
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
        }
      } else {
        // התחברות משתמש קיים
        const loginResponse = await fetch(`${WEBHOOK_BASE_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'login',
            email,
            timestamp: new Date().toISOString()
          })
        });

        if (loginResponse.ok) {
          const userData = await loginResponse.json();
          if (!userData.exists) {
            throw new Error('משתמש לא נמצא במערכת. אנא הירשמו תחילה.');
          }

          const existingUser: User = {
            id: userData.id || userId,
            email,
            name: userData.name || name,
            category: userData.category, // הקטגוריה מגיעה מהשרת
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
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      throw error; // מעביר את השגיאה חזרה לקומפוננטה
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !user || isLoading) return;

    // Check message limits
    if (user.messagesUsed >= user.messageLimit) {
      setShowPlanUpgrade(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
      category: user.category
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    saveChatHistory(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${WEBHOOK_BASE_URL}/chat/${user.category.toLowerCase()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          message: inputValue,
          category: user.category,
          chatHistory: messages.slice(-10),
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Clean the response - strip raw JSON and extract readable content
        let cleanContent = data.message || data.response || data.content || '';
        
        // If it's a JSON string, try to parse and extract meaningful content
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

        // Update message count
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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-green-50" dir="rtl">
      {/* Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              בוט מסונן
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPlanUpgrade(true)}
              className="border-green-200 hover:bg-green-50"
            >
              <Crown className="w-4 h-4 ml-1 text-green-600" />
              {user?.plan === 'free' ? 'שדרג' : user?.plan.toUpperCase()}
            </Button>
          </div>
          
          {user && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user.name}</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {user.category}
              </Badge>
              <div className="text-xs text-gray-500">
                {user.messagesUsed}/{user.messageLimit} הודעות נשלחו
              </div>
            </div>
          )}
        </div>

        {/* New Conversation Button */}
        <div className="p-4">
          <Button
            onClick={startNewConversation}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            <Plus className="w-4 h-4 ml-2" />
            שיחה חדשה
          </Button>
        </div>

        {/* Chat History Summary */}
        <div className="flex-1 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">שיחות אחרונות</h3>
          <div className="space-y-2">
            {messages.length > 0 ? (
              <Card className="p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="text-sm text-gray-600 truncate">
                  {messages[0]?.content.substring(0, 50)}...
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {messages.length} הודעות
                </div>
              </Card>
            ) : (
              <div className="text-sm text-gray-400 text-center py-8">
                עדיין אין שיחות
              </div>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="p-4 border-t border-gray-100">
          <div className="text-sm text-gray-500 text-center">
            הקטגוריה שלכם: <span className="font-semibold text-green-600">{user?.category}</span>
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
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                ברוכים הבאים לבוט המסונן שלנו – לצרכי עבודה בלבד
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
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
              <div className="bg-white rounded-lg p-4 shadow-sm border max-w-xs">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-6">
          <div className="flex space-x-4 space-x-reverse">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`שאלו את המומחה שלכם ב${user?.category} כל שאלה...`}
                className="pl-12 py-3 text-base border-gray-300 focus:border-green-500 focus:ring-green-500 text-right"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          
          {user && user.messagesUsed >= user.messageLimit * 0.8 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                נגמרות לכם ההודעות ({user.messagesUsed}/{user.messageLimit} נשלחו). 
                <Button
                  variant="link"
                  className="p-0 mr-1 text-yellow-800 underline"
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
