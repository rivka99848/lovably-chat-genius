import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface Package {
  id: string;
  name: string;
  price: number;
  messageLimit: number;
  features: string[];
  type: 'free' | 'pro' | 'enterprise';
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
}

interface PaymentIframeProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  packageData: Package;
  onPaymentSuccess: (updatedUser: User) => void;
  isDarkMode: boolean;
}

const PaymentIframe: React.FC<PaymentIframeProps> = ({
  isOpen,
  onClose,
  user,
  packageData,
  onPaymentSuccess,
  isDarkMode
}) => {
  const [iframeUrl, setIframeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const generateEventId = () => {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const sendPaymentSuccessWebhook = async (eventId: string) => {
    const webhookData = {
      event: "payment.succeeded",
      event_id: eventId,
      timestamp: new Date().toISOString(),
      transaction: {
        id: `txn_${Date.now()}`,
        amount: packageData.price * 100, // convert to agorot
        currency: "ILS",
        status: "completed",
        method: "credit_card"
      },
      customer: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone || "",
        category: user.category
      },
      plan_change: {
        previous_plan: user.plan,
        new_plan: packageData.type,
        previous_limit: user.messageLimit,
        new_limit: packageData.messageLimit,
        change_type: "upgrade",
        immediate: true
      },
      source: "chat_naki_app"
    };

    try {
      await fetch('https://n8n.chatnaki.co.il/webhook/f7386e64-b5f4-485b-9de4-7798794f9c72', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      console.log('Payment success webhook sent:', webhookData);
    } catch (error) {
      console.error('Error sending payment success webhook:', error);
    }
  };

  const initializePayment = async () => {
    setIsLoading(true);
    try {
      // Send request to get iframe URL (existing n8n webhook)
      const webhookUrl = 'https://n8n.chatnaki.co.il/webhook/ec08226c-892c-48e2-b5e1-25fe521d186f';
      
      const requestData = {
        customer: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone || '',
          currentPlan: user.plan,
          messagesUsed: user.messagesUsed,
          messageLimit: user.messageLimit,
          tokensUsed: user.messagesUsed,
          tokenLimit: user.messageLimit
        },
        package: {
          id: packageData.id,
          name: packageData.name,
          price: packageData.price,
          type: packageData.type,
          messageLimit: packageData.messageLimit,
          tokenLimit: packageData.messageLimit,
          features: packageData.features
        },
        paymentId: Date.now().toString(),
        timestamp: new Date().toISOString()
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.paymentIframe) {
        setIframeUrl(result.paymentIframe);
        toast({
          title: "מעבר לתשלום",
          description: "מועבר לדף התשלום..."
        });
      } else {
        throw new Error('לא התקבל קישור לדף התשלום');
      }
      
    } catch (error) {
      console.error('Error initializing payment:', error);
      toast({
        title: "שגיאה",
        description: "נכשל בעיבוד התשלום. אנא נסה שוב.",
        variant: "destructive"
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    const eventId = generateEventId();
    
    // Update user data
    const updatedUser = {
      ...user,
      plan: packageData.type,
      messageLimit: packageData.messageLimit
    };

    // Send success webhook
    await sendPaymentSuccessWebhook(eventId);

    // Call parent success handler
    onPaymentSuccess(updatedUser);

    toast({
      title: "התשלום אושר!",
      description: `החבילה ${packageData.name} הופעלה בהצלחה`
    });

    onClose();
  };

  // Listen for messages from iframe (Nedarim response)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: Only accept messages from Nedarim domain
      if (event.origin !== 'https://secure.nedarimplus.com' && 
          event.origin !== 'https://nedarimplus.com') {
        return;
      }

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (data.type === 'TransactionResponse') {
          if (data.status === 'success' || data.status === 'approved') {
            handlePaymentSuccess();
          } else if (data.status === 'failed' || data.status === 'error') {
            toast({
              title: "התשלום נכשל",
              description: data.message || "אנא נסה שוב או פנה לתמיכה",
              variant: "destructive"
            });
            onClose();
          }
        }
      } catch (error) {
        console.error('Error parsing message from iframe:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user, packageData, onPaymentSuccess, onClose]);

  // Initialize payment when component opens
  useEffect(() => {
    if (isOpen) {
      initializePayment();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] p-0 ${
        isDarkMode 
          ? 'bg-gray-900 border-gray-700' 
          : 'bg-white border-gray-200'
      }`} dir="rtl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <span>תשלום עבור {packageData.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="mr-4">טוען את דף התשלום...</span>
            </div>
          ) : iframeUrl ? (
            <div className="relative">
              <iframe
                src={iframeUrl}
                className="w-full h-[600px] border-0 rounded-lg"
                title="Payment Frame"
                sandbox="allow-scripts allow-same-origin allow-forms allow-top-navigation"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="text-red-500 text-lg mb-2">שגיאה בטעינת דף התשלום</div>
                <Button onClick={initializePayment} variant="outline">
                  נסה שוב
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentIframe;