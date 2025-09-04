import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  AlertTriangle,
  ArrowRight,
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
  subscriptionStatus?: 'free' | 'active' | 'cancel_pending' | 'expired';
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
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

  // Check for expired subscriptions and auto-downgrade
  useEffect(() => {
    const checkSubscriptionExpiry = () => {
      if (user.subscriptionStatus === 'cancel_pending' && user.subscriptionEndDate) {
        const now = new Date();
        const endDate = new Date(user.subscriptionEndDate);
        
        if (now > endDate) {
          // Subscription has expired, downgrade to free
          const updatedUser = {
            ...user,
            plan: 'free' as const,
            messageLimit: 50,
            subscriptionStatus: 'expired' as const
          };
          
          onUpdateUser(updatedUser);
          
          toast({
            title: "המנוי הסתיים",
            description: "החבילה שלך הועברה לחבילה החינמית",
          });
          
          // Optional: Send webhook about expired subscription
          const webhookData = {
            event: "subscription.expired",
            timestamp: new Date().toISOString(),
            customer: {
              id: user.id,
              email: user.email,
              name: user.name,
              category: user.category
            },
            plan_change: {
              previous_plan: user.plan,
              new_plan: "free",
              expired_at: new Date().toISOString()
            }
          };
          
          fetch('https://n8n.chatnaki.co.il/webhook/8736bd97-e422-4fa1-88b7-40822154f84b', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookData)
          }).catch(error => console.error('Failed to send expiry webhook:', error));
        }
      }
    };

    // Check on mount
    checkSubscriptionExpiry();
    
    // Check every minute
    const interval = setInterval(checkSubscriptionExpiry, 60000);
    
    return () => clearInterval(interval);
  }, [user, onUpdateUser]);

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
      case 'pro': return '₪99';
      case 'enterprise': return '₪199';
      default: return 'חינמי';
    }
  };

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    const eventId = generateEventId();
    
    // Calculate month end date
    const now = new Date();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const webhookData = {
      event: "subscription.cancellation_requested",
      event_id: eventId,
      timestamp: new Date().toISOString(),
      customer: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: (user as any).phone || "",
        category: user.category
      },
      plan_change: {
        current_plan: user.plan,
        current_limit: user.messageLimit,
        requested_at: new Date().toISOString(),
        effective_date: monthEnd.toISOString(),
        change_type: "cancellation",
        immediate: false,
        reason: "user_initiated"
      },
      source: "subscription_manager"
    };

    try {
      await fetch('https://n8n.chatnaki.co.il/webhook/8736bd97-e422-4fa1-88b7-40822154f84b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      // Update user locally - don't change plan yet, just set cancellation status
      const updatedUser = {
        ...user,
        subscriptionStatus: 'cancel_pending' as const,
        subscriptionEndDate: monthEnd
      };
      
      onUpdateUser(updatedUser);
      
      toast({
        title: "בקשת ביטול נשלחה",
        description: `החבילה שלך תבוטל ב-${monthEnd.toLocaleDateString('he-IL')}. עד אז תוכל להמשיך להשתמש בשירות הבלתי מוגבל.`,
      });
      
      setShowCancelConfirm(false);
      
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בביטול החבילה. נסה שוב מאוחר יותר.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Plan */}
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

                {user.plan !== 'free' && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    {user.subscriptionStatus === 'cancel_pending' ? (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 ml-2" />
                          <div>
                            <p className={`font-medium text-yellow-800 dark:text-yellow-200`}>
                              ביטול מנוי מתוכנן
                            </p>
                            <p className={`text-sm text-yellow-700 dark:text-yellow-300`}>
                              המנוי יבוטל ב-{user.subscriptionEndDate ? new Date(user.subscriptionEndDate).toLocaleDateString('he-IL') : 'תאריך לא ידוע'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
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
                    )}
                  </div>
                )}
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