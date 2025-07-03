import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MessageBubble from './MessageBubble';
import CategorySelector from './CategorySelector';
import CodePreview from './CodePreview';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

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

interface Props {
  user: User | null;
  onSignOut: () => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

const categories = [
  { id: 'programming', name: 'תכנות' },
  { id: 'architecture', name: 'אדריכלות ועיצוב פנים' },
  { id: 'writing', name: 'כתיבה ותמלול' },
  { id: 'design', name: 'גרפיקה ועיצוב' },
  { id: 'copywriting', name: 'ניסוח ושכתוב' }
];

const ChatInterface: React.FC<Props> = ({ 
  user, 
  onSignOut, 
  isDarkMode, 
  onThemeToggle 
}) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isCodeVisible, setIsCodeVisible] = useState(false);
  const [codeContent, setCodeContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load chat history from localStorage
    const savedChatHistory = localStorage.getItem('lovable_chat_history');
    if (savedChatHistory) {
      setMessages(JSON.parse(savedChatHistory));
    }

    // Scroll to bottom on initial load and when messages update
    scrollToBottom();
  }, []);

  useEffect(() => {
    // Save chat history to localStorage
    localStorage.setItem('lovable_chat_history', JSON.stringify(messages));

    // Scroll to bottom when messages update
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    // Scroll to bottom of chat container
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      isUser: true,
      timestamp: new Date(),
      category: selectedCategory
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setNewMessage('');

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiResponse: Message = {
        id: Date.now().toString(),
        content: `תגובת AI: ${newMessage}`,
        isUser: false,
        timestamp: new Date(),
        category: selectedCategory
      };
      setMessages(prevMessages => [...prevMessages, aiResponse]);
      if (user) {
        const updatedUser = {
          ...user,
          messagesUsed: user.messagesUsed + 1
        };
        localStorage.setItem('lovable_user', JSON.stringify(updatedUser));
      }
    }, 500);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachCode = () => {
    setIsCodeVisible(true);
  };

  const handleCodeSubmit = (code: string) => {
    setCodeContent(code);
    setIsCodeVisible(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: `קוד מצורף:\n${code}`,
      isUser: true,
      timestamp: new Date(),
      category: selectedCategory
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
  };

  const handleSignOutClick = () => {
    localStorage.removeItem('lovable_user');
    toast({
      title: "התנתקת בהצלחה",
      description: "הועברת לדף הבית"
    });
    onSignOut();
  };

  return (
    <div className={`flex flex-col h-screen premium-gradient ${isDarkMode ? 'dark' : ''}`} dir="rtl">
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b backdrop-blur-xl ${
        isDarkMode 
          ? 'bg-gray-900/50 border-gray-700/50' 
          : 'bg-white/50 border-gray-200/50'
      }`}>
        <div className="flex items-center space-x-4 space-x-reverse">
          <h1 className={`text-2xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Lovable AI
          </h1>
          
          <CategorySelector
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Profile/Settings Button */}
        <div className="flex items-center space-x-2 space-x-reverse">
          {user && (
            <div className="flex items-center space-x-2 space-x-reverse">
              <Badge className={`${
                user.plan === 'pro' ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' :
                user.plan === 'enterprise' ? 'bg-purple-600/20 text-purple-400 border-purple-600/30' :
                'bg-green-600/20 text-green-400 border-green-600/30'
              }`}>
                {user.messagesUsed}/{user.messageLimit}
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/profile')}
                className={`premium-icon-button rounded-full w-10 h-10 p-0 ${
                  isDarkMode 
                    ? 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300' 
                    : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-700'
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} isDarkMode={isDarkMode} />
        ))}
      </div>

      {/* Input Area */}
      <Card className={`m-4 p-4 ${isDarkMode ? 'bg-gray-900/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button variant="ghost" onClick={handleAttachCode} className={isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}>
            <Paperclip className="w-5 h-5" />
          </Button>
          <Textarea
            placeholder="כתוב הודעה..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`flex-1 resize-none ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
          />
          <Button onClick={handleSendMessage} className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
            <Send className="w-5 h-5 ml-2" />
            שלח
          </Button>
        </div>
      </Card>

      {/* Code Preview */}
      {isCodeVisible && (
        <CodePreview
          isVisible={isCodeVisible}
          onClose={() => setIsCodeVisible(false)}
          onSubmit={handleCodeSubmit}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

export default ChatInterface;
