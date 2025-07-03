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
      case 'enterprise': return '
