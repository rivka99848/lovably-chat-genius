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

  const PostNedarim = (data: any) => {
    const iframe = document.getElementById('NedarimFrame') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(data, "*");
    }
  };

  const ReadPostMessage = (event: MessageEvent) => {
    // Security: Only accept messages from Nedarim domain
    if (event.origin !== 'https://matara.pro') {
      return;
    }

    console.log('Nedarim message:', event.data);
    
    switch (event.data.Name) {
      case 'Height':
        // Set iframe height dynamically
        const iframe = document.getElementById('NedarimFrame') as HTMLIFrameElement;
        if (iframe) {
          iframe.style.height = (parseInt(event.data.Value) + 15) + "px";
        }
        break;

      case 'TransactionResponse':
        console.log('Transaction response:', event.data.Value);
        if (event.data.Value.Status === 'Error') {
          toast({
            title: "התשלום נכשל",
            description: event.data.Value.Message || "אנא נסה שוב או פנה לתמיכה",
            variant: "destructive"
          });
          onClose();
        } else {
          handlePaymentSuccess();
        }
        break;
    }
  };

  const handlePayButtonClick = () => {
    PostNedarim({
      'Name': 'FinishTransaction2',
      'Value': {
        'Mosad': '2813479',
        'ApiValid': '7jZ+r+ukMw',
        'PaymentType': '1', // Credit card
        'Currency': '1', // ILS
        'Zeout': '',
        'FirstName': user.name,
        'LastName': '',
        'Street': '',
        'City': '',
        'Phone': user.phone || '',
        'Mail': user.email,
        'Amount': packageData.price.toString(),
        'Tashlumim': '1',
        'Groupe': '',
        'Comment': `תשלום עבור ${packageData.name}`,
        'Param1': packageData.name,
        'Param2': user.id,
        'ForceUpdateMatching': '1',
        'CallBack': 'https://n8n.chatnaki.co.il/webhook/f7386e64-b5f4-485b-9de4-7798794f9c72',
        'CallBackMailError': '',
        'Tokef': ''
      }
    });
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
    window.addEventListener('message', ReadPostMessage);
    return () => window.removeEventListener('message', ReadPostMessage);
  }, [user, packageData, onPaymentSuccess, onClose]);

  // Initialize iframe when component opens
  useEffect(() => {
    if (isOpen) {
      setIframeUrl('https://matara.pro/nedarimplus/iframe?language=he');
      toast({
        title: "מעבר לתשלום",
        description: "מועבר לדף התשלום..."
      });
    }
  }, [isOpen]);

  // Setup iframe onload handler
  const handleIframeLoad = () => {
    console.log('StartNedarim');
    PostNedarim({ 'Name': 'GetHeight' });
  };

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

        <div className="px-6 pb-6 space-y-4">
          {iframeUrl && (
            <>
              <div className="relative">
                <iframe
                  id="NedarimFrame"
                  src={iframeUrl}
                  className="w-full h-[300px] border border-gray-300 rounded-lg"
                  title="Nedarim Payment Frame"
                  onLoad={handleIframeLoad}
                />
              </div>
              
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handlePayButtonClick}
                  className="bg-info hover:bg-info/90 text-white px-8 py-2"
                  size="lg"
                >
                  ביצוע תשלום ₪{packageData.price}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentIframe;