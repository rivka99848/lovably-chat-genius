import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, User, Settings, Crown, Upload, Moon, Sun, LogOut, CreditCard, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  createChatSession, 
  getChatSessions, 
  updateChatSessionLastMessage, 
  deleteChatSession,
  type ChatSession 
} from '@/lib/supabase';
import {
  getCurrentUser,
  signUpUser,
  signInUser,
  signOutUser,
  incrementMessageUsage
} from '@/lib/auth-supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  registrationDate?: string;
}

const SimplifiedChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showPlanUpgrade, setShowPlanUpgrade] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [savedConversations, setSavedConversations] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Updated webhook URL for chatbot
  const CHATBOT_WEBHOOK_URL = 'https://n8n.chatnaki.co.il/webhook/chatbot';

  // Create new session ID
  const createNewSessionId = () => {
    const sessionId = crypto.randomUUID();
    setCurrentSessionId(sessionId);
    console.log('Generated new session ID:', sessionId);
    return sessionId;
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      setAuthLoading(true);
      
      // Check for existing session
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        loadChatHistory();
        loadSavedConversations(currentUser.id);
        createNewSessionId();
        setShowAuth(false);
      } else {
        setShowAuth(true);
      }
      
      setAuthLoading(false);
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          localStorage.setItem('lovable_user', JSON.stringify(currentUser));
          loadSavedConversations(currentUser.id);
          createNewSessionId();
          setShowAuth(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setMessages([]);
        setSavedConversations([]);
        localStorage.removeItem('lovable_user');
        localStorage.removeItem('lovable_chat_history');
        setShowAuth(true);
      }
    });

    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

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

  const loadSavedConversations = async (userId: string) => {
    try {
      const sessions = await getChatSessions(userId);
      setSavedConversations(sessions);
    } catch (error) {
      console.error('Error loading saved conversations:', error);
    }
  };

  const authenticateUser = async (email: string, name: string, category: string, isSignUp: boolean, password?: string) => {
    try {
      if (isSignUp) {
        const { user: newUser, error } = await signUpUser(email, password!, name, category);
        
        if (error) {
          throw new Error(error);
        }
        
        if (newUser) {
          setUser(newUser);
          localStorage.setItem('lovable_user', JSON.stringify(newUser));
          setShowAuth(false);
          
          toast({
            title: "ברוכים הבאים!",
            description: `נרשמתם בהצלחה כמומחה ב${category}.`
          });
        }
      } else {
        const { user: existingUser, error } = await signInUser(email, password!);
        
        if (error) {
          throw new Error(error);
        }
        
        if (existingUser) {
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
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await signOutUser();
      if (error) {
        toast({
          title: "שגיאה",
          description: error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "התנתקתם בהצלחה",
          description: "להתראות!"
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !user || isLoading) return;

    // Check token limits  
    if (user.messagesUsed >= user.messageLimit) {
      toast({
        title: "נגמרו הטוקנים",
        description: "נגמרו לכם הטוקנים לחודש זה. שדרגו את התוכנית או המתינו לחידוש החודשי.",
        variant: "destructive"
      });
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
    
    console.log('Preparing to send message with session ID:', currentSessionId);
    
    setInputValue('');
    setIsLoading(true);

    try {
      // Simple mock AI response for now
      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `קיבלתי את השאלה שלך: "${userMessage.content}". זהו מענה דמה. בקרוב אשלב עם המערכת המלאה.`,
          isUser: false,
          timestamp: new Date(),
          category: user.category
        };

        const finalMessages = [...newMessages, aiMessage];
        setMessages(finalMessages);
        saveChatHistory(finalMessages);
        
        // Update session last message time
        if (currentSessionId) {
          updateChatSessionLastMessage(currentSessionId);
        }
        
        // Increment message usage
        incrementMessageUsage(user.id).then(() => {
          // Update user state with new message count
          const updatedUser = { ...user, messagesUsed: user.messagesUsed + 1 };
          setUser(updatedUser);
          localStorage.setItem('lovable_user', JSON.stringify(updatedUser));
        });

        setIsLoading(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'מצטער, אירעה שגיאה בשליחת ההודעה. אנא נסה שוב.',
        isUser: false,
        timestamp: new Date(),
        category: user.category
      };
      
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);

      toast({
        title: "שגיאה בשליחה",
        description: "לא ניתן לשלוח את ההודעה כרגע",
        variant: "destructive"
      });
      
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    saveChatHistory([]);
    createNewSessionId();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  // Show auth modal if not authenticated
  if (showAuth) {
    return (
      <div className={`h-screen ${isDarkMode ? 'dark' : ''}`}>
        <div className="h-full bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
          <AuthModal 
            onAuth={authenticateUser}
            onClose={() => {}}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex ${isDarkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden premium-dark-surface border-r border-sidebar-border`}>
        <div className="p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-sidebar-foreground">היסטוריית צ'אטים</h2>
            <Button
              onClick={handleNewChat}
              variant="ghost"
              size="sm"
              className="premium-icon-button"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Chat History */}
          <div className="flex-1 space-y-2 overflow-y-auto">
            {savedConversations.map((conversation) => (
              <Card 
                key={conversation.id}
                className="p-3 cursor-pointer hover:bg-sidebar-accent/50 transition-colors premium-dark-surface border-sidebar-border"
              >
                <div className="text-sm font-medium text-sidebar-foreground truncate">
                  {conversation.title}
                </div>
                <div className="text-xs text-sidebar-foreground/70 mt-1">
                  {new Date(conversation.last_message_at).toLocaleDateString('he-IL')}
                </div>
              </Card>
            ))}
          </div>

          {/* User Info */}
          {user && (
            <div className="pt-4 border-t border-sidebar-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-sidebar-foreground truncate">
                      {user.name}
                    </div>
                    <div className="text-xs text-sidebar-foreground/70">
                      {user.messagesUsed}/{user.messageLimit} טוקנים
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="premium-icon-button">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="w-4 h-4 mr-2" />
                      פרופיל
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowPlanUpgrade(true)}>
                      <Crown className="w-4 h-4 mr-2" />
                      שדרג חבילה
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsDarkMode(!isDarkMode)}>
                      {isDarkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                      {isDarkMode ? 'מצב בהיר' : 'מצב כהה'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      התנתק
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-background via-card to-background">
        {/* Header */}
        <div className="premium-dark-surface border-b border-sidebar-border p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              variant="ghost"
              size="sm"
              className="premium-icon-button"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">
              בוט מומחים מסונן
            </h1>
          </div>
          
          {user && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {user.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {user.plan}
              </Badge>
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  ברוכים הבאים לבוט המומחים המסונן
                </h2>
                <p className="text-muted-foreground">
                  שלחו לנו הודעה וקבלו מענה מומחה ב{user?.category}
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isDarkMode={isDarkMode}
              />
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-md premium-dark-surface rounded-2xl p-4">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">המומחה כותב...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="premium-dark-surface border-t border-sidebar-border p-4">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="שלחו הודעה למומחה..."
              className="flex-1 text-right premium-dark-surface border-sidebar-border focus:border-primary"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPlanUpgrade && user && (
        <PlanUpgrade 
          isOpen={showPlanUpgrade}
          onClose={() => setShowPlanUpgrade(false)}
          user={user}
          onUpdateUser={(updatedUser: User) => {
            setUser(updatedUser);
            localStorage.setItem('lovable_user', JSON.stringify(updatedUser));
          }}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

export default SimplifiedChatInterface;