import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  category: string;
  plan: 'free' | 'pro' | 'enterprise';
  messageLimit: number;
  messagesUsed: number;
  registrationDate: Date;
}

interface Payment {
  id: string;
  amount: number;
  date: Date;
  packageName: string;
  status: 'completed' | 'pending' | 'failed';
  transactionId?: string;
}

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
  isDarkMode: boolean;
  onClose: () => void;
}

const SubscriptionManager: React.FC<Props> = ({ user, onUpdateUser, isDarkMode, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Mock payments data - replace with real data from your backend
  const payments: Payment[] = [
    {
      id: '1',
      amount: 99,
      date: new Date('2024-01-15'),
      packageName: 'חבילת Pro',
      status: 'completed',
      transactionId: 'TXN_123456789'
    },
    {
      id: '2', 
      amount: 99,
      date: new Date('2024-02-15'),
      packageName: 'חבילת Pro',
      status: 'completed',
      transactionId: 'TXN_987654321'
    }
  ];

  const generateEventId = () => {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const generateTransactionId = () => {
    return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'free': return 'חינמי';
      case 'pro': return 'Pro';
      case 'enterprise': return 'Enterprise';
      default: return 'לא ידוע';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanPrice = (plan: string) => {
    switch (plan) {
      case 'pro': return '₪25';
      case 'enterprise': return '₪50';
      default: return 'חינמי';
    }
  };

  const sendWebhook = async (data: any) => {
    try {
      await fetch('https://n8n.chatnaki.co.il/webhook/8736bd97-e422-4fa1-88b7-40822154f84b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error sending webhook:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשליחת המידע לשרת. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    }
  };

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    const eventId = generateEventId();
    const transactionId = generateTransactionId();

    const webhookData = {
      event: "subscription.cancelled",
      event_id: eventId,
      timestamp: new Date().toISOString(),
      transactionId,
      customer: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: (user as any).phone || "",
        category: user.category
      },
      plan_change: {
        previous_plan: user.plan,
        new_plan: "free",
        previous_limit: user.messageLimit,
        new_limit: 50,
        change_type: "cancellation",
        immediate: false,
        reason: "user_initiated"
      },
      source: "subscription_manager"
    };

    await sendWebhook(webhookData);

    onUpdateUser({
      ...user,
      plan: "free",
      messageLimit: 50
    });

    toast({
      title: "החבילה בוטלה",
      description: "החבילה שלך תבוטל בסוף התקופה הנוכחית.",
    });

    setShowCancelConfirm(false);
    setIsLoading(false);
  };

  const handleChangePlan = async (newPlan: 'free' | 'pro' | 'enterprise', newLimit: number) => {
    setIsLoading(true);
    const eventId = generateEventId();
    const transactionId = generateTransactionId();

    const webhookData = {
      event: "subscription.changed",
      event_id: eventId,
      timestamp: new Date().toISOString(),
      transactionId,
      customer: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: (user as any).phone || "",
        category: user.category
      },
      plan_change: {
        previous_plan: user.plan,
        new_plan: newPlan,
        previous_limit: user.messageLimit,
        new_limit: newLimit,
        change_type: "plan_update",
        immediate: true
      },
      source: "subscription_manager"
    };

    await sendWebhook(webhookData);

    onUpdateUser({
      ...user,
      plan: newPlan,
      messageLimit: newLimit
    });

    toast({
      title: "התוכנית עודכנה בהצלחה",
      description: `המנוי שלך שודרג ל-${getPlanName(newPlan)}.`,
    });

    setIsLoading(false);
  };

  const getUsagePercentage = () => {
    return Math.round((user.messagesUsed / user.messageLimit) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              ניהול מנוי
            </h1>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              נהל את המנוי שלך והיסטוריית התשלומים
            </p>
          </div>
          <Button onClick={onClose} variant="outline">
            חזרה
          </Button>
        </div>

        {/* Current Plan */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className={`p-6 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-semibold flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Crown className="w-5 h-5 ml-2 text-yellow-500" />
                  התוכנית הנוכחית
                </h2>
                <Badge className={getPlanColor(user.plan)}>
                  {getPlanName(user.plan)}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    מחיר חודשי:
                  </span>
                  <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {getPlanPrice(user.plan)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    מגבלת טוקנים:
                  </span>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.messageLimit === -1 ? 'ללא הגבלה' : user.messageLimit.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      שימוש נוכחי:
                    </span>
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user.messagesUsed.toLocaleString()} ({getUsagePercentage()}%)
                    </span>
                  </div>
                  <div className={`w-full bg-gray-200 rounded-full h-2 ${isDarkMode ? 'bg-gray-700' : ''}`}>
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
                    />
                  </div>
                </div>

                {/* Cancel subscription */}
                {user.plan !== 'free' && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          רוצה לבטל את המנוי?
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          המנוי יישאר פעיל עד סוף התקופה הנוכחית
                        </p>
                      </div>
                      {!showCancelConfirm ? (
                        <Button
                          onClick={() => setShowCancelConfirm(true)}
                          variant="outline"
                          className="text-red-600 border-red-600/30 hover:bg-red-600/10"
                        >
                          <AlertTriangle className="w-4 h-4 ml-1" />
                          ביטול מנוי
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setShowCancelConfirm(false)}
                            variant="outline"
                            size="sm"
                          >
                            ביטול
                          </Button>
                          <Button
                            onClick={handleCancelSubscription}
                            disabled={isLoading}
                            variant="destructive"
                            size="sm"
                          >
                            {isLoading ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-1" />
                            ) : (
                              <CheckCircle className="w-4 h-4 ml-1" />
                            )}
                            אישור ביטול
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Change plan (דוגמה - את יכולה לעצב אחרת) */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className={`font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    שינוי תוכנית:
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleChangePlan('pro', 300000)} 
                      disabled={isLoading}
                    >
                      Pro
                    </Button>
                    <Button 
                      onClick={() => handleChangePlan('enterprise', -1)} 
                      disabled={isLoading}
                    >
                      Enterprise
                    </Button>
                  </div>
                </div>

              </div>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Card className={`p-4 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{user.messagesUsed.toLocaleString()}</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  טוקנים נשלחו
                </div>
              </div>
            </Card>
            
            <Card className={`p-4 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {user.messageLimit === -1 ? '∞' : Math.max(0, user.messageLimit - user.messagesUsed).toLocaleString()}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  טוקנים נותרו
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Payment History */}
        <Card className={`mt-6 p-6 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-xl font-semibold flex items-center mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <CreditCard className="w-5 h-5 ml-2" />
            היסטוריית תשלומים
          </h2>

          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div 
                  key={payment.id} 
                  className={`p-4 rounded-lg border flex items-center justify-between ${
                    isDarkMode 
                      ? 'bg-gray-800/30 border-gray-700' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`p-2 rounded-full ${
                      payment.status === 'completed' 
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        : payment.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {payment.packageName}
                      </div>
                      <div className={`text-sm flex items-center space-x-2 space-x-reverse ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Calendar className="w-3 h-3" />
                        <span>{payment.date.toLocaleDateString('he-IL')}</span>
                        {payment.transactionId && (
                          <>
                            <span>•</span>
                            <span>מזהה: {payment.transactionId}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      ₪{payment.amount}
                    </div>
                    <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                      {payment.status === 'completed' ? 'הושלם' : 
                       payment.status === 'pending' ? 'ממתין' : 'נכשל'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>אין תשלומים עדיין</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionManager;
