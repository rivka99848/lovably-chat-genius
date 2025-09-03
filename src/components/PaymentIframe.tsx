import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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

  const sendPaymentSuccessWebhook = async (transactionId: string) => {
    const webhookData = {
      event: "subscription.created",
      event_id: transactionId,
      timestamp: new Date().toISOString(),
      subscription: {
        id: transactionId,
        amount: packageData.price * 100, // convert to agorot
        currency: "ILS",
        status: "active",
        method: "credit_card",
        billing_cycle: "monthly",
        start_date: new Date().toISOString(),
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
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
          const transactionId = event.data.Value.TransactionId;
          console.log('TransactionId received from Nedarim:', transactionId);
          handlePaymentSuccess(transactionId);
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
        'Tashlumim': '12', // 12 monthly payments for subscription
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

  const handlePaymentSuccess = async (transactionId?: string) => {
    const finalTransactionId = transactionId || generateEventId();
    console.log('Processing payment success with TransactionId:', finalTransactionId);
    
    // Update user data
    const updatedUser = {
      ...user,
      plan: packageData.type,
      messageLimit: packageData.messageLimit
    };

    // Send success webhook with real TransactionId
    await sendPaymentSuccessWebhook(finalTransactionId);

    // Call parent success handler
    onPaymentSuccess(updatedUser);

    toast({
      title: "המנוי אושר!",
      description: `מנוי ${packageData.name} הופעל בהצלחה - חיוב חודשי של ₪${packageData.price}`
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
    
    // Inject CSS for blue borders on input fields
    setTimeout(() => {
      PostNedarim({
        'Name': 'InjectCSS',
        'Value': `
          input[type="text"], 
          input[type="email"], 
          input[type="tel"], 
          input[type="number"],
          select,
          textarea {
            border: 2px solid #3b82f6 !important;
            border-radius: 6px !important;
            transition: border-color 0.2s ease !important;
          }
          input[type="text"]:focus, 
          input[type="email"]:focus, 
          input[type="tel"]:focus, 
          input[type="number"]:focus,
          select:focus,
          textarea:focus {
            border-color: #1d4ed8 !important;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
            outline: none !important;
          }
        `
      });
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-md max-h-[70vh] overflow-y-auto p-0 ${
        isDarkMode 
          ? 'bg-card border-border' 
          : 'bg-card border-border'
      }`} dir="rtl">
        {/* Header with logo and close button */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            {/* Logo placeholder - will be replaced with actual logo */}
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">C</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">ChatNaki</h2>
              <p className="text-sm text-muted-foreground">מערכת תשלומים</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Payment details */}
        <div className="p-6 border-b border-border bg-muted/20">
          <div className="text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">
              {packageData.name}
            </h3>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-3xl font-bold text-primary">₪{packageData.price}</span>
              <span className="text-sm text-muted-foreground">לחודש</span>
            </div>
          </div>
        </div>

        {/* Payment iframe */}
        <div className="p-3 space-y-3 overflow-y-auto max-h-[50vh]">
          {iframeUrl && (
            <>
              <div className="relative bg-background rounded-lg border-2 border-primary/20 overflow-hidden shadow-sm">
                <iframe
                  id="NedarimFrame"
                  src={iframeUrl}
                  className="w-full min-h-[350px] border-0"
                  title="Nedarim Payment Frame"
                  onLoad={handleIframeLoad}
                />
              </div>
              
              <div className="flex justify-center pt-2">
                <Button
                  onClick={handlePayButtonClick}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-medium py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                >
                  <span className="flex items-center gap-2">
                    💳 הרשמה למנוי ₪{packageData.price}/חודש
                  </span>
                </Button>
              </div>
              
              <div className="text-center text-xs text-muted-foreground mt-4">
                🔒 תשלום מאובטח באמצעות נדרים פלוס
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentIframe;