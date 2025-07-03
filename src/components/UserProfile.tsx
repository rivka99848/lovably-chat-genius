
import React, { useState } from 'react';
import { User, Mail, Crown, Settings, Save, ArrowRight, Edit3, Shield, Bell, Palette, Globe, MessageCircle, Trash2, CreditCard, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import PlanUpgrade from './PlanUpgrade';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  category?: string;
}

interface SavedConversation {
  id: string;
  title: string;
  messages: Message[];
  date: Date;
  category: string;
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
  user: User;
  onClose: () => void;
  onUpdateUser: (updatedUser: User) => void;
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

const UserProfile: React.FC<Props> = ({ user, onClose, onUpdateUser, isDarkMode, onThemeToggle }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [editedCategory, setEditedCategory] = useState(user.category);
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);

  React.useEffect(() => {
    // Load saved conversations
    const saved = localStorage.getItem(`lovable_conversations_${user.id}`);
    if (saved) {
      setSavedConversations(JSON.parse(saved));
    }
  }, [user.id]);

  const handleSave = async () => {
    if (!editedName.trim()) {
      toast({
        title: "שגיאה",
        description: "שם המשתמש לא יכול להיות ריק",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const updatedUser = {
        ...user,
        name: editedName,
        category: editedCategory
      };
      
      onUpdateUser(updatedUser);
      setIsEditing(false);
      
      toast({
        title: "הפרטים נשמרו",
        description: "פרטי החשבון עודכנו בהצלחה"
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "נכשל בשמירת הפרטים",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = (conversationId: string) => {
    const updatedConversations = savedConversations.filter(conv => conv.id !== conversationId);
    setSavedConversations(updatedConversations);
    localStorage.setItem(`lovable_conversations_${user.id}`, JSON.stringify(updatedConversations));
    
    toast({
      title: "השיחה נמחקה",
      description: "השיחה הוסרה בהצלחה"
    });
  };

  const loadConversation = (conversation: SavedConversation) => {
    localStorage.setItem('lovable_chat_history', JSON.stringify(conversation.messages));
    onClose();
    toast({
      title: "השיחה נטענה",
      description: "השיחה נטענה בהצלחה"
    });
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'pro': return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      case 'enterprise': return 'bg-purple-600/20 text-purple-400 border-purple-600/30';
      default: return 'bg-green-600/20 text-green-400 border-green-600/30';
    }
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'pro': return 'מקצועי';
      case 'enterprise': return 'ארגוני';
      default: return 'חינמי';
    }
  };

  if (showUpgrade) {
    return (
      <PlanUpgrade
        user={user}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={(plan) => {
          const updatedUser = { ...user, plan };
          onUpdateUser(updatedUser);
          setShowUpgrade(false);
          toast({
            title: "התוכנית שודרגה",
            description: `שודרגת לתוכנית ${getPlanName(plan)}`
          });
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen premium-gradient ${isDarkMode ? 'dark' : ''}`} dir="rtl">
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className={`${isDarkMode ? 'bg-gray-900/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'} backdrop-blur-xl`}>
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.name}
                  </h1>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {user.email}
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-200/50"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className={`grid w-full grid-cols-3 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <TabsTrigger value="profile" className="flex items-center space-x-2 space-x-reverse">
                  <User className="w-4 h-4" />
                  <span>פרופיל</span>
                </TabsTrigger>
                <TabsTrigger value="billing" className="flex items-center space-x-2 space-x-reverse">
                  <CreditCard className="w-4 h-4" />
                  <span>תשלומים</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center space-x-2 space-x-reverse">
                  <Settings className="w-4 h-4" />
                  <span>הגדרות</span>
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <Card className={`p-6 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      פרטים אישיים
                    </h3>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="p-2 rounded-full hover:bg-gray-200/20 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>שם מלא</Label>
                      {isEditing ? (
                        <Input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className={isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}
                        />
                      ) : (
                        <p className={`p-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {user.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>תחום התמחות</Label>
                      {isEditing ? (
                        <Select value={editedCategory} onValueChange={setEditedCategory}>
                          <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className={`p-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {categories.find(c => c.id === user.category)?.name || user.category}
                        </p>
                      )}
                    </div>

                    {isEditing && (
                      <div className="flex space-x-2 space-x-reverse">
                        <Button onClick={handleSave} disabled={isLoading}>
                          <Save className="w-4 h-4 ml-2" />
                          שמור
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          ביטול
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Saved Conversations */}
                <Card className={`p-6 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'}`}>
                  <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    שיחות שמורות
                  </h3>
                  
                  {savedConversations.length === 0 ? (
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      אין שיחות שמורות
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {savedConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`p-4 rounded-lg border ${
                            isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {conversation.title}
                              </h4>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {conversation.date.toLocaleDateString('he-IL')} • {conversation.messages.length} הודעות
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <button
                                onClick={() => loadConversation(conversation)}
                                className="p-2 rounded-full hover:bg-gray-200/20 transition-colors"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteConversation(conversation.id)}
                                className="p-2 rounded-full hover:bg-red-500/20 text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* Billing Tab */}
              <TabsContent value="billing" className="space-y-6">
                <Card className={`p-6 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'}`}>
                  <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    התוכנית הנוכחית
                  </h3>
                  
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Crown className="w-6 h-6 text-yellow-500" />
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          תוכנית {getPlanName(user.plan)}
                        </p>
                        <Badge className={getPlanColor(user.plan)}>
                          {user.messagesUsed}/{user.messageLimit} הודעות
                        </Badge>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => setShowUpgrade(true)}
                      className="bg-gradient-to-r from-green-600 to-blue-600"
                    >
                      <Zap className="w-4 h-4 ml-2" />
                      שדרג תוכנית
                    </Button>
                  </div>

                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'}`}>
                    <div className="flex justify-between mb-2">
                      <span>שימוש הודעות החודש</span>
                      <span>{user.messagesUsed}/{user.messageLimit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-600 to-blue-600 h-2 rounded-full"
                        style={{ width: `${(user.messagesUsed / user.messageLimit) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <Card className={`p-6 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'}`}>
                  <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    הגדרות כלליות
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <Palette className="w-5 h-5" />
                        <div>
                          <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            מצב כהה
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            החלף בין מצב בהיר לכהה
                          </p>
                        </div>
                      </div>
                      <Switch checked={isDarkMode} onCheckedChange={onThemeToggle} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <Bell className="w-5 h-5" />
                        <div>
                          <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            התראות
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            קבל התראות על עדכונים וחדשות
                          </p>
                        </div>
                      </div>
                      <Switch checked={notifications} onCheckedChange={setNotifications} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <Save className="w-5 h-5" />
                        <div>
                          <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            שמירה אוטומטית
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            שמור שיחות באופן אוטומטי
                          </p>
                        </div>
                      </div>
                      <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
