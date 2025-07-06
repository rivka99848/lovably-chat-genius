import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Settings, Save, ArrowRight, Plus, Trash2, Edit, Webhook, Crown, Zap, Star } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  limitations: string[];
  color: string;
  icon: string;
  popular: boolean;
  messageLimit: number;
}

interface BotSettings {
  welcomeMessage: string;
  categories: string[];
  webhookUrl: string;
  planChangeWebhook: string;
  systemPrompts: { [key: string]: string };
  plans: Plan[];
  siteSettings: {
    title: string;
    description: string;
    primaryColor: string;
    secondaryColor: string;
  };
}

const defaultPlans: Plan[] = [
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
    icon: 'Star',
    popular: false,
    messageLimit: 50
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
    icon: 'Zap',
    popular: true,
    messageLimit: 500
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
    icon: 'Crown',
    popular: false,
    messageLimit: 2000
  }
];

const Admin = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<BotSettings>({
    welcomeMessage: 'ברוכים הבאים לבוט המסונן שלנו – לצרכי עבודה בלבד',
    categories: ['תכנות', 'עיצוב', 'שיווק', 'כתיבה', 'עסקים'],
    webhookUrl: 'https://n8n.smartbiz.org.il/webhook',
    planChangeWebhook: '',
    systemPrompts: {
      'תכנות': 'אתה מומחה תכנות המסייע בכתיבת קוד ופתרון בעיות טכניות',
      'עיצוב': 'אתה מומחה עיצוב המסייע ביצירת עיצובים ו-UI/UX',
      'שיווק': 'אתה מומחה שיווק המסייע באסטרטגיות שיווק ופרסום',
      'כתיבה': 'אתה מומחה עסקים המסייע בייעוץ עסקי ואסטרטגיה'
    },
    plans: defaultPlans,
    siteSettings: {
      title: 'AI Chat Bot',
      description: 'AI-powered chat assistant for professional use',
      primaryColor: '#10b981',
      secondaryColor: '#3b82f6'
    }
  });
  
  const [newCategory, setNewCategory] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showPlanEditor, setShowPlanEditor] = useState(false);

  useEffect(() => {
    loadSettings();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('bot_admin_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const saveSettings = () => {
    localStorage.setItem('bot_admin_settings', JSON.stringify(settings));
    toast({
      title: "הגדרות נשמרו",
      description: "הגדרות הבוט עודכנו בהצלחה"
    });
  };

  const addNewPlan = () => {
    const newPlan: Plan = {
      id: `plan_${Date.now()}`,
      name: 'תכנית חדשה',
      price: '$0',
      period: '/month',
      description: 'תיאור התכנית',
      features: ['תכונה 1'],
      limitations: [],
      color: 'blue',
      icon: 'Star',
      popular: false,
      messageLimit: 100
    };
    setEditingPlan(newPlan);
    setShowPlanEditor(true);
  };

  const editPlan = (plan: Plan) => {
    setEditingPlan({ ...plan });
    setShowPlanEditor(true);
  };

  const savePlan = () => {
    if (!editingPlan) return;
    
    setSettings(prev => {
      const existingIndex = prev.plans.findIndex(p => p.id === editingPlan.id);
      const newPlans = [...prev.plans];
      
      if (existingIndex >= 0) {
        newPlans[existingIndex] = editingPlan;
      } else {
        newPlans.push(editingPlan);
      }
      
      return { ...prev, plans: newPlans };
    });

    // Trigger webhook if configured
    if (settings.planChangeWebhook) {
      triggerPlanChangeWebhook('plan_updated', editingPlan);
    }

    setShowPlanEditor(false);
    setEditingPlan(null);
    toast({
      title: "תכנית נשמרה",
      description: "התכנית עודכנה בהצלחה"
    });
  };

  const deletePlan = (planId: string) => {
    setSettings(prev => ({
      ...prev,
      plans: prev.plans.filter(p => p.id !== planId)
    }));

    // Trigger webhook if configured
    if (settings.planChangeWebhook) {
      triggerPlanChangeWebhook('plan_deleted', { id: planId });
    }

    toast({
      title: "תכנית נמחקה",
      description: "התכנית הוסרה בהצלחה"
    });
  };

  const triggerPlanChangeWebhook = async (action: string, planData: any) => {
    try {
      await fetch(settings.planChangeWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          plan: planData,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Webhook error:', error);
    }
  };

  const addFeatureToEditingPlan = () => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, 'תכונה חדשה']
    });
  };

  const removeFeatureFromEditingPlan = (index: number) => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: editingPlan.features.filter((_, i) => i !== index)
    });
  };

  const updateFeatureInEditingPlan = (index: number, value: string) => {
    if (!editingPlan) return;
    const newFeatures = [...editingPlan.features];
    newFeatures[index] = value;
    setEditingPlan({
      ...editingPlan,
      features: newFeatures
    });
  };

  const addCategory = () => {
    if (newCategory.trim() && !settings.categories.includes(newCategory.trim())) {
      setSettings(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()],
        systemPrompts: {
          ...prev.systemPrompts,
          [newCategory.trim()]: `אתה מומחה ${newCategory.trim()} המסייע בתחום זה`
        }
      }));
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setSettings(prev => {
      const newSystemPrompts = { ...prev.systemPrompts };
      delete newSystemPrompts[category];
      return {
        ...prev,
        categories: prev.categories.filter(c => c !== category),
        systemPrompts: newSystemPrompts
      };
    });
  };

  const updateSystemPrompt = (category: string, prompt: string) => {
    setSettings(prev => ({
      ...prev,
      systemPrompts: {
        ...prev.systemPrompts,
        [category]: prompt
      }
    }));
  };

  return (
    <div className={`min-h-screen premium-gradient ${isDarkMode ? 'dark text-white' : 'text-gray-900'}`} dir="rtl">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className={isDarkMode ? 'border-gray-700 text-white hover:bg-gray-700' : ''}
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              חזרה לצ'אט
            </Button>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Settings className="w-8 h-8 text-green-400" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                ניהול האתר
              </h1>
            </div>
          </div>
          <Button onClick={saveSettings} className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 ml-2" />
            שמור הגדרות
          </Button>
        </div>

        <div className="space-y-6">
          {/* Site Settings */}
          <Card className={`p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              הגדרות האתר
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  כותרת האתר
                </label>
                <Input
                  value={settings.siteSettings.title}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    siteSettings: { ...prev.siteSettings, title: e.target.value }
                  }))}
                  className={`text-right ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  תיאור האתר
                </label>
                <Input
                  value={settings.siteSettings.description}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    siteSettings: { ...prev.siteSettings, description: e.target.value }
                  }))}
                  className={`text-right ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>
          </Card>

          {/* Plan Management */}
          <Card className={`p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                ניהול תכניות מחיר
              </h2>
              <Button onClick={addNewPlan} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 ml-2" />
                הוסף תכנית
              </Button>
            </div>

            {/* Plan Change Webhook */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <Webhook className="w-4 h-4 inline ml-1" />
                Webhook לשינוי תכניות
              </label>
              <Input
                value={settings.planChangeWebhook}
                onChange={(e) => setSettings(prev => ({ ...prev, planChangeWebhook: e.target.value }))}
                placeholder="https://your-webhook-url.com/plan-changes"
                className={`text-right ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>

            {/* Plans List */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {settings.plans.map((plan) => (
                <Card key={plan.id} className={`p-4 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                    <div className="flex space-x-1 space-x-reverse">
                      <Button size="sm" variant="outline" onClick={() => editPlan(plan)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deletePlan(plan.id)} className="text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {plan.price}{plan.period} - {plan.messageLimit} הודעות
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {plan.features.length} תכונות
                  </p>
                </Card>
              ))}
            </div>
          </Card>

          {/* Plan Editor Modal */}
          {showPlanEditor && editingPlan && (
            <Card className={`fixed inset-0 z-50 m-4 p-6 overflow-y-auto ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  עריכת תכנית: {editingPlan.name}
                </h2>
                <Button variant="outline" onClick={() => setShowPlanEditor(false)}>
                  סגור
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      שם התכנית
                    </label>
                    <Input
                      value={editingPlan.name}
                      onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                      className={`text-right ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      מחיר
                    </label>
                    <Input
                      value={editingPlan.price}
                      onChange={(e) => setEditingPlan({...editingPlan, price: e.target.value})}
                      className={`text-right ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    תיאור
                  </label>
                  <Textarea
                    value={editingPlan.description}
                    onChange={(e) => setEditingPlan({...editingPlan, description: e.target.value})}
                    className={`text-right ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      תכונות
                    </label>
                    <Button size="sm" onClick={addFeatureToEditingPlan}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {editingPlan.features.map((feature, index) => (
                      <div key={index} className="flex space-x-2 space-x-reverse">
                        <Input
                          value={feature}
                          onChange={(e) => updateFeatureInEditingPlan(index, e.target.value)}
                          className={`text-right ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        />
                        <Button size="sm" variant="outline" onClick={() => removeFeatureFromEditingPlan(index)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 space-x-reverse">
                  <Button variant="outline" onClick={() => setShowPlanEditor(false)}>
                    ביטול
                  </Button>
                  <Button onClick={savePlan} className="bg-green-600 hover:bg-green-700">
                    שמור תכנית
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Welcome Message */}
          <Card className={`p-6 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              הודעת ברכה
            </h2>
            <Textarea
              value={settings.welcomeMessage}
              onChange={(e) => setSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
              className={`min-h-[100px] text-right ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              placeholder="הזן את הודעת הברכה..."
            />
          </Card>

          {/* Categories Management */}
          <Card className={`p-6 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              ניהול קטגוריות
            </h2>
            
            {/* Add new category */}
            <div className="flex space-x-2 space-x-reverse mb-4">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="קטגוריה חדשה..."
                className={`flex-1 text-right ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
              <Button onClick={addCategory} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Categories list */}
            <div className="space-y-4">
              {settings.categories.map((category) => (
                <div key={category} className={`p-4 rounded-lg border ${
                  isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {category}
                    </h3>
                    <Button
                      onClick={() => removeCategory(category)}
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={settings.systemPrompts[category] || ''}
                    onChange={(e) => updateSystemPrompt(category, e.target.value)}
                    placeholder="הזן את ההנחיות למומחה בקטגוריה זו..."
                    className={`text-right ${
                      isDarkMode 
                        ? 'bg-gray-600 border-gray-500 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Webhook URL */}
          <Card className={`p-6 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              כתובת Webhook
            </h2>
            <Input
              value={settings.webhookUrl}
              onChange={(e) => setSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
              className={`text-right ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              placeholder="https://..."
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
