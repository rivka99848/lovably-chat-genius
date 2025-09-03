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

  const constructNedarimUrl = () => {
    // Build Nedarim payment URL with proper format
    const baseUrl = 'https://secure.nedarimplus.com/api/payment';
    const params = {
      amount: packageData.price.toString(), // Keep in shekels for Nedarim
      currency: 'ILS',
      product_name: packageData.name,
      customer_name: user.name,
      customer_email: user.email,
      customer_phone: user.phone || '',
      order_id: `order_${Date.now()}_${user.id}`,
      success_url: `${window.location.origin}/?payment=success`,
      cancel_url: `${window.location.origin}/?payment=cancel`,
      callback_url: 'https://n8n.chatnaki.co.il/webhook/f7386e64-b5f4-485b-9de4-7798794f9c72'
    };
    
    const searchParams = new URLSearchParams(params);
    return `${baseUrl}?${searchParams.toString()}`;
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

  // Set iframe URL when component opens
  useEffect(() => {
    if (isOpen) {
      const url = constructNedarimUrl();
      setIframeUrl(url);
      toast({
        title: "מעבר לתשלום",
        description: "מועבר לדף התשלום..."
      });
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
          {iframeUrl && (
            <div className="relative">
              <iframe
                src={iframeUrl}
                className="w-full h-[600px] border-0 rounded-lg"
                title="Payment Frame"
                sandbox="allow-scripts allow-same-origin allow-forms allow-top-navigation"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentIframe;