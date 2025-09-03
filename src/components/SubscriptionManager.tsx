javascript
import React, { useState } from 'react';
import { Button } from '/components/ui/button';
import { Card } from '/components/ui/card';
import { Badge } from '/components/ui/badge';
import { toast } from '/hooks/use-toast';
import {
  Crown,
  Calendar,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
interface User {
  id: string;
  email: string;
  name: string;
  category: string;
  plan: 'free'  'pro'  'enterprise';
  messageLimit: number;
  messagesUsed: number;
  registrationDate: Date;
}
interface Props {
  user: User;
  onUpdateUser: (user: User)  void;
  isDarkMode: boolean;
  onClose: ()  void;
}
const SubscriptionManager: React.FCProps  ({
  user,
  onUpdateUser,
  isDarkMode,
  onClose,
})  {
  const [isLoading, setIsLoading]  useState(false);
  const [showCancelConfirm, setShowCancelConfirm]  useState(false);
  // מחיקת הנתונים המפוברקים של התשלומים
  const payments: Payment[]  [];
  const generateEventId  ()  {
    return evt_{Date.now()}_{Math.random().toString(36).substr(2, 9)};
  };
  const getPlanName  (plan: string)  {
    switch (plan) {
      case 'free':
        return 'חינמי';
      case 'pro':
        return 'Pro';
      case 'enterprise':
        return 'Enterprise';
      default:
        return 'לא ידוע';
    }
  };
  const getPlanColor  (plan: string)  {
    switch (plan) {
      case 'free':
        return 'bg-gray-100 text-gray-800';
      case 'pro':
        return 'bg-blue-100 text-blue-800';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getPlanPrice  (plan: string)  {
    switch (plan) {
      case 'pro':
        return '99';
      case 'enterprise':
        return '199';
      default:
        return 'חינמי';
    }
  };
  const handleCancelSubscription  async ()  {
    setIsLoading(true);
    const eventId  generateEventId();
    // עדכון המשתמש לתוכנית חינמית
    const updatedUser  {
      ...user,
      plan: 'free' as const,
      messageLimit: 50,
    };
    onUpdateUser(updatedUser);
    toast({
      title: 'החבילה בוטלה',
      description:
        'החבילה שלך תבוטל בסוף התקופה הנוכחית. עד אז תוכל להמשיך להשתמש בשירות הבלתי מוגבל.',
    });
    setShowCancelConfirm(false);
    setIsLoading(false);
  };
  const handleUpgradePlan  ()  {
    // קוד לטיפול בשדרוג התוכנית
    console.log('Upgrading plan');
  };
  const getUsagePercentage  ()  {
    return Math.round((user.messagesUsed / user.messageLimit)  100);
  };
  return (
    // ... הקוד הקודם כפי שהוא ...
    {user.plan  'free'  (
      Button onClick{handleUpgradePlan} variant"default" className"mt-4"
        שדרג לתוכנית Pro
        ArrowRight className"w-4 h-4 ml-2" /
      /Button
    )}
    {user.plan  'pro'  (
      Button onClick{handleUpgradePlan} variant"default" className"mt-4"
        שדרג לתוכנית Enterprise
        ArrowRight className"w-4 h-4 ml-2" /
      /Button
    )}
    {user.plan ! 'free'  (
      Button
        onClick{()  setShowCancelConfirm(true)}
        variant"outline"
        className"text-red-600 border-red-600/30 hover:bg-red-600/10 mt-4"
        AlertTriangle className"w-4 h-4 ml-1" /
        ביטול מנוי
      /Button
    )}
    // ... הקוד הקודם כפי שהוא ...
  );
};
export default SubscriptionManager;