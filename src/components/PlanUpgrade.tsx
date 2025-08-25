
import React from 'react';
import { Crown, Check, X, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  user: User | null;
  onClose: () => void;
  onUpgrade: (plan: 'pro' | 'enterprise') => void;
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for getting started',
    features: [
      '50 messages per month',
      'Access to all AI assistants',
      'Basic chat history',
      'Email support'
    ],
    limitations: [
      'Limited messages',
      'No priority support',
      'Basic features only'
    ],
    color: 'gray',
    icon: Star
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'Best for professionals',
    features: [
      '500 messages per month',
      'Priority AI responses',
      'Advanced code preview',
      'Chat export & backup',
      'Priority email support',
      'Advanced integrations'
    ],
    limitations: [],
    color: 'green',
    icon: Zap,
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$49',
    period: '/month',
    description: 'For teams and power users',
    features: [
      'Unlimited messages',
      'Custom AI training',
      'API access',
      'Team collaboration',
      'Custom integrations',
      'Dedicated support',
      'Advanced analytics',
      'White-label options'
    ],
    limitations: [],
    color: 'blue',
    icon: Crown
  }
];

const PlanUpgrade: React.FC<Props> = ({ user, onClose, onUpgrade }) => {
  const handleUpgrade = (planId: string) => {
    if (planId === 'pro' || planId === 'enterprise') {
      // In a real app, this would integrate with Stripe or another payment processor
      onUpgrade(planId as 'pro' | 'enterprise');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        <Card className="p-8 bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                Upgrade Your Plan
              </h1>
              <p className="text-gray-600">
                Choose the perfect plan for your needs. Upgrade or downgrade anytime.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {user && user.messagesUsed >= user.messageLimit && (
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">Message limit reached!</p>
                  <p className="text-sm text-yellow-700">
                    You've used all {user.messageLimit} messages for this month. Upgrade to continue chatting.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const IconComponent = plan.icon;
              const isCurrentPlan = user?.plan === plan.id;
              
              return (
                <Card
                  key={plan.id}
                  className={`p-6 relative transition-all duration-300 ${
                    plan.popular 
                      ? 'ring-2 ring-green-500 scale-105' 
                      : 'hover:shadow-lg border-2 hover:border-green-200'
                  } ${isCurrentPlan ? 'bg-green-50 border-green-300' : ''}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white">
                      Most Popular
                    </Badge>
                  )}
                  
                  {isCurrentPlan && (
                    <Badge className="absolute -top-3 right-4 bg-blue-600 text-white">
                      Current Plan
                    </Badge>
                  )}

                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
                      plan.color === 'green' ? 'bg-green-100 text-green-600' :
                      plan.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                    <div className="mb-2">
                      <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600">{plan.period}</span>
                    </div>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                    
                    {plan.limitations.map((limitation, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span className="text-sm text-gray-500">{limitation}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrentPlan || plan.id === 'free'}
                    className={`w-full ${
                      plan.popular
                        ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700'
                        : plan.color === 'blue'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-600 hover:bg-gray-700'
                    } ${isCurrentPlan ? 'bg-gray-400 cursor-not-allowed' : ''}`}
                  >
                    {isCurrentPlan ? 'Current Plan' : 
                     plan.id === 'free' ? 'Current Plan' : 
                     `Upgrade to ${plan.name}`}
                  </Button>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-4">
              All plans include access to our four specialized AI assistants: Programming, Architecture, Writing, and Design.
            </p>
            <div className="flex justify-center space-x-6 text-xs text-gray-400">
              <span>✓ No setup fees</span>
              <span>✓ Cancel anytime</span>
              <span>✓ 30-day money back guarantee</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PlanUpgrade;
