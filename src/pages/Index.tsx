import React, { useState, useEffect, useRef } from 'react';
import { Send, RotateCcw, User, Crown, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import AuthModal from '@/components/AuthModal';
import ChatInterface from '@/components/ChatInterface';
import CategorySelector from '@/components/CategorySelector';
import CodePreview from '@/components/CodePreview';
import PlanUpgrade from '@/components/PlanUpgrade';
import ProfileDropdown from '@/components/ProfileDropdown';

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

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [codePreview, setCodePreview] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user from localStorage
    const savedUser = localStorage.getItem('lovable_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }

    // Load chat history
    const savedChatHistory = localStorage.getItem('lovable_chat_history');
    if (savedChatHistory) {
      setMessages(JSON.parse(savedChatHistory));
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    if (!user) {
      toast({
        title: "אופס!",
        description: "עליך להיות מחובר כדי לשלוח הודעות.",
        variant: "destructive",
      });
      setShowAuthModal(true);
      return;
    }

    if (user.messagesUsed >= user.messageLimit && user.plan === 'free') {
       setShowUpgradeModal(true);
       return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      isUser: true,
      timestamp: new Date(),
      category: selectedCategory
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setNewMessage('');
    setCodePreview(null);

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: newMessage, category: selectedCategory, userId: user.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await response.json();

      if (data && data.response) {
        const aiMessage: Message = {
          id: Date.now().toString() + '-ai',
          content: data.response,
          isUser: false,
          timestamp: new Date(),
        };

        setMessages(prevMessages => [...prevMessages, aiMessage]);
        localStorage.setItem('lovable_chat_history', JSON.stringify([...messages, userMessage, aiMessage]));

        // Update user's message count
        const updatedUser = { ...user, messagesUsed: user.messagesUsed + 1 };
        setUser(updatedUser);
        localStorage.setItem('lovable_user', JSON.stringify(updatedUser));

        // Extract code for preview
        if (aiMessage.content.includes("```")) {
          const code = aiMessage.content.substring(aiMessage.content.indexOf("```") + 3, aiMessage.content.lastIndexOf("```"));
          setCodePreview(code);
        }
      }
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "נכשל בשליחת ההודעה.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('lovable_user', JSON.stringify(updatedUser));
  };

  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleResetChat = () => {
    setMessages([]);
    localStorage.removeItem('lovable_chat_history');
    toast({
      title: "היסטוריית הצ'אט אופסה",
      description: "הצ'אט התחיל מחדש.",
    });
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  const closeUpgradeModal = () => {
    setShowUpgradeModal(false);
  };

  const handleUpgrade = (plan: 'pro' | 'enterprise') => {
    const updatedUser = { ...user!, plan: plan, messageLimit: plan === 'pro' ? 500 : 999999, messagesUsed: 0 };
    setUser(updatedUser);
    localStorage.setItem('lovable_user', JSON.stringify(updatedUser));
    closeUpgradeModal();
    toast({
      title: "הצלחה!",
      description: `שודרגת לחבילת ${plan === 'pro' ? 'מקצועי' : 'ארגוני'}`,
    });
  };

  const showUpgrade = () => {
    setShowUpgradeModal(true);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gradient-to-br from-slate-50 to-green-50 text-gray-900'
    }`} dir="rtl">
      {/* Header */}
      <header className={`border-b transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800/50 border-gray-700 backdrop-blur-sm' 
          : 'bg-white/80 border-gray-200 backdrop-blur-sm'
      } sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  מערכת AI חכמה
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4 space-x-reverse">
              {user && (
                <div className="hidden sm:flex items-center space-x-3 space-x-reverse">
                  <Badge className={`${
                    user.plan === 'pro' ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' :
                    user.plan === 'enterprise' ? 'bg-purple-600/20 text-purple-400 border-purple-600/30' :
                    'bg-green-600/20 text-green-400 border-green-600/30'
                  }`}>
                    <Crown className="w-3 h-3 ml-1" />
                    {user.plan === 'pro' ? 'מקצועי' : user.plan === 'enterprise' ? 'ארגוני' : 'חינם'}
                  </Badge>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {user.messagesUsed}/{user.messageLimit} הודעות
                  </span>
                </div>
              )}

              {user ? (
                <ProfileDropdown user={user} onUpgrade={showUpgrade} />
              ) : (
                <Button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                >
                  <User className="w-4 h-4 ml-2" />
                  התחברות
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className={`w-full md:w-64 p-4 border-r transition-transform duration-300 md:sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} z-30`}>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">קטגוריות</h2>
            <CategorySelector selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />
          </div>
          <div>
            <Button variant="outline" className="w-full justify-start space-x-2 space-x-reverse" onClick={handleResetChat}>
              <RotateCcw className="w-4 h-4" />
              <span>אפס צ'אט</span>
            </Button>
          </div>
        </aside>

        {/* Chat Interface */}
        <div className="flex-1 p-4">
          <ChatInterface
            messages={messages}
            chatContainerRef={chatContainerRef}
            isDarkMode={isDarkMode}
          />

          {codePreview && (
            <Card className="mt-4">
              <div className="px-4 py-2 font-bold">תצוגה מקדימה של קוד</div>
              <CodePreview code={codePreview} />
            </Card>
          )}

          <div className="mt-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Input
                placeholder="כתוב הודעה..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    sendMessage();
                  }
                }}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={isLoading}>
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                ) : (
                  <Send className="w-4 h-4 ml-2" />
                )}
                שלח
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onClose={closeAuthModal} onUpdateUser={handleUpdateUser} />

      {/* Upgrade Plan Modal */}
      <PlanUpgrade user={user} onClose={closeUpgradeModal} onUpgrade={handleUpgrade} />
    </div>
  );
};

export default Index;
