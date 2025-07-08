import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, User, Settings, Crown, Upload, Moon, Sun, LogOut, CreditCard, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
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
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showPlanUpgrade, setShowPlanUpgrade] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Updated webhook URLs - separate for login and chatbot
  const LOGIN_WEBHOOK_URL = 'https://n8n.smartbiz.org.il/webhook/login';
  const CHATBOT_WEBHOOK_URL = 'https://n8n.smartbiz.org.il/webhook/chatbot';

  // Generate or get session ID
  const getSessionId = () => {
    let sessionId = localStorage.getItem('lovable_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('lovable_session_id', sessionId);
      console.log('Generated new session ID:', sessionId);
    } else {
      console.log('Using existing session ID:', sessionId);
    }
    return sessionId;
  };

  useEffect(() => {
    // Check for existing user session
    const savedUser = localStorage.getItem('lovable_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      loadChatHistory();
    } else {
      setShowAuth(true);
    }
    
    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
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

  const authenticateUser = async (email: string, name: string, category: string, isSignUp: boolean, password?: string) => {
    try {
      const userId = crypto.randomUUID();
      
      if (isSignUp) {
        // רישום משתמש חדש
        const registerResponse = await fetch(LOGIN_WEBHOOK_URL, {
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
          const responseText = await registerResponse.text();
          console.log('Register response:', responseText);
          
          let userData;
          try {
            userData = JSON.parse(responseText);
          } catch {
            userData = responseText;
          }
          
          // אם זה true - המשתמש נרשם בהצלחה
          if (userData === true || (typeof userData === 'object' && userData.success)) {
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
            // אם זה לא true - הצג את ההודעה שהשרת החזיר
            const errorMessage = typeof userData === 'string' ? userData : 'המשתמש כבר קיים במערכת';
            throw new Error(errorMessage);
          }
        } else {
          throw new Error('שגיאה ברישום. אנא נסו שוב.');
        }
      } else {
        // התחברות משתמש קיים
        const loginResponse = await fetch(LOGIN_WEBHOOK_URL, {
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
          const responseText = await loginResponse.text();
          console.log('Login response:', responseText);
          
          let userData;
          try {
            userData = JSON.parse(responseText);
          } catch {
            userData = responseText;
          }
          
          // אם זה true או array עם success: true - המשתמש התחבר בהצלחה
          if (userData === true || 
              (typeof userData === 'object' && userData.success) ||
              (Array.isArray(userData) && userData.length > 0 && userData[0].success)) {
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
            // אם זה לא true - הצג את ההודעה שהשרת החזיר
            const errorMessage = typeof userData === 'string' ? userData : 'שגיאה בהתחברות';
            throw new Error(errorMessage);
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

  const detectFileType = (file: File): string => {
    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();
    
    // Video files
    if (mimeType.startsWith('video/') || fileName.endsWith('.mp4') || fileName.endsWith('.avi') || fileName.endsWith('.mov') || fileName.endsWith('.mkv') || fileName.endsWith('.wmv')) {
      return 'mp4';
    }
    
    // Audio files
    if (mimeType.startsWith('audio/') || fileName.endsWith('.mp3') || fileName.endsWith('.wav') || fileName.endsWith('.aac') || fileName.endsWith('.ogg') || fileName.endsWith('.m4a')) {
      return fileName.endsWith('.wav') ? 'wav' : 'mp3';
    }
    
    return 'file';
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Detect file types and show appropriate messages
    const audioVideoFiles = files.filter(file => {
      const type = detectFileType(file);
      return type === 'mp3' || type === 'wav' || type === 'mp4';
    });
    
    setUploadedFiles(prev => [...prev, ...files]);
    
    if (audioVideoFiles.length > 0) {
      const formats = audioVideoFiles.map(file => detectFileType(file)).join(', ');
      toast({
        title: "קבצי מדיה הועלו",
        description: `הועלו ${audioVideoFiles.length} קבצי אודיו/וידאו בפורמטים: ${formats}`
      });
    } else {
      toast({
        title: "קבצים הועלו",
        description: `הועלו ${files.length} קבצים בהצלחה.`
      });
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const generateChatTitle = (content: string): string => {
    const words = content.split(' ').filter(word => word.length > 2);
    return words.slice(0, 3).join(' ') || 'שיחה חדשה';
  };

  const saveCurrentConversation = () => {
    if (messages.length === 0 || !user) return;
    
    const conversationId = Date.now().toString();
    const title = generateChatTitle(messages[0]?.content || 'שיחה חדשה');
    
    const conversation = {
      id: conversationId,
      title,
      messages,
      date: new Date(),
      category: user.category
    };
    
    const existing = localStorage.getItem(`lovable_conversations_${user.id}`);
    const conversations = existing ? JSON.parse(existing) : [];
    conversations.unshift(conversation);
    
    // Keep only last 10 conversations
    if (conversations.length > 10) {
      conversations.splice(10);
    }
    
    localStorage.setItem(`lovable_conversations_${user.id}`, JSON.stringify(conversations));
    
    toast({
      title: "השיחה נשמרה",
      description: "השיחה נשמרה בחשבון שלכם"
    });
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
    
    const currentSessionId = getSessionId();
    console.log('Preparing to send message with session ID:', currentSessionId);
    
    // Prepare form data for file upload with all user details and session ID
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
    formData.append('sessionId', currentSessionId);
    
    // Add files to form data
    uploadedFiles.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });

    // Log all form data for debugging
    console.log('Form data being sent:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: [File] ${value.name}`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

    setInputValue('');
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      console.log('Sending request to chatbot webhook:', CHATBOT_WEBHOOK_URL, 'with sessionId:', currentSessionId);
      const response = await fetch(CHATBOT_WEBHOOK_URL, {
        method: 'POST',
        body: formData
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Parsed response data:', data);
        } catch (parseError) {
          console.log('Response is not JSON, using as plain text:', responseText);
          data = { message: responseText };
        }
        
        // Handle server response - if it's true, process the message, otherwise just show the message
        let cleanContent = '';
        let shouldProcessMessage = false;
        
        if (data === true) {
          // השרת החזיר true - השליחה הצליחה, מעביר לממשק הבוט
          shouldProcessMessage = true;
          cleanContent = 'ההודעה נשלחה בהצלחה לשרת.';
          navigate('/'); // העברה לממשק הבוט הראשי
        } else if (Array.isArray(data)) {
          console.log('Response is an array:', data);
          if (data.length === 0) {
            cleanContent = 'השרת החזיר תגובה ריקה.';
          } else {
            const firstItem = data[0];
            if (typeof firstItem === 'string') {
              cleanContent = firstItem;
              shouldProcessMessage = true;
            } else if (firstItem && typeof firstItem === 'object') {
              if (firstItem.shouldProcess === true || firstItem.success === true) {
                shouldProcessMessage = true;
                cleanContent = firstItem.message || firstItem.response || firstItem.content || firstItem.text || 'קיבלתי תגובה מהשרת';
              } else {
                // רק הצג את ההודעה בלי לעבד
                cleanContent = firstItem.message || firstItem.response || firstItem.content || firstItem.text || JSON.stringify(firstItem);
              }
            } else {
              cleanContent = JSON.stringify(data);
            }
          }
        } else if (typeof data === 'string') {
          cleanContent = data || 'תגובה ריקה מהשרת';
          shouldProcessMessage = true;
        } else if (data && typeof data === 'object') {
          if (data.shouldProcess === true || data.success === true) {
            shouldProcessMessage = true;
            cleanContent = data.message || data.response || data.content || data.text || 'קיבלתי תגובה מהשרת';
          } else {
            // רק הצג את ההודעה בלי לעבד
            cleanContent = data.message || data.response || data.content || data.text || JSON.stringify(data);
          }
        } else {
          cleanContent = responseText || 'קיבלתי תשובה לא צפויה מהשרת';
        }

        console.log('Final message content:', cleanContent);
        console.log('Should process message:', shouldProcessMessage);

        // Ensure we have some content to display
        if (!cleanContent || cleanContent.trim() === '' || cleanContent === '[]' || cleanContent === 'null') {
          cleanContent = 'השרת לא החזיר תוכן.';
        }

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: cleanContent,
          isUser: false,
          timestamp: new Date(),
          category: user.category
        };

        console.log('Creating bot message:', botMessage);

        const updatedMessages = [...newMessages, botMessage];
        setMessages(updatedMessages);
        saveChatHistory(updatedMessages);

        // Update message count only if we should process the message
        if (shouldProcessMessage) {
          const updatedUser = { ...user, messagesUsed: user.messagesUsed + 1 };
          setUser(updatedUser);
          localStorage.setItem('lovable_user', JSON.stringify(updatedUser));
        }

        toast({
          title: "תשובה התקבלה",
          description: shouldProcessMessage ? "השרת השיב בהצלחה" : "הודעה מהשרת"
        });
      } else {
        console.error('Response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        
        toast({
          title: "שגיאת שרת",
          description: `השרת החזיר שגיאה: ${response.status}`,
          variant: "destructive"
        });
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
    // Save current conversation before starting new one
    if (messages.length > 0) {
      saveCurrentConversation();
    }
    
    setMessages([]);
    // Don't remove chat history - keep all conversations saved
    toast({
      title: "שיחה חדשה",
      description: "התחלנו שיחה חדשה. השיחה הקודמת נשמרה."
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSettingsClick = () => {
    console.log('Settings clicked');
    navigate('/profile');
  };

  const handleUpgradeClick = () => {
    console.log('Upgrade clicked');
    setShowPlanUpgrade(true);
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    
    // Clear user data
    setUser(null);
    localStorage.removeItem('lovable_user');
    localStorage.removeItem('lovable_chat_history');
    localStorage.removeItem('lovable_session_id');
    
    // Clear messages
    setMessages([]);
    
    toast({
      title: "התנתקת בהצלחה",
      description: "מעבירים אותך לדף ההתחברות"
    });
    
    // Show auth modal
    setShowAuth(true);
  };

  const handleProfileClick = () => {
    navigate('/profile');
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
    <div className={`flex h-screen premium-gradient ${isDarkMode ? 'dark text-white' : 'text-gray-900'}`} dir="rtl">
      {/* Sidebar */}
      {isSidebarOpen && (
        <div className={`w-80 border-l backdrop-blur-xl flex flex-col transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gray-900/90 border-gray-700/50' 
            : 'bg-white/95 border-gray-200'
        }`}>
          {/* Header */}
          <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                בוט מסונן
              </h1>
              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'hover:bg-white/10 text-white/80' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="החלף צבע"
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setShowPlanUpgrade(true)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'hover:bg-white/10 text-yellow-400' 
                      : 'hover:bg-gray-100 text-yellow-600'
                  }`}
                  title="שדרוג"
                >
                  <Crown className="w-5 h-5" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`p-2 rounded-lg transition-colors ${
                        isDarkMode 
                          ? 'hover:bg-white/10 text-blue-400' 
                          : 'hover:bg-gray-100 text-blue-600'
                      }`}
                      title="הגדרות"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800 border shadow-lg">
                    <DropdownMenuItem onClick={handleLogout} dir="rtl" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                      <LogOut className="ml-2 h-4 w-4" />
                      התנתקות
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSettingsClick} dir="rtl">
                      <Settings className="ml-2 h-4 w-4" />
                      הגדרות
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleUpgradeClick} dir="rtl">
                      <CreditCard className="ml-2 h-4 w-4" />
                      שדרוג
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {user && (
              <div className="space-y-2">
                <div className={`flex items-center space-x-2 space-x-reverse text-sm ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <User className="w-4 h-4" />
                  <span>{user.name}</span>
                </div>
                <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                  {user.category}
                </Badge>
                <div className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
                  {user.messagesUsed}/{user.messageLimit} הודעות נשלחו
                </div>
              </div>
            )}
          </div>

          {/* New Conversation Button */}
          <div className="p-4">
            <Button
              onClick={startNewConversation}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 border-0 text-white"
            >
              <Plus className="w-4 h-4 ml-2" />
              שיחה חדשה
            </Button>
          </div>

          {/* Chat History Summary */}
          <div className="flex-1 p-4">
            <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>שיחות אחרונות</h3>
            <div className="space-y-2">
              {messages.length > 0 ? (
                <Card className={`p-3 cursor-pointer transition-colors ${
                  isDarkMode 
                    ? 'bg-white/10 border-white/10 hover:bg-white/15' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}>
                  <div className={`text-sm truncate ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>
                    {generateChatTitle(messages[0]?.content || 'שיחה חדשה')}
                  </div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
                    {messages.length} הודעות
                  </div>
                </Card>
              ) : (
                <div className={`text-sm text-center py-8 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                  עדיין אין שיחות
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className={`p-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
            <div className={`text-sm text-center ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
              הקטגוריה שלכם: <span className="font-semibold text-green-400">{user?.category}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Toggle Sidebar Button */}
        <div className={`p-4 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-white/10 text-white/80 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            title={isSidebarOpen ? "הסתר תפריט" : "הצג תפריט"}
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                ברוכים הבאים לבוט המסונן שלנו – לצרכי עבודה בלבד
              </h2>
              <p className={`max-w-md mx-auto ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
                המומחה שלכם ב{user?.category} מוכן לעזור. 
                שאלו אותי כל שאלה הקשורה ל{user?.category.toLowerCase()}!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} isDarkMode={isDarkMode} />
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-end">
              <div className={`rounded-lg p-4 backdrop-blur-sm border max-w-xs ${
                isDarkMode 
                  ? 'bg-white/10 border-white/10' 
                  : 'bg-gray-100 border-gray-200'
              }`}>
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
        <div className={`border-t backdrop-blur-xl p-6 ${
          isDarkMode 
            ? 'border-white/10 bg-black/20' 
            : 'border-gray-200 bg-white/50'
        }`}>
          {uploadedFiles.length > 0 && (
            <div className={`mb-4 p-3 rounded-lg border ${
              isDarkMode 
                ? 'bg-white/5 border-white/10' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                    isDarkMode 
                      ? 'bg-white/10 border-white/20' 
                      : 'bg-white border-gray-300'
                  }`}>
                    <span className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>{file.name}</span>
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
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 rounded-lg transition-all duration-200 ${
                isDarkMode 
                  ? 'hover:bg-white/5 text-white/80 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
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
                className={`pl-12 py-3 text-base text-right backdrop-blur-sm ${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20 focus:border-green-400 focus:ring-green-400 text-white placeholder-white/50' 
                    : 'bg-white/80 border-gray-200 focus:border-green-500 focus:ring-green-500 text-gray-900 placeholder-gray-500'
                }`}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={(!inputValue.trim() && uploadedFiles.length === 0) || isLoading}
              className={`p-3 rounded-lg transition-all duration-200 disabled:opacity-50 ${
                isDarkMode 
                  ? 'hover:bg-white/5 text-white/80 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
              title="שליחת נתונים"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {user && user.messagesUsed >= user.messageLimit * 0.8 && (
            <div className={`mt-3 p-3 rounded-lg border ${
              isDarkMode 
                ? 'bg-yellow-600/20 border-yellow-600/30 text-yellow-300' 
                : 'bg-yellow-50 border-yellow-200 text-yellow-700'
            }`}>
              <p className="text-sm">
                נגמרות לכם ההודעות ({user.messagesUsed}/{user.messageLimit} נשלחו). 
                <Button
                  variant="link"
                  className={`p-0 mr-1 underline ${
                    isDarkMode ? 'text-yellow-300' : 'text-yellow-700'
                  }`}
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
