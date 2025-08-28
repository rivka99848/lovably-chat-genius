import React, { useState } from 'react';
import { Crown, Package, CreditCard, X, Check, Zap, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface Package {
  id: string;
  name: string;
  price: number;
  messageLimit: number;
  features: string[];
  type: 'free' | 'pro' | 'enterprise';
  popular?: boolean;
}

interface Payment {
  id: string;
  packageName: string;
  amount: number;
  date: Date;
  status: 'pending' | 'completed' | 'failed';
  startDate?: Date;
  endDate?: Date;
}

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  category: string;
  plan: 'free' | 'pro' | 'enterprise';
  messagesUsed: number;
  messageLimit: number;
  payments?: Payment[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  isDarkMode: boolean;
}

const packages: Package[] = [
  {
    id: '1',
    name: 'חבילה חינם',
    price: 0,
    messageLimit: 50,
    features: ['50 הודעות חינם', 'תמיכה בסיסית', 'גישה לכל התכונות הבסיסיות'],
    type: 'free'
  },
  {
    id: '2',
    name: 'חבילה מקצועית',
    price: 29,
    messageLimit: 500,
    features: ['500 הודעות', 'תמיכה מועדפת', 'גישה מוקדמת לתכונות', 'ייצוא שיחות', 'אולוית עדיפות'],
    type: 'pro',
    popular: true
  },
  {
    id: '3',
    name: 'חבילה ארגונית',
    price: 99,
    messageLimit: 2000,
    features: ['2000 הודעות', 'תמיכה 24/7', 'ניהול צוות', 'דוחות מתקדמים', 'אינטגרציות מותאמות אישית', 'נהל מרובה'],
    type: 'enterprise'
  }
];

const PlanUpgrade: React.FC<Props> = ({ isOpen, onClose, user, onUpdateUser, isDarkMode }) => {
  const [pendingPayments, setPendingPayments] = useState<Set<string>>(new Set());

  const handlePayment = async (packageData: Package) => {
    try {
      // Create pending payment ID
      const paymentId = Date.now().toString();
      setPendingPayments(prev => new Set([...prev, paymentId]));

      // Send webhook to n8n with customer and package data
      const webhookUrl = 'https://n8n.chatnaki.co.il/webhook/ec08226c-892c-48e2-b5e1-25fe521d186f';
      
      const webhookData = {
        customer: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone || '',
          currentPlan: user.plan,
          messagesUsed: user.messagesUsed,
          messageLimit: user.messageLimit
        },
        package: {
          id: packageData.id,
          name: packageData.name,
          price: packageData.price,
          type: packageData.type,
          messageLimit: packageData.messageLimit,
          features: packageData.features
        },
        paymentId: paymentId,
        timestamp: new Date().toISOString()
      };

      toast({
        title: "שולח פרטי תשלום",
        description: "מכין דף תשלום מותאם אישית..."
      });

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Expecting iframe URL in the response
      if (result.paymentIframe) {
        // Open payment iframe in a popup
        const popupFeatures = 'width=800,height=700,scrollbars=yes,resizable=yes,centerscreen=yes,location=no,menubar=no,toolbar=no,status=no';
        window.open(result.paymentIframe, 'paymentPopup', popupFeatures);
        
        toast({
          title: "מעבר לתשלום",
          description: "מועבר לדף התשלום המותאם..."
        });

        // Check payment status periodically
        checkPaymentStatus(paymentId, packageData);
      } else {
        throw new Error('לא התקבל קישור לדף התשלום');
      }
      
    } catch (error) {
      console.error('Error sending webhook:', error);
      const currentPaymentId = Date.now().toString(); // fallback ID
      setPendingPayments(prev => {
        const newSet = new Set(prev);
        // Remove any pending payment ID
        prev.forEach(id => newSet.delete(id));
        return newSet;
      });
      
      toast({
        title: "שגיאה",
        description: "נכשל בעיבוד התשלום. אנא נסה שוב.",
        variant: "destructive"
      });
    }
  };

  const checkPaymentStatus = async (paymentId: string, packageData: Package) => {
    const maxAttempts = 10;
    let attempts = 0;
    
    const intervalId = setInterval(async () => {
      attempts++;
      
      try {
        const response = await fetch('https://n8n.smartbiz.org.il/webhook/payment-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentId: paymentId,
            userId: user.id
          })
        });

        if (response.ok) {
          const result = await response.json();
          
          if (result.status === 'completed') {
            // Payment successful - update user plan
            const updatedUser = {
              ...user,
              plan: packageData.type,
              messageLimit: packageData.messageLimit,
              messagesUsed: user.messagesUsed
            };
            
            setPendingPayments(prev => {
              const newSet = new Set(prev);
              newSet.delete(paymentId);
              return newSet;
            });
            
            onUpdateUser(updatedUser);
            
            toast({
              title: "התשלום אושר!",
              description: `החבילה ${packageData.name} הופעלה בהצלחה`
            });
            
            onClose();
            clearInterval(intervalId);
          } else if (result.status === 'failed') {
            // Payment failed
            setPendingPayments(prev => {
              const newSet = new Set(prev);
              newSet.delete(paymentId);
              return newSet;
            });
            
            toast({
              title: "התשלום נכשל",
              description: "אנא נסה שוב או פנה לתמיכה",
              variant: "destructive"
            });
            
            clearInterval(intervalId);
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(intervalId);
        setPendingPayments(prev => {
          const newSet = new Set(prev);
          newSet.delete(paymentId);
          return newSet;
        });
      }
    }, 5000); // Check every 5 seconds
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'pro': return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      case 'enterprise': return 'bg-purple-600/20 text-purple-400 border-purple-600/30';
      default: return 'bg-green-600/20 text-green-400 border-green-600/30';
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'pro': return <Zap className="w-4 h-4" />;
      case 'enterprise': return <Users className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${
        isDarkMode 
          ? 'bg-gray-900/95 border-gray-700/50 text-white' 
          : 'bg-white/95 border-gray-200 text-gray-900'
      }`} dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center">
            <Crown className="w-6 h-6 ml-2 text-yellow-500" />
            שדרוג החבילה
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Plan */}
          <div className={`p-4 rounded-lg border ${
            isDarkMode 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
                  {getPlanIcon(user.plan)}
                </div>
                <div>
                  <div className="font-medium">החבילה הנוכחית שלך</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {user.messagesUsed}/{user.messageLimit} הודעות בשימוש
                  </div>
                </div>
              </div>
              <Badge className={getPlanColor(user.plan)}>
                {packages.find(p => p.type === user.plan)?.name || 'חבילה חינם'}
              </Badge>
            </div>
          </div>

          {/* Available Plans */}
          <div>
            <h3 className="text-lg font-semibold mb-4">בחר חבילה</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <Card key={pkg.id} className={`relative p-6 ${
                  isDarkMode 
                    ? 'bg-gray-800/50 border-gray-700' 
                    : 'bg-gray-50 border-gray-200'
                } ${
                  pkg.popular ? 'ring-2 ring-blue-500/50' : ''
                } ${
                  user.plan === pkg.type ? 'opacity-50' : ''
                }`}>
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white border-blue-600">
                        <Star className="w-3 h-3 ml-1" />
                        הכי פופולרי
                      </Badge>
                    </div>
                  )}
                  
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      {getPlanIcon(pkg.type)}
                    </div>
                    <h4 className="text-xl font-bold">{pkg.name}</h4>
                    <div className={`text-3xl font-bold mt-2 ${
                      pkg.price === 0 ? 'text-green-400' : 'text-blue-400'
                    }`}>
                      {pkg.price === 0 ? 'חינם' : `₪${pkg.price}`}
                      {pkg.price > 0 && (
                        <span className={`text-sm font-normal ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          /חודש
                        </span>
                      )}
                    </div>
                    <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {pkg.messageLimit} הודעות
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {pkg.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 space-x-reverse">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {user.plan === pkg.type ? (
                    <Button disabled className="w-full" variant="outline">
                      החבילה הנוכחית
                    </Button>
                  ) : pkg.price === 0 ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        const updatedUser = {
                          ...user,
                          plan: pkg.type,
                          messageLimit: pkg.messageLimit
                        };
                        onUpdateUser(updatedUser);
                        toast({
                          title: "החבילה שונתה",
                          description: "עברת לחבילה החינם"
                        });
                        onClose();
                      }}
                    >
                      עבור לחבילה
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handlePayment(pkg)}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                      disabled={pendingPayments.size > 0}
                    >
                      <CreditCard className="w-4 h-4 ml-2" />
                      {pendingPayments.size > 0 ? 'מעבד תשלום...' : 'שדרג עכשיו'}
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className={`p-4 rounded-lg border ${
            isDarkMode 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <h4 className="font-semibold mb-2">למה לשדרג?</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Check className="w-4 h-4 text-green-400" />
                <span>יותר הודעות לשימוש</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Check className="w-4 h-4 text-green-400" />
                <span>תמיכה מהירה יותר</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Check className="w-4 h-4 text-green-400" />
                <span>תכונות מתקדמות</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Check className="w-4 h-4 text-green-400" />
                <span>גישה מוקדמת לעדכונים</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlanUpgrade;